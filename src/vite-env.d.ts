/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_E2E_ROUTES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
