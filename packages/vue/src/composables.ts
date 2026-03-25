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
   * Whether the drawer is open (controlled mode). Must be used in conjunction with `onOpenChange`.
   */
  open?: boolean
  /**
   * Specifies the direction to swipe to dismiss the drawer and the animation direction.
   * @default 'down'
   */
  dismissalDirection?: DismissalDirection
  /**
   * When true, prevents the drawer from being dismissed by dragging.
   * @default false
   */
  disableDragDismiss?: boolean
  /**
   * Array of snap point positions as ratios (0-1) of viewport size along the drag axis.
   * @default undefined
   */
  snapPoints?: number[]
  /**
   * The initial snap point index when the drawer opens (uncontrolled mode).
   * @default snapPoints.length - 1
   */
  defaultSnapPoint?: number
  /**
   * The current active snap point index (controlled mode).
   */
  snapPoint?: number
}

export type DrawerRootEmit = {
  (e: 'update:open', open: boolean): void
  (e: 'update:snapPoint', index: number): void
}

/** @internal */
export function useDrawerRoot(props: DrawerRootAPI, emit: DrawerRootEmit) {
  const id = useId()
  const parentDrawerId = useParentDrawerId()
  const nesting = inject(NestingKey, null)

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
      dismissalDirection: props.dismissalDirection ?? 'down',
      disableDragDismiss: props.disableDragDismiss ?? false,
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
    [() => props.dismissalDirection, () => props.disableDragDismiss],
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
  onBeforeUnmount(unsubPhase)

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
  onBeforeUnmount(unsubSnap)

  const phase = shallowRef(machine.snapshot.phase)
  const unsubPhaseTracking = machine.subscribePhaseChange((nextPhase) => {
    phase.value = nextPhase
  })
  onBeforeUnmount(unsubPhaseTracking)

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
      console.log('Overlay element changed:', el)
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
      if (cleanupAnimation) cleanups.push(cleanupAnimation)

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
