# Tab morphing contract

App passes `{tab,id}` to the unified Canvas 2D renderer. Selection increments the
request ID, unmounts the previous tab body and marks the panel busy. Navigation
remains available; only the latest completed request reveals its content. Controlled
email state survives transitions.

SceneTransition interpolates tab weights over 1000 ms. Interrupted transitions
retain weights and their derivatives with cubic Hermite interpolation. SYSTEM and
TERMINAL share the PC cloud but have different layout destinations. Organic drift,
pointer response and separation are applied after the interpolated anchors.
Reduced motion immediately commits the target and cannot rewind when disabled.

`onScreenLayout` reports the Terminal glass rectangle using the same uniform
layout transform as the particle monitor. Responsive CSS must not override these
coordinates. Rotation updates the bounds without remounting the renderer.

See particle-architecture.md for sampling, drawing and verification details.
