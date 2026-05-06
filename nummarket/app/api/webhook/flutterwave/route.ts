import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH
    const signature = req.headers.get('verif-hash')

    if (secretHash && signature !== secretHash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { event, data } = body
    if (event !== 'charge.completed') return NextResponse.json({ status: 'ignored' })
    if (data.status !== 'successful') return NextResponse.json({ status: 'not successful' })

    const reference = data.tx_ref as string
    const amount = Number(data.amount)
    const admin = await createAdminClient()

    // Idempotency: check if already processed
    const { data: existing } = await admin
      .from('wallet_transactions')
      .select('id')
      .eq('reference', reference)
      .eq('status', 'success')
      .single()

    if (existing) return NextResponse.json({ status: 'already processed' })

    // Extract user_id from reference format: topup_{userId}_{timestamp}
    const userId = reference.split('_')[1]
    if (!userId) return NextResponse.json({ error: 'Bad reference' }, { status: 400 })

    // Get current balance
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newBalance = Number(profile.wallet_balance) + amount

    // Update wallet
    await admin.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId)

    // Record transaction
    await admin.from('wallet_transactions').insert({
      user_id: userId,
      type: 'topup',
      amount,
      balance_before: profile.wallet_balance,
      balance_after: newBalance,
      reference,
      gateway: 'flutterwave',
      status: 'success',
      metadata: data,
    })

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
