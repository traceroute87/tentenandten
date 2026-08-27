/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.jpg" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ANALYTICS_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
