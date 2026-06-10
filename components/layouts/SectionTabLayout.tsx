"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionTab = {
  id: string;
  label: string;
};

type SectionTabLayoutProps = {
  children: React.ReactNode;
  base: string;
  tabs?: readonly SectionTab[];
  nav?: React.ReactNode;
};

export function SectionTabNav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="border-b bg-muted/30 px-2 py-2 flex flex-wrap gap-1">
      {children}
    </nav>
  );
}

export function SectionTabLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
      )}
    >
      {children}
    </Link>
  );
}

export function SectionTabDivider() {
  return (
    <span
      className="w-px h-8 bg-border mx-1 hidden sm:block self-center"
      aria-hidden
    />
  );
}

export function SectionTabLayout({
  children,
  base,
  tabs,
  nav,
}: SectionTabLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {nav ?? (
        <SectionTabNav>
          {tabs?.map(({ id, label }) => (
            <SectionTabLink key={id} href={`${base}/${id}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
