/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_E2E_ROUTES?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_BUILD_TIME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
