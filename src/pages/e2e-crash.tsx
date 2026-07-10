/** Throws on render — only registered when VITE_ENABLE_E2E_ROUTES is set at build time. */
export default function E2eCrashPage(): never {
  throw new Error('E2E crash test')
}
