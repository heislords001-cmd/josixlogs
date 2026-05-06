import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { listing_id } = await req.json()
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use service role for atomic operations
    const admin = await createAdminClient()

    // 1. Fetch user profile + listing in parallel
    const [profileRes, listingRes] = await Promise.all([
      admin.from('profiles').select('id,wallet_balance,is_banned').eq('id', user.id).single(),
      admin.from('listings')
        .select('id,price,stock,is_active,delivery_type,service_id,country_code,country_name,service:services(name,category:categories(name))')
        .eq('id', listing_id)
        .single(),
    ])

    if (profileRes.error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (listingRes.error) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const profile = profileRes.data
    const listing = listingRes.data as any

    if (profile.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    if (!listing.is_active || listing.stock < 1)
      return NextResponse.json({ error: 'Item out of stock' }, { status: 409 })
    if (profile.wallet_balance < listing.price)
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 402 })

    // 2. Grab an available listing item
    const { data: item, error: itemErr } = await admin
      .from('listing_items')
      .select('id,content')
      .eq('listing_id', listing_id)
      .eq('is_sold', false)
      .limit(1)
      .single()

    if (itemErr || !item) {
      // Out of stock — mark listing inactive
      await admin.from('listings').update({ is_active: false, stock: 0 }).eq('id', listing_id)
      return NextResponse.json({ error: 'No items available, please contact support' }, { status: 409 })
    }

    const newBalance = Number(profile.wallet_balance) - Number(listing.price)

    // 3. Create order
    const { data: order, error: orderErr } = await admin.from('orders').insert({
      user_id: user.id,
      listing_id,
      listing_item_id: item.id,
      amount: listing.price,
      status: 'completed',
      country_code: listing.country_code,
      country_name: listing.country_name,
      service_name: listing.service?.name,
      category_name: listing.service?.category?.name,
      delivered_content: item.content,
    }).select('id').single()

    if (orderErr) throw new Error('Failed to create order: ' + orderErr.message)

    // 4. Mark item as sold
    const { error: itemUpdateErr } = await admin.from('listing_items').update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      order_id: order.id,
    }).eq('id', item.id)

    if (itemUpdateErr) throw new Error('Failed to mark item sold: ' + itemUpdateErr.message)

    // 5. Deduct wallet balance
    const { error: walletErr } = await admin.from('profiles')
      .update({ wallet_balance: newBalance }).eq('id', user.id)

    if (walletErr) throw new Error('Wallet update failed: ' + walletErr.message)

    // 6. Record wallet transaction
    await admin.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'purchase',
      amount: -listing.price,
      balance_before: profile.wallet_balance,
      balance_after: newBalance,
      status: 'success',
      order_id: order.id,
    })

    return NextResponse.json({
      message: 'Purchase successful',
      order_id: order.id,
      delivered_content: item.content,
      new_balance: newBalance,
    })
  } catch (err: any) {
    console.error('Purchase error:', err)
    return NextResponse.json({ error: err.message || 'Purchase failed' }, { status: 500 })
  }
}
