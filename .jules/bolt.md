## 2026-08-16 - Force Layout Recalculations During Drag Operations
**Learning:** Including drag state (`manualPositions`) in the same `useMemo` calculation that executes heavy layout physics (`adaptNodesToViewport` / `applyForceDirectedLayout`) causes 40 iterations of force-directed physics to run on every mouse movement frame during drag interactions.
**Action:** Always decouple interactive UI override state from heavy layout or physics simulation calculations into separate `useMemo` hooks.
