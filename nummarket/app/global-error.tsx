'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Global error:', error) }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">⚠️</div>
          <h1 className="font-sans text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-500 text-sm mb-2 leading-relaxed">
            An unexpected error occurred. Don't worry — your account and wallet are safe.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-700 font-mono mb-6">Error: {error.digest}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Try again
            </button>
            <a href="/" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
