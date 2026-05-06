import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="text-center">
        <p className="font-display text-8xl font-extrabold text-violet-600/30 mb-4">404</p>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-zinc-500 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-sm transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  )
}
