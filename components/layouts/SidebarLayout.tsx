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
      <div className="flex flex-col w-[100vw] h-[100vh]">
        <div className="flex md:hidden w-full h-10 bg-red-500 px-2 py-1">
          <div className="flex-1 flex gap-4 items-center" >
            <h1 className="text-sm font-medium">logo</h1>
            <h1 className="text-sm font-medium">slug</h1>
          </div>
          <SidebarTrigger className="bg-white/30 flex items-center justify-center" />
        </div>
        {children}
      </div>
    </SidebarProvider>
  )
}
