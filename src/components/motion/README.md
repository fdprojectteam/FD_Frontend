# motion

The motion layer. **One component**, and that is the point.

**Belongs:** wrappers for motion that CSS cannot express alone.
**Never:** domain knowledge, business logic, figures, rule ids, feature state.
**Imports (allowed direction):** → components, design-system, hooks, lib, constants, types, utils.

## Why this directory is nearly empty

The platform's motion is CSS. `globals.css` holds the whole vocabulary —
fade, expand/collapse, pulse, reveal and stagger — driven by the tokens in
`design-system/tokens/motion.css`. `@starting-style` and `transition-behavior`
now cover enter and exit natively, so no library is needed for presence either.

Exactly one interaction resists CSS: animating a container to an **intrinsic**
height, because `interpolate-size` / `calc-size()` are Chromium-only.
`AutoHeight` and `useMeasuredHeight` close that gap in about a hundred lines,
which is the whole reason this project carries no motion library.

**Before adding anything here, check `globals.css` first.** If a utility can
express it, it belongs there, not in a component.

## Contents

| Export       | Purpose                                                             |
| ------------ | ------------------------------------------------------------------- |
| `AutoHeight` | Animates a container between its natural heights as children change |

See `docs/engineering/motion-architecture.md` for the specification every
animation on the Goal Planner is built against.
