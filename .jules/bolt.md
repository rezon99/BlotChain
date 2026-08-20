## 2026-08-16 - Force Layout Recalculations During Drag Operations
**Learning:** Including drag state (`manualPositions`) in the same `useMemo` calculation that executes heavy layout physics (`adaptNodesToViewport` / `applyForceDirectedLayout`) causes 40 iterations of force-directed physics to run on every mouse movement frame during drag interactions.
**Action:** Always decouple interactive UI override state from heavy layout or physics simulation calculations into separate `useMemo` hooks.

## 2026-08-16 - React State Updates in 60 FPS WebGL Render Loops
**Learning:** Calling React `setState` inside a `requestAnimationFrame` loop (such as projecting 3D mesh coordinates to screen HTML labels on every frame) triggers full React component re-renders 60 times per second, causing severe main thread layout/paint thrashing and CPU overhead.
**Action:** Use a `useRef` map of HTML elements and mutate their `style.transform`, `opacity`, and `display` imperatively inside the render loop instead of storing projected screen positions in React state.
