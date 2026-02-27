/**
 * @internal
 *
 * Note: unlike the Radix UI convention, `ourHandler` is **always** invoked
 * regardless of `event.defaultPrevented`.  Skipping `ourHandler` when the
 * user calls `preventDefault()` would leave the internal state machine in an
 * inconsistent state (e.g. stuck in Tracking/Dragging with an unreleased
 * pointer capture). Use `data-drawer-no-drag` to opt out of drag interactions instead.
 */
export function composeEventHandlers<EventType>(
  theirHandler: ((event: EventType) => void) | undefined,
  ourHandler: (event: EventType) => void,
): (event: EventType) => void {
  return (event) => {
    if (theirHandler) theirHandler(event)
    return ourHandler(event)
  }
}
