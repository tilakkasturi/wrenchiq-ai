// Version and build date are injected at build time by vite.config.js
// Falls back to "dev" when running without a build (vite dev server)
export function useAppVersion() {
  return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
}

export function useAppBuilt() {
  return typeof __APP_BUILT__ !== "undefined" ? __APP_BUILT__ : "";
}
