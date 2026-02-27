import { useSpring, animated } from '@react-spring/web'
import { TRAVEL, BOX_SIZE } from './common'

/** React Spring によるスプリングアニメーション。反転時に速度を自動で継続する。 */
export function ReactSpringBox({ target }: { target: boolean }) {
  const [style] = useSpring(
    () => ({
      x: target ? TRAVEL : 0,
      config: { tension: 110, friction: 16 },
    }),
    [target],
  )

  return (
    <animated.div
      style={{
        width: BOX_SIZE,
        height: BOX_SIZE,
        backgroundColor: '#111',
        borderRadius: 8,
        transform: style.x.to((x: number) => `translateX(${x}px)`),
      }}
    />
  )
}
