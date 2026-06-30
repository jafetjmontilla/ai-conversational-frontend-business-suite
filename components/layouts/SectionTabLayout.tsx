"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionTab = {
  id: string;
  label: string;
};

export type SectionTabVariant = "default" | "line";

const SectionTabVariantContext = createContext<SectionTabVariant>("default");

type SectionTabLayoutProps = {
  children: React.ReactNode;
  base: string;
  tabs?: readonly SectionTab[];
  nav?: React.ReactNode;
  variant?: SectionTabVariant;
};

export function SectionTabNav({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: SectionTabVariant;
}) {
  const contextVariant = useContext(SectionTabVariantContext);
  const resolvedVariant = variant ?? contextVariant;

  return (
    <nav
      className={cn(
        "flex flex-wrap",
        resolvedVariant === "line"
          ? "gap-2 border-b border-border text-muted-foreground"
          : "gap-1 border-b bg-muted/30"
      )}
    >
      {children}
    </nav>
  );
}

export function SectionTabLink({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant?: SectionTabVariant;
}) {
  const pathname = usePathname();
  const contextVariant = useContext(SectionTabVariantContext);
  const resolvedVariant = variant ?? contextVariant;
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "px-1.5 md:px-3 text-xs md:text-sm font-medium transition-colors",
        resolvedVariant === "line"
          ? cn(
            "-mb-px border-b-2 border-transparent py-1",
            isActive
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )
          : cn(
            "rounded-md py-1.5",
            isActive
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )
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
  variant = "default",
}: SectionTabLayoutProps) {
  return (
    <SectionTabVariantContext.Provider value={variant}>
      <div className="flex h-full flex-col">
        {nav ?? (
          <SectionTabNav>
            {tabs?.map(({ id, label }) => (
              <SectionTabLink key={id} href={`${base}/${id}`}>
                {label}
              </SectionTabLink>
            ))}
          </SectionTabNav>
        )}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </SectionTabVariantContext.Provider>
  );
}
