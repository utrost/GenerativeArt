const DEFAULT_BASE_PATH = '/genart/';

export function registerServiceWorker({
  windowRef = globalThis.window,
  navigatorRef = globalThis.navigator,
  basePath = DEFAULT_BASE_PATH,
} = {}) {
  if (!windowRef || !navigatorRef || !('serviceWorker' in navigatorRef)) {
    return Promise.resolve(undefined);
  }

  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const serviceWorkerUrl = `${normalizedBase}sw.js`;

  return new Promise((resolve) => {
    windowRef.addEventListener('load', () => {
      resolve(navigatorRef.serviceWorker.register(serviceWorkerUrl, { scope: normalizedBase }));
    });
  });
}
