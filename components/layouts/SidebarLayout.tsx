"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/navigation/SidebarNew"

export function SidebarLayout({
  children,
  defaultOpen,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarTrigger className="block md:hidden sticky top-10 left-10 z-10" />
      {children}
    </SidebarProvider>
  )
}
