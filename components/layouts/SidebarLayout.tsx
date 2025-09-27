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
      <SidebarTrigger className="bg-white/30 flex items-center justify-center md:hidden absolute top-5 left-2 z-10" />
      {children}
    </SidebarProvider>
  )
}
