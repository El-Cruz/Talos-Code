# Tab morphing contract

The active renderer is the unified SVG + Canvas 2D scene documented in
[particle-architecture.md](particle-architecture.md).

`App` passes `{ tab, id }` to `ParticleMonitor`. Changing the selected tab increments
`id`, immediately unmounts the previous body and marks the tab panel busy. Header
and navigation remain mounted. `onMorphComplete(id)` is called after the final
frame has been drawn and boot has assembled. Only a matching ID mounts content.

`SceneTransition` retains the visible four-tab mixture when interrupted. Shape
weights combine SYSTEM and TERMINAL into PC; layout weights preserve the distinct
placement of those tabs. Both use one 1000 ms smoothstep timeline. Reduced motion
commits the destination immediately. Resizing changes layout without creating a
new request. Pointer displacement is applied after the interpolated position.

`onScreenLayout` publishes the Terminal glass bounds on resize. The HTML panel
uses these coordinates and stays inside the SVG screen. Terminal disables
parallax at completion so the SVG and input remain aligned.

`tabTarget` and the old three-dimensional targets remain only for legacy modules
and their tests; they no longer control the landing.
