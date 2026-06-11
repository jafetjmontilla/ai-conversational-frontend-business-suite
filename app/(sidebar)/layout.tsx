import React from 'react'
import { cookies } from 'next/headers'
import { SidebarProviders } from './providers'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProviders defaultOpen={defaultOpen}>
      {children}
    </SidebarProviders>
  )
}
