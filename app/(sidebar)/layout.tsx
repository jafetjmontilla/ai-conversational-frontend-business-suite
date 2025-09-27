import { cookies } from 'next/headers'
import { SidebarLayout } from '@/components/layouts/SidebarLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  const defaultOpen = cookies().get("sidebar_state")?.value === "true"

  return (
    <SidebarLayout defaultOpen={defaultOpen}>
      <div className='flex-1 max-h-[100vh] overflow-auto'>
        {children}
      </div>
    </SidebarLayout>)
}
