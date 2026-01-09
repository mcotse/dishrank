# src/components Agent Guidelines

## UI Components (ui/)
- Follow variant/size pattern with Tailwind classes
- Button variants: primary, secondary, outline, ghost
- Input component handles error display via `error` prop

## Entry Wizard (entry/)
- Multi-step state managed by `entryStore` (Zustand)
- Steps: DishName → Restaurant → Cuisine → Photo → Review
- Each step component receives no props, reads/writes to store directly

## Comparison (comparison/)
- ComparisonCard is tap-to-select, not drag-and-drop
- Photo-forward design - image is the primary element
