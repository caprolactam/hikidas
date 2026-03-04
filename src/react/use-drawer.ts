import {
  useContext,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  DrawerMachine,
  Phase,
  isOpenPhase,
  createDragController,
  type DismissalDirection,
} from '../core'
import {
  type DrawerContextValue,
  useDrawerContext,
  useParentDrawerId,
  useDrawerRegistryOptional,
  DragSetupContext,
} from './context'
import { useContentAnimation, useOverlayAnimation } from './use-phase-animation'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'
import { useMergeRefs } from './utils/use-merge-refs'
import { useStatic } from './utils/use-static'

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
   * Callback fired when the open state changes.
   * @param open - The new open state
   */
  onOpenChange?: (open: boolean) => void
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
   * **Note:** This only controls drag gestures. To control other dismissal methods:
   * - **Outside clicks (Radix UI):** Use `onPointerDownOutside` on `Drawer.Content`
   * - **ESC key (Radix UI):** Use `onEscapeKeyDown` on `Drawer.Content`
   * - **Outside clicks (Base UI):** Use `disablePointerDismissal` on `Drawer.Root`
   * - **ESC key (Base UI):** Check `reason` in `onOpenChange`
   *
   * @example
   * ```tsx
   * // Radix UI: Prevent all dismissal methods
   * <Drawer.Root disableDragDismiss>
   *   <Drawer.Content
   *     onPointerDownOutside={(e) => e.preventDefault()}
   *     onEscapeKeyDown={(e) => e.preventDefault()}
   *   >
   *     {content}
   *   </Drawer.Content>
   * </Drawer.Root>
   *
   * // Base UI: Prevent all dismissal methods
   * <Drawer.Root
   *   disableDragDismiss
   *   disablePointerDismissal
   *   onOpenChange={(open, { reason }) => {
   *     if (reason === 'escape-key') return;
   *     setOpen(open);
   *   }}
   * />
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
   * snapPoints={[0.25, 0.5, 1.0]} // Three snap positions: 25%, 50%, 100%
   *
   * @default undefined
   */
  snapPoints?: number[]
  /**
   * The initial snap point index when the drawer opens (uncontrolled mode).
   * Index into the snapPoints array.
   *
   * @example
   * snapPoints={[0.25, 0.5, 1.0]}
   * defaultSnapPoint={1} // Opens to 50% (index 1)
   *
   * @default snapPoints.length - 1 (highest snap point)
   */
  defaultSnapPoint?: number
  /**
   * The current active snap point index (controlled mode).
   * Must be used with onSnapPointChange.
   *
   * **Note:** Changes to this prop are only applied when the drawer is in a stable state:
   * - When **closed**: The snap point is updated internally and will take effect on the next open
   * - When **open and idle**: The drawer animates to the new snap point
   * - When **animating, dragging, or transitioning**: Changes are ignored to prevent conflicts
   *
   * @example
   * const [activeSnap, setActiveSnap] = useState(2)
   * snapPoints={[0.25, 0.5, 1.0]}
   * snapPoint={activeSnap}
   * onSnapPointChange={(index) => setActiveSnap(index)}
   */
  snapPoint?: number
  /**
   * Callback fired when the active snap point changes.
   * @param snapPointIndex - The index of the new snap point
   */
  onSnapPointChange?: (snapPointIndex: number) => void
}

/** @internal */
export function useDrawerRoot({
  defaultOpen,
  open,
  onOpenChange,
  dismissalDirection = 'down',
  disableDragDismiss = false,
  snapPoints,
  defaultSnapPoint,
  snapPoint,
  onSnapPointChange,
}: DrawerRootAPI) {
  const id = useId()
  const registry = useDrawerRegistryOptional()
  const parentDrawerId = useParentDrawerId()
  const [desiredOpen, setDesiredOpen] = useControllableState({
    value: open,
    defaultValue: !!defaultOpen,
    onChange: onOpenChange,
  })

  const [desiredSnapPointIndex, setDesiredSnapPointIndex] =
    useControllableState({
      value: snapPoint,
      defaultValue:
        snapPoints && snapPoints.length > 0
          ? (defaultSnapPoint ?? snapPoints.length - 1)
          : undefined,
      onChange: (index) => {
        // if it is binary mode, index will be null, so we ignore onSnapPointChange in that case.
        if (index === undefined) return
        onSnapPointChange?.(index)
      },
    })

  const machine = useStatic(
    () =>
      new DrawerMachine(
        desiredOpen,
        {
          snapPoints,
          snapPointIndex: desiredSnapPointIndex,
        },
        {
          dismissalDirection,
          disableDragDismiss,
        },
      ),
  )

  // Register with DrawerRegistry only when NestingDrawerProvider is present
  useIsomorphicEffect(() => {
    if (!registry) return
    return registry.register({
      id,
      parentId: parentDrawerId,
      machine,
    })
  }, [registry, id, parentDrawerId, machine])

  useEffect(() => {
    machine.updateConfig({
      dismissalDirection,
      disableDragDismiss,
    })
  }, [machine, dismissalDirection, disableDragDismiss])

  const subscribePhase = useCallback(
    (listener: () => void) => {
      return machine.subscribePhaseChange(() => {
        listener()
      })
    },
    [machine],
  )

  const phase = useSyncExternalStore(
    subscribePhase,
    () => machine.snapshot.phase,
    () => machine.snapshot.phase,
  )

  // ── Bidirectional sync: desiredOpen ↔ phase ────────────
  useEffect(() => {
    if (desiredOpen) {
      machine.requestOpen()
    } else {
      machine.requestClose()
    }
  }, [machine, desiredOpen])

  useEffect(() => {
    return machine.subscribePhaseChange((nextPhase) => {
      if (nextPhase === Phase.Closed) {
        setDesiredOpen(false)
      } else if (nextPhase === Phase.Idle) {
        setDesiredOpen(true)
      }
    })
  }, [machine, setDesiredOpen])

  // ── Bidirectional sync: desiredSnapPointIndex ↔ snapMode.activeIndex ────────────
  useEffect(() => {
    machine.requestSnapPointChange(snapPoints, desiredSnapPointIndex)
  }, [machine, snapPoints, desiredSnapPointIndex])

  useEffect(() => {
    return machine.subscribeSnapModeChange((nextSnapMode) => {
      if (nextSnapMode.type === 'binary') {
        setDesiredSnapPointIndex(undefined)
      } else {
        setDesiredSnapPointIndex(nextSnapMode.activeIndex)
      }
    })
  }, [machine, setDesiredSnapPointIndex])

  const isOpen = isOpenPhase(phase)
  const handleIsOpenChange = useCallback(
    (nextIsOpen: boolean) => {
      setDesiredOpen(nextIsOpen)
    },
    [setDesiredOpen],
  )

  const contentRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const contextValue: DrawerContextValue = useMemo(
    () => ({
      id,
      machine,
      contentRef,
      overlayRef,
    }),
    [id, machine],
  )

  return {
    isOpen,
    handleIsOpenChange,
    contextValue,
  }
}

export function useDrawerOverlay(externalRef?: React.Ref<HTMLDivElement>) {
  const { machine, overlayRef } = useDrawerContext()

  useOverlayAnimation({
    elementRef: overlayRef,
    machine,
  })

  const ref = useMergeRefs([externalRef, overlayRef])

  return {
    ref,
  }
}

export function useDrawerContent(props: {
  ref?: React.Ref<HTMLDivElement>
  style?: React.CSSProperties
}): {
  ref: React.Ref<HTMLDivElement>
  style: React.CSSProperties
} {
  const { id, machine, contentRef, overlayRef } = useDrawerContext()
  const dragSetup = useContext(DragSetupContext)

  useContentAnimation({
    machine,
    elementRef: contentRef,
  })

  useIsomorphicEffect(() => {
    if (!contentRef.current) return

    if (dragSetup) {
      // Nesting mode: coordinator handles drag + nesting animation
      return dragSetup({
        id,
        element: contentRef.current,
        overlayElement: overlayRef.current,
        machine,
      })
    }

    // Standalone mode: local DragController (no nesting)
    return createDragController({
      element: contentRef.current,
      overlayElement: overlayRef.current,
      machine,
    })
  }, [dragSetup, id, contentRef, overlayRef, machine])

  const ref = useMergeRefs([props.ref, contentRef])

  return {
    ref,
    style: { touchAction: 'none', ...props.style },
  }
}

interface ControllableStateProps<T> {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

function useControllableState<T>({
  value: valueProp,
  defaultValue: defaultValueProp,
  onChange: onChangeProp,
}: ControllableStateProps<T>): [T, (next: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] =
    useState<T>(defaultValueProp)
  const prevValueRef = useRef(uncontrolledValue)
  const valuePropRef = useLatestRef(valueProp)
  const onChange = useCallbackRef(onChangeProp)

  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolledValue

  useEffect(() => {
    if (isControlled) return

    if (prevValueRef.current !== uncontrolledValue) {
      onChange(uncontrolledValue)
      prevValueRef.current = uncontrolledValue
    }
  }, [isControlled, uncontrolledValue, onChange])

  const setValue = useCallback(
    (next: T) => {
      if (isControlled) {
        if (next !== valuePropRef.current) onChange(next)
      } else {
        setUncontrolledValue(next)
      }
    },
    [isControlled, onChange, valuePropRef],
  )

  return [value, setValue]
}

function useCallbackRef<T extends (...args: any[]) => unknown>(
  callback: T | undefined,
): T {
  const callbackRef = useLatestRef(callback)

  return useCallback(((...args) => callbackRef.current?.(...args)) as T, [
    callbackRef,
  ])
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value)

  useIsomorphicEffect(() => {
    ref.current = value
  }, [value])

  return ref
}
