# components/ui

Platform components: shadcn-derived, fully re-skinned with design tokens (T0.7 lifecycle).

**Belongs:** Button, Input, Card, Badge, Chip, Accordion, Select, Dialog, Toast, Pagination, Skeleton, Tabs.
**Never:** Domain concepts, data fetching, default shadcn styling, module imports.
**Imports (allowed direction):** → lib (cn), design-system tokens only

**Button** — variants `primary | secondary | outline | ghost`, sizes `sm | md | lg | icon`. `ghost` + `icon` are the icon-only, low-emphasis pairing (44px, `--ds-touch-target-min`); adding a further variant or size is a design-system decision, never a call-site `className`.
