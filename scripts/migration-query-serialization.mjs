/**
 * `pg.Client` represents one database connection. Data migrations sometimes
 * prepare independent reads with `Promise.all`, but issuing them concurrently
 * through one client triggers a deprecation warning in pg 8 and will be an
 * error in pg 9. This facade keeps the migration API unchanged while queuing
 * promise-based queries in call order.
 */
export function serializeMigrationClientQueries(client) {
  let pending = Promise.resolve();

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "query") {
        return (...args) => {
          const result = pending.then(() => target.query(...args));
          // A rejected migration query must not permanently block the queue;
          // the original rejection is still returned to the migration runner.
          pending = result.catch(() => undefined);
          return result;
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
