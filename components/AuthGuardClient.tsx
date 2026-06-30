'use client'

import dynamic from 'next/dynamic'

const AuthGuard = dynamic(
  () => import('@/components/AuthGuard').then((m) => ({ default: m.AuthGuard })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    ),
  }
)

export function AuthGuardClient({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
