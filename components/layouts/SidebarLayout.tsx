"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/navigation/AppSidebar"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export function SidebarLayout({ children, defaultOpen }: { children: React.ReactNode, defaultOpen?: boolean }) {
  const [slugs, setSlugs] = useState<{ name: string, href: string }[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const pathname = usePathname()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Actualiza cada minuto

    return () => clearInterval(timer)
  }, [])

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar setSlugs={setSlugs} />
      <div className="flex flex-col w-[100vw] h-[100vh]">
        <div className="flex items-center w-full h-10 bg-background border-b border-border shadow-sm px-2 md:px-7 py-1 gap-5 cursor-default">
          <div className="flex-1 flex gap-4 items-center" >
            <span className="md:hidden">logo</span>
            <span className="uppercase">{slugs.find((slug) => slug.href === pathname)?.name}</span>
          </div>
          <SidebarTrigger className="bg-white/30 flex items-center justify-center md:hidden" />
          <span className="hidden md:block">$ 175.00</span>
          <span className="hidden md:block first-letter:uppercase">{currentDate.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric', month: 'numeric',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}</span>
        </div>
        {children}
      </div>
    </SidebarProvider>
  )
}
