// Tiny in-process lock to serialise work (inventory writes, heavy image jobs).
// For multi-instance deployments use MongoDB transactions or a distributed lock.
function createLock() {
  let tail = Promise.resolve();
  return (fn) => {
    const run = tail.then(fn, fn);
    tail = run.catch(() => {});
    return run;
  };
}
module.exports = { withLock: createLock(), createLock };
