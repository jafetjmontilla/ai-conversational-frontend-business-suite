---
paths:
  - "app/(public)/**"
  - "app/(storefront)/**"
  - "app/page.tsx"
  - "components/auth/**"
  - "components/sitio-publico/**"
---
<!-- GENERADO por scripts/sync-agent-rules.mjs desde la fuente única (.cursor/rules/soft-skill.mdc del repo raíz ai-conversational) — no editar aquí -->

> Premium craft and motion for marketing/landing/auth branded surfaces: variance archetypes, nested bezels (marketing only), haptic CTAs, fluid easing. Defers to frontend-conventions + shadcn/Tailwind/Lucide/framer-motion on product UI. Source distilled from Leonxlnx/taste-skill soft-skill.

# Soft craft (premium) — versión proyecto

## Prioridad

- **Marketing / landing / `(storefront)` / `(public)` branding:** aplicar craft de esta regla. Mejoras sobre UI existente: `redesign-skill`.
- **Dashboard / ops / billing / tablas / forms densos:** **no** aplicar Double-Bezel, island-nav, `py-24` ni pills obligatorias. Usar shadcn + `frontend-conventions` + `frontend-animations`.
- Conflicto con Lucide, Manrope, tokens HSL, duración 150–300 ms → **gana el proyecto**.

## Stack (no renegociar)

- Tailwind **v3** utilities + tokens semánticos (`bg-background`, `text-foreground`, `primary`, etc.)
- shadcn `Button` / `Card` / etc. como base; capas visuales extra solo en marketing
- Iconos: **Lucide** (stroke consistente; no cambiar a Phosphor)
- Motion: **framer-motion** + CSS transitions; cubic-bezier custom en marketing OK
- Fuente: **Manrope** salvo brief que pida otra (nunca Inter/Roboto/Arial como “default premium”)

## Absolute Zero (marketing)

Evitar:

- Layout Bootstrap 3-columnas iguales sin whitespace
- `shadow-md` / sombras negras duras; preferir sombra tintada o hairlines `border`/`ring` suaves
- Sticky nav edge-to-edge genérico **en landings** (en app, sidebar pegada es correcta)
- Motion `linear` / snap sin interpolación; estados que “pop” sin transición
- Orbes púrpura AI + mesh como default (salvo brand)

## Variance Engine (elegir 1 + 1 en silencio)

**Vibe:** Ethereal Glass (OLED + blur en fixed UI, hairlines) · Editorial Luxury (crema/sage — solo si brand/brief; evitar beige+brass default genérico) · Soft Structuralism (plata/blanco, sombras difusas).

**Layout:** Asymmetrical Bento · Z-Axis Cascade (sin rotate/overlap en `<md`) · Editorial Split.

Mobile universal: `w-full`, `px-4`, stack; `min-h-[100dvh]` no `h-screen`.

## Haptic micro-aesthetics (solo marketing)

**Double-Bezel** (hero / feature media / pricing card premium):

```tsx
<div className="rounded-[2rem] border border-border/60 bg-muted/40 p-1.5 dark:border-white/10 dark:bg-white/5">
  <div className="rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
    {/* content */}
  </div>
</div>
```

No envolver cada `Card` de tabla/facturación.

**CTA island (marketing):** pill `rounded-full`; icono trailing en círculo interno (`group-hover:translate-x-1`); `active:scale-[0.98]`. En producto: variantes shadcn `Button` existentes.

**Whitespace:** landings `py-24`–`py-32` por sección. App suite: paddings del layout existente.

**Eyebrow:** opcional y racionado (ver `taste-skill`); no en cada H2.

## Motion choreography

- Easing marketing: `ease-[cubic-bezier(0.32,0.72,0,1)]` o `[0.16,1,0.3,1]`; duración entrada ~600–800 ms.
- Producto: respetar 150 / 200 / 250–300 ms de `frontend-animations`.
- Reveal: `whileInView` / IntersectionObserver; solo `transform`+`opacity`.
- `backdrop-blur` solo en fixed/sticky (nav/overlay), no en scroll content.
- Noise grain: pseudo `fixed inset-0 pointer-events-none`, no en contenedores que scrollean.
- Nav “fluid island” / hamburger→X: solo landings/public; **no** reemplazar `AppSidebar`.

## Checklist corto

- [ ] ¿Es superficie marketing? Si no → salir
- [ ] Stack Lucide + framer-motion + Tailwind 3 + tokens
- [ ] Arquetipo vibe+layout elegido; mobile colapsado
- [ ] Double-Bezel solo donde aporta; CTAs con feedback háptico
- [ ] Motion motivado + reduced-motion; blur solo fixed
- [ ] No pelea con shadcn forms ni convenciones del suite
