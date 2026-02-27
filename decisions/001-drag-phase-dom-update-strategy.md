# 001: Drag Phase DOM Update Strategy

## Status

Accepted

## Context

Drawer has two visual update phases with fundamentally different characteristics:

- **Drag phase** — Synchronous, frame-by-frame DOM style updates driven by pointer events (60 fps+)
- **Animation phase** — Declarative, spring-based animations triggered by state transitions (Opening / Closing / Settling)

The animation phase already uses an event-driven architecture: `useContentAnimation` and `useOverlayAnimation` each subscribe to phase transitions via `machine.registerTransitionPart()`, and the `TransitionCoordinator` synchronizes completion across parts.

The question: should the drag phase also adopt an event-driven model, where `useDrawerGesture` emits drag events through `DrawerMachine` (EventTarget) and each UI component (`useDrawerContent`, `useDrawerOverlay`) subscribes to update its own styles?

## Decision

**Keep direct DOM manipulation in `useDrawerGesture` for the drag phase.** The gesture handler directly updates `contentRef.style.translate` and `overlayRef.style.opacity` on each pointer move.

## Alternatives Considered

### A. Direct DOM manipulation from gesture handler (chosen)

`useDrawerGesture` receives `contentRef` and `overlayRef`, calculates visual distances, and applies styles synchronously.

**Advantages:**

- Style caching (`transition: none` on drag start, restore on drag end) is atomic — one place manages the full lifecycle
- The drag-to-animation handoff is straightforward: restore cached styles, then animation hooks take over
- Content translate and overlay opacity derive from the same drag distance; calculating both in one place avoids duplication
- No indirection; the pointer-move → DOM-update path is minimal

**Disadvantages:**

- `useDrawerGesture` knows about `overlayRef`, coupling it to the overlay's existence
- Adding a new animated element during drag requires modifying the gesture handler

### B. Event-driven updates via EventTarget

`useDrawerGesture` emits drag position events through `DrawerMachine`. `useDrawerContent` and `useDrawerOverlay` each subscribe and apply their own style updates.

**Advantages:**

- Each component owns its visual representation
- Consistent with the animation phase architecture
- Adding new drag-reactive elements requires no changes to the gesture handler

**Disadvantages:**

- Style caching must be split across subscribers and synchronized — each subscriber needs to independently cache styles on drag start and restore them on drag end, with timing coordination
- The drag-to-animation handoff becomes complex: each subscriber must restore its cached styles at exactly the right moment before animation hooks take over
- Visual calculations are either duplicated across subscribers or pre-calculated and broadcast, where each subscriber receives values irrelevant to it
- The event dispatch per pointer move (60+ fps) adds indirection to a hot path where synchronous guarantees matter

## Rationale

The drag phase and animation phase have different requirements that justify different mechanisms:

|                  | Drag Phase                   | Animation Phase                    |
| ---------------- | ---------------------------- | ---------------------------------- |
| Update frequency | Every pointer move (~60 fps) | Once per state transition          |
| Timing           | Synchronous, immediate       | Asynchronous, spring-based         |
| Style lifecycle  | Cache → override → restore   | Set keyframes → play → complete    |
| Coordination     | Implicit (single callsite)   | Explicit (`TransitionCoordinator`) |

The event-driven model suits the animation phase because animations are triggered by discrete state transitions and need cross-part synchronization. The drag phase is a continuous, synchronous loop where direct manipulation is simpler and the style cache lifecycle demands atomicity.
