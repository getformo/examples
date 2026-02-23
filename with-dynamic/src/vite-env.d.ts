/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENVIRONMENT_ID: string
  readonly VITE_FORMO_WRITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
