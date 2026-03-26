import {
  DrawerMachine,
  Phase,
  isOpenPhase,
  DragController,
  setupContentAnimation,
  setupOverlayAnimation,
  type DismissalDirection,
} from '@hikidas/core'
import {
  computed,
  shallowRef,
  watch,
  onBeforeUnmount,
  onUnmounted,
  provide,
  inject,
  useId,
  type Ref,
  type ShallowRef,
} from 'vue'
import {
  type DrawerContextValue,
  useDrawerContext,
  useParentDrawerId,
  NestingKey,
  DrawerKey,
} from './context'

export interface DrawerRootAPI {
  /**
   * Whether the drawer is open by default (uncontrolled mode).
   */
  defaultOpen?: boolean
  /**
   * Whether the drawer is open (controlled mode).
   * Use `v-model:open` for two-way binding, or `:open` + `@update:open` for manual control.
   */
  open?: boolean
  /**
   * Specifies the direction to swipe to dismiss the drawer and the animation direction.
   * - 'down': Swipe down to dismiss (emerges from bottom, default)
   * - 'up': Swipe up to dismiss (emerges from top)
   * - 'left': Swipe left to dismiss (emerges from left edge)
   * - 'right': Swipe right to dismiss (emerges from right edge)
   * @default 'down'
   */
  dismissalDirection?: DismissalDirection
  /**
   * When true, prevents the drawer from being dismissed by dragging.
   * The drawer can still be closed programmatically or by clicking a close button.
   *
   * **Note:** This only controls drag gestures. To control other dismissal methods in reka-ui:
   * - **Outside clicks:** Use `onPointerDownOutside` on `Drawer.Content`
   * - **ESC key:** Use `onEscapeKeyDown` on `Drawer.Content`
   *
   * @example
   * ```vue
   * <!-- Prevent all dismissal methods -->
   * <Drawer.Root :disable-drag-dismiss="true">
   *   <Drawer.Content
   *     @pointer-down-outside.prevent
   *     @escape-key-down.prevent
   *   >
   *     ...
   *   </Drawer.Content>
   * </Drawer.Root>
   * ```
   * @default false
   */
  disableDragDismiss?: boolean
  /**
   * Array of snap point positions as ratios (0-1) of viewport size along the drag axis.
   * When provided, the drawer can rest at multiple predefined positions.
   *
   * Values must be in ascending order and in range (0, 1].
   * - 1.0 = fully extended (100% of viewport)
   * - 0.5 = half extended (50% of viewport)
   * - 0.25 = quarter extended (25% of viewport)
   *
   * If not provided, drawer operates in traditional binary mode (open/closed only).
   *
   * @example
   * ```vue
   * <Drawer.Root :snap-points="[0.25, 0.5, 1.0]" />
   * ```
   * @default undefined
   */
  snapPoints?: number[]
  /**
   * The initial snap point index when the drawer opens (uncontrolled mode).
   * Index into the `snapPoints` array.
   *
   * @example
   * ```vue
   * <!-- Opens to 50% (index 1) -->
   * <Drawer.Root :snap-points="[0.25, 0.5, 1.0]" :default-snap-point="1" />
   * ```
   * @default snapPoints.length - 1
   */
  defaultSnapPoint?: number
  /**
   * The current active snap point index (controlled mode).
   * Use `v-model:snapPoint` for two-way binding, or `:snapPoint` + `@update:snapPoint` for manual control.
   *
   * **Note:** Changes to this prop are only applied when the drawer is in a stable state:
   * - When **closed**: The snap point is updated internally and will take effect on the next open
   * - When **open and idle**: The drawer animates to the new snap point
   * - When **animating, dragging, or transitioning**: Changes are ignored to prevent conflicts
   */
  snapPoint?: number
}

export type DrawerRootEmit = {
  /** Emitted when the open state changes. Use with `v-model:open`. */
  (e: 'update:open', open: boolean): void
  /** Emitted when the active snap point index changes. Use with `v-model:snapPoint`. */
  (e: 'update:snapPoint', index: number): void
}

/** @internal */
export function useDrawerRoot(props: DrawerRootAPI, emit: DrawerRootEmit) {
  const id = useId()
  const parentDrawerId = useParentDrawerId()
  const nesting = inject(NestingKey, null)

  const dismissalDirection = computed(() => props.dismissalDirection ?? 'down')
  const disableDragDismiss = computed(() => props.disableDragDismiss ?? false)

  const desiredOpen = useVModel(
    () => props.open,
    (open) => emit('update:open', open),
    !!props.defaultOpen,
  )

  const initialSnapPoints = props.snapPoints
  const desiredSnapPointIndex = useVModel(
    () => props.snapPoint,
    (index) => {
      if (index !== undefined) emit('update:snapPoint', index)
    },
    initialSnapPoints && initialSnapPoints.length > 0
      ? (props.defaultSnapPoint ?? initialSnapPoints.length - 1)
      : undefined,
  )

  const machine = new DrawerMachine(
    desiredOpen.value,
    {
      snapPoints: props.snapPoints,
      snapPointIndex: desiredSnapPointIndex.value,
    },
    {
      dismissalDirection: dismissalDirection.value,
      disableDragDismiss: disableDragDismiss.value,
    },
  )

  if (nesting) {
    const unregister = nesting.registry.register({
      id,
      parentId: parentDrawerId,
      machine,
    })
    onBeforeUnmount(unregister)
  }

  watch(
    [dismissalDirection, disableDragDismiss],
    ([dismissalDirection, disableDragDismiss]) => {
      machine.updateConfig({
        dismissalDirection,
        disableDragDismiss,
      })
    },
  )

  // ── Bidirectional sync: desiredOpen ↔ phase ────────────
  watch(desiredOpen, (open) => {
    if (open) {
      machine.requestOpen()
    } else {
      machine.requestClose()
    }
  })

  const unsubPhase = machine.subscribePhaseChange((nextPhase) => {
    if (nextPhase === Phase.Closed) {
      desiredOpen.value = false
    } else if (nextPhase === Phase.Idle) {
      desiredOpen.value = true
    }
  })
  onUnmounted(unsubPhase)

  // ── Bidirectional sync: desiredSnapPointIndex ↔ snapMode.activeIndex ────────────
  watch(
    () => [props.snapPoints, desiredSnapPointIndex.value] as const,
    ([snapPoints, snapPointIndex]) => {
      machine.requestSnapPointChange(snapPoints, snapPointIndex)
    },
  )

  const unsubSnap = machine.subscribeSnapModeChange((nextSnapMode) => {
    if (nextSnapMode.type === 'binary') {
      desiredSnapPointIndex.value = undefined
    } else {
      desiredSnapPointIndex.value = nextSnapMode.activeIndex
    }
  })
  onUnmounted(unsubSnap)

  // use shallowRef for external state integration
  // https://vuejs.org/guide/extras/reactivity-in-depth.html#integration-with-external-state-systems
  const phase = shallowRef(machine.snapshot.phase)
  const unsubPhaseTracking = machine.subscribePhaseChange((nextPhase) => {
    phase.value = nextPhase
  })
  onUnmounted(unsubPhaseTracking)

  const isOpen = computed(() => isOpenPhase(phase.value))
  const handleIsOpenChange = (nextIsOpen: boolean) => {
    desiredOpen.value = nextIsOpen
  }

  const contentRef = shallowRef<HTMLElement | null>(null)
  const overlayRef = shallowRef<HTMLElement | null>(null)
  const nestingConnector = nesting?.connector ?? null

  const contextValue: DrawerContextValue = {
    id,
    machine,
    shouldMount: computed(() => isOpenPhase(phase.value)),
    contentRef,
    overlayRef,
    nestingConnector,
  }

  provide(DrawerKey, contextValue)

  return {
    isOpen,
    handleIsOpenChange,
  }
}

/** @internal */
export function useDrawerOverlay(
  elementRef: Readonly<Ref<HTMLElement | undefined>>,
): void {
  const { machine, overlayRef } = useDrawerContext()

  watch(
    elementRef,
    (el, _old, onCleanup) => {
      overlayRef.value = el ?? null
      if (!el) return
      const cleanup = setupOverlayAnimation({ machine, element: el })
      onCleanup(cleanup)
    },
    { flush: 'post' },
  )
}

/** @internal */
export function useDrawerContent(
  elementRef: Readonly<Ref<HTMLElement | undefined>>,
): void {
  const { id, machine, contentRef, overlayRef, nestingConnector } =
    useDrawerContext()

  watch(
    elementRef,
    (el, _old, onCleanup) => {
      contentRef.value = el ?? null
      if (!el) return

      const cleanups: Array<() => void> = []

      const cleanupAnimation = setupContentAnimation({
        machine,
        element: el,
      })
      cleanups.push(cleanupAnimation)

      // NOTE: overlayRef.value is read as a snapshot at content mount time.
      // If DrawerOverlay mounts after DrawerContent, DragController will be
      // initialized with null — this is intentional and matches React's behavior.
      const controller = new DragController({
        element: el,
        overlayElement: overlayRef.value,
        machine,
      })
      cleanups.push(controller.dispose.bind(controller))

      if (nestingConnector) {
        const cleanupNesting = nestingConnector({
          id,
          element: el,
          controller,
        })
        cleanups.push(cleanupNesting)
      }

      onCleanup(() => {
        for (const cleanup of cleanups) {
          cleanup()
        }
      })
    },
    { flush: 'post' },
  )
}

function useVModel<T>(
  propValue: () => T | undefined,
  onUpdate: (value: T) => void,
  defaultValue: T,
): ShallowRef<T> {
  const internalValue = shallowRef(propValue() ?? defaultValue) as ShallowRef<T>

  watch(propValue, (val) => {
    if (val !== undefined) {
      internalValue.value = val
    }
  })

  watch(internalValue, (val) => {
    if (val !== propValue()) {
      onUpdate(val)
    }
  })

  return internalValue
}
