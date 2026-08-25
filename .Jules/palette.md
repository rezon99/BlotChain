## 2025-05-18 - Accessibility & Keyboard Shortcuts for Modal Views
**Learning:** Full-screen modal overlays over interactive SVG graph views require proper ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) and global keydown listeners for `Escape` to allow keyboard users to dismiss modal views seamlessly without losing focus context.
**Action:** Always include Escape key listeners and dialog ARIA roles when implementing modal overlay components.
