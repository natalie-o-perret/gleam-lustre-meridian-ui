export function after(milliseconds, done) {
  setTimeout(done, Math.max(0, milliseconds));
}
