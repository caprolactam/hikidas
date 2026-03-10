import {
  ref,
  shallowRef,
  watch,
  onBeforeUnmount,
  onMounted,
  provide,
  inject,
  useId,
  type ShallowRef,
  type ComponentPublicInstance,
} from 'vue'
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

type DrawerRootEmit = {
  (e: 'update:open', value: boolean): void
  (e: 'update:snapPoint', value: number): void
}

/** @internal */
export function useDrawerRoot(props: DrawerRootAPI, emit: DrawerRootEmit) {
  const id = useId()
  const parentDrawerId = useParentDrawerId()
  const nesting = inject(NestingKey, null)

  const { state: desiredOpen, setState: setDesiredOpen } =
    useControllableState({
      value: () => props.open,
      defaultValue: !!props.defaultOpen,
      onChange: (value) => emit('update:open', value),
    })

  const initialSnapPoints = props.snapPoints
  const { state: desiredSnapPointIndex, setState: setDesiredSnapPointIndex } =
    useControllableState<number | undefined>({
      value: () => props.snapPoint,
      defaultValue:
        initialSnapPoints && initialSnapPoints.length > 0
          ? (props.defaultSnapPoint ?? initialSnapPoints.length - 1)
          : undefined,
      onChange: (index) => {
        if (index === undefined) return
        emit('update:snapPoint', index)
      },
    })

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

  // Register with DrawerRegistry only when NestingDrawerProvider is present
  if (nesting) {
    const unregister = nesting.registry.register({
      id,
      parentId: parentDrawerId,
      machine,
    })
    onBeforeUnmount(unregister)
  }

  // Update config when props change
  watch(
    () => [props.dismissalDirection, props.disableDragDismiss] as const,
    ([dismissalDirection, disableDragDismiss]) => {
      machine.updateConfig({
        dismissalDirection: dismissalDirection ?? 'down',
        disableDragDismiss: disableDragDismiss ?? false,
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
      setDesiredOpen(false)
    } else if (nextPhase === Phase.Idle) {
      setDesiredOpen(true)
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
      setDesiredSnapPointIndex(undefined)
    } else {
      setDesiredSnapPointIndex(nextSnapMode.activeIndex)
    }
  })
  onBeforeUnmount(unsubSnap)

  // ── Reactive phase tracking ────────────
  const phase = shallowRef(machine.snapshot.phase)
  const unsubPhaseTracking = machine.subscribePhaseChange((nextPhase) => {
    phase.value = nextPhase
  })
  onBeforeUnmount(unsubPhaseTracking)

  const isOpen = () => isOpenPhase(phase.value)

  const handleIsOpenChange = (nextIsOpen: boolean) => {
    setDesiredOpen(nextIsOpen)
  }

  const contentRef = shallowRef<HTMLElement | null>(null)
  const overlayRef = shallowRef<HTMLElement | null>(null)
  const nestingConnector = nesting?.connector ?? null

  const contextValue: DrawerContextValue = {
    id,
    machine,
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
export function useDrawerOverlay(): {
  setOverlayRef: (instance: Element | ComponentPublicInstance | null) => void
} {
  const { machine, overlayRef } = useDrawerContext()

  onMounted(() => {
    if (!overlayRef.value) return
    const cleanup = setupOverlayAnimation({
      machine,
      element: overlayRef.value,
    })
    if (cleanup) onBeforeUnmount(cleanup)
  })

  const setOverlayRef = (
    instance: Element | ComponentPublicInstance | null,
  ) => {
    overlayRef.value = resolveElement(instance)
  }

  return { setOverlayRef }
}

/** @internal */
export function useDrawerContent(): {
  setContentRef: (instance: Element | ComponentPublicInstance | null) => void
} {
  const { id, machine, contentRef, overlayRef, nestingConnector } =
    useDrawerContext()

  onMounted(() => {
    if (!contentRef.value) return

    const cleanups: Array<() => void> = []

    const cleanupAnimation = setupContentAnimation({
      machine,
      element: contentRef.value,
    })
    if (cleanupAnimation) cleanups.push(cleanupAnimation)

    const controller = new DragController({
      element: contentRef.value,
      overlayElement: overlayRef.value,
      machine,
    })
    cleanups.push(controller.dispose.bind(controller))

    if (nestingConnector) {
      const cleanupNesting = nestingConnector({
        id,
        element: contentRef.value,
        controller,
      })
      cleanups.push(cleanupNesting)
    }

    onBeforeUnmount(() => {
      for (const cleanup of cleanups) {
        cleanup()
      }
    })
  })

  const setContentRef = (
    instance: Element | ComponentPublicInstance | null,
  ) => {
    contentRef.value = resolveElement(instance)
  }

  return { setContentRef }
}

// ── Utilities ────────────

function resolveElement(
  instance: Element | ComponentPublicInstance | null,
): HTMLElement | null {
  if (!instance) return null
  if (instance instanceof Element) return instance as HTMLElement
  return (instance as ComponentPublicInstance).$el as HTMLElement | null
}

interface ControllableStateOptions<T> {
  value: () => T | undefined
  defaultValue: T
  onChange?: (value: T) => void
}

function useControllableState<T>({
  value: valueProp,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): {
  state: ShallowRef<T>
  setState: (next: T) => void
} {
  const internalValue = ref(defaultValue) as ShallowRef<T>
  let prevValue = internalValue.value

  const setState = (next: T) => {
    const controlledValue = valueProp()
    if (controlledValue !== undefined) {
      // Controlled mode: notify parent
      if (next !== controlledValue) {
        onChange?.(next)
      }
    } else {
      // Uncontrolled mode: update internal state
      internalValue.value = next
    }
  }

  // Sync controlled prop → internal value
  watch(valueProp, (newVal) => {
    if (newVal !== undefined) {
      internalValue.value = newVal
    }
  })

  // Emit onChange for uncontrolled value changes
  watch(internalValue, (newVal) => {
    const controlledValue = valueProp()
    if (controlledValue !== undefined) return

    if (prevValue !== newVal) {
      onChange?.(newVal)
      prevValue = newVal
    }
  })

  return { state: internalValue, setState }
}
