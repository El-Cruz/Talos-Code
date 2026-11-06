# Tab-driven particle morphing

The existing Home tab is called SYSTEM in the UI. `tabTarget(tab, mobile)` supplies
the renderer with a shape, model-space position, rotation and scale:

| Tab | Shape | Desktop placement | Scale |
| --- | --- | --- | --- |
| SYSTEM / Home | CRT PC | Right of Hero copy | 1 |
| ARCHIVE | Three stacked cylinders (database) | Right, X=2.1 | 1 |
| CORE | Nucleus and three torus orbits (atom) | Left, X=-2.1 | 1 |
| TERMINAL | Frontal CRT PC | Centered on terminal UI | 2.7 desktop / 2.2 mobile |

Mobile targets use X=0 and a canvas at the top of the viewport. Other tab content
starts below the canvas. Terminal's scrollable panel instead sits inside the
enlarged monitor. The same shared target definitions drive both renderers.

## Props and completion contract

```tsx
const request = useMemo(() => ({
  tab: navigation.tab,
  id: navigation.id * 2 + (mobile ? 1 : 0),
  target: tabTarget(navigation.tab, mobile),
}), [navigation, mobile]);
const isMorphComplete = uiReady && completedId === request.id;

<ParticleMonitor
  request={request}
  heroReady={heroReady}
  onReady={() => setUiReady(true)}
  onMorphComplete={setCompletedId}
/>
{isMorphComplete && <TabContent activeTab={navigation.tab} onChange={selectTab} />}
```

Selecting another tab increments `navigation.id` immediately. That removes the
previous tab body and prevents the destination body from entering the DOM. Shared
header/navigation remain available, with `aria-busy` on the tab panel. Only the
renderer callback after the final target frame can mount destination text, links
and inputs. A callback carrying an old ID cannot reveal the newly selected tab.
Keyboard tabs support ArrowLeft, ArrowRight, Home and End.

## Rendering and interruption

`bakeTabShapes` builds deterministic surface point clouds for database and atom.
These are analytic samples of capped cylinders, a sphere and thin torus surfaces;
the PC uses the existing workstation surface cloud, with ambient points replaced
by surface anchors so zooming does not scatter points across the UI. Every cloud has the same particle
count. The TSL material reads three static clouds and blends them with three
uniform weights, keeping buffers immutable during animation.

Each morph lasts 1000ms with smoothstep easing. Position, rotation and scale use
the same progress. Retargeting snapshots the currently visible weights and pose;
it does not jump to the previous target or restart the renderer. The new target
frame is rendered before `onMorphComplete(id)` runs. Subsequent tab completions
also wait for the initial Hero rotation to finish. Reduced motion renders the
target immediately, then signals completion. Hidden time is excluded.

The low-tier fallback is `TabParticleCanvas`, with 2,400 particles and perspective
projection of the same clouds. It preserves visible positions across interrupted
morphs and uses the same completion callback. This replaces the active video
route for tab navigation: a single prerecorded PC loop cannot produce database
or atom morphs. The standalone video component and its assets API remain available.

## Verification

Tests cover target selection and side/zoom, interrupted-weight continuity, and
deterministic finite clouds. Browser checks exercised all four WebGL2 destinations,
absence of destination content during animation, rapid Archive → Core → Terminal
retargeting without stale content, and the projected mobile fallback. TypeScript,
ESLint, 20 particle tests and the Next.js Webpack production build pass.
