/**
 * Global type definitions for build-time constants.
 * These constants are replaced by @rollup/plugin-replace during the build process.
 */

/**
 * Development mode flag. Set to `true` in development builds, `false` in production builds.
 * Use this instead of `process.env.NODE_ENV` to avoid dependency on specific build tools.
 *
 * @example
 * ```ts
 * if (__DEV__) {
 *   console.log('Detailed debug information')
 * }
 * ```
 */
declare const __DEV__: boolean
