type CSSProperties = Record<string, string>

/** @internal */
export function initCacheStyling() {
  const cache = new WeakMap<HTMLElement, Map<string, string>>()

  function set(el: HTMLElement, styles: CSSProperties) {
    let propCache = cache.get(el)
    if (!propCache) {
      propCache = new Map<string, string>()
      cache.set(el, propCache)
    }

    Object.entries(styles).forEach(([key]) => {
      if (propCache.has(key)) return

      if (key.startsWith('--')) {
        propCache.set(key, el.style.getPropertyValue(key))
      } else {
        propCache.set(key, (el.style as any)[key])
      }
    })

    setStyles(el, styles)
  }

  function reset(el: HTMLElement) {
    const propCache = cache.get(el)

    if (!propCache) return

    setStyles(el, Object.fromEntries(propCache))

    propCache.clear()
    cache.delete(el)
  }

  return {
    set,
    reset,
  }
}

function setStyles(node: HTMLElement, styles: CSSProperties) {
  Object.entries(styles).forEach(([key, value]) => {
    if (key.startsWith('--')) {
      if (value == null || value === '') {
        node.style.removeProperty(key)
      } else {
        node.style.setProperty(key, value)
      }
    } else {
      if (value == null) {
        ;(node.style as any)[key] = ''
      } else {
        ;(node.style as any)[key] = value
      }
    }
  })
}
