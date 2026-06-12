/**
 * Lightweight client-side logger with a DEBUG flag.
 *
 * - `log` is silenced in production builds (only emits when import.meta.env.DEV
 *   is true, i.e. during `vite dev`). Use it for informational/debug traces.
 * - `warn` and `error` always emit — operational warnings and errors must stay
 *   visible in production.
 *
 * import.meta.env.DEV is provided by Vite and is only valid in client code.
 */
export const logger = {
  log: (...a: any[]) => {
    if (import.meta.env.DEV) console.log(...a);
  },
  warn: console.warn,
  error: console.error,
};
