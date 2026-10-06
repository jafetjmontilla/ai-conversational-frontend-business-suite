# AGENTS.md

Repo `frontend-business-suite` (Frontend Business Suite de AI Conversational, Next.js 14 + App Router).
Las reglas de `.cursor/rules/` y este índice se generan desde la fuente única del repo raíz `ai-conversational` (`npm run rules:sync`); no editarlas aquí.

<!-- BEGIN:agent-rules-index (generado por scripts/sync-agent-rules.mjs, no editar a mano) -->
- **[app-suite-capabilities](.cursor/rules/app-suite-capabilities.mdc)** — Apps instaladas, capacidades del negocio y FeatureGate (Suite de aplicaciones)
  - Aplica a: `lib/app-suite/**`, `lib/data/appSuiteApps.ts`, `lib/hooks/useBusinessApps.ts`, `components/app-suite/**`, `lib/navigation/businessNav.ts`, `lib/queries/business.ts`, `contexts/BusinessProvider.tsx`, `lib/hooks/useBusinessRealtimeSync.ts`
- **[frontend-animations](.cursor/rules/frontend-animations.mdc)** — Animaciones y transiciones en el frontend (Framer Motion y CSS)
  - Aplica a: `app/**`, `components/**`
- **[frontend-conventions](.cursor/rules/frontend-conventions.mdc)** — Convenciones y patrones del frontend
  - Aplica a: `app/**`, `components/**`, `lib/**`, `contexts/**`, `hooks/**`
- **[redesign-skill](.cursor/rules/redesign-skill.mdc)** — Audit-and-upgrade protocol for existing public UI: (storefront), (public) auth branding, landings. Scan → Diagnose → Fix in priority order without rewriting the stack. NOT for (sidebar) product/dashboard. Complements taste-skill + soft-skill. Source distilled from Leonxlnx redesign-skill.
  - Aplica a: bajo demanda
- **[soft-skill](.cursor/rules/soft-skill.mdc)** — Premium craft and motion for marketing/landing/auth branded surfaces: variance archetypes, nested bezels (marketing only), haptic CTAs, fluid easing. Defers to frontend-conventions + shadcn/Tailwind/Lucide/framer-motion on product UI. Source distilled from Leonxlnx/taste-skill soft-skill.
  - Aplica a: bajo demanda
- **[taste-skill](.cursor/rules/taste-skill.mdc)** — Anti-slop design for landing, marketing, auth/public branded pages, and redesigns. Infer brief + dials; avoid AI-template aesthetics. NOT for dense product/dashboard UI (billing tables, ops, sidebar forms) — those follow frontend-conventions. Source distilled from Leonxlnx/taste-skill.
  - Aplica a: bajo demanda
<!-- END:agent-rules-index -->
