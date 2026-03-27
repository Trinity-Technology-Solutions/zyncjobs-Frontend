// Override window.alert BEFORE React mounts
// Dispatches a custom event that GlobalAlert listens to
const originalAlert = window.alert.bind(window);

window.alert = (message?: unknown) => {
  const msg = String(message ?? '');
  // Dispatch custom event so GlobalAlert can catch it
  window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));
};

export { originalAlert };
