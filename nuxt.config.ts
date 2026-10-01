// Rừng ngập mặn Huế: single codebase for the web app and the installable
// mobile app (PWA). Client-rendered: the map, the offline store and the
// onboarding state all live in the browser.
const hashMode = process.env.NUXT_HASH_ROUTER === '1'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  ssr: false,
  devtools: { enabled: false },
  telemetry: false,

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'vi' },
      title: 'Rừng ngập mặn Huế',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Khám phá rừng ngập mặn Rú Chá dưới dạng mô hình 3D, nhận dạng loài cây và cùng góp dữ liệu cho khu rừng.' },
        { name: 'theme-color', content: '#f4f5f2', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0f1110', media: '(prefers-color-scheme: dark)' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Ngập mặn' },
        { property: 'og:title', content: 'Rừng ngập mặn Huế' },
        { property: 'og:description', content: 'Khám phá Rú Chá như một mô hình sống: nhận dạng loài, theo dõi thủy triều và cùng góp dữ liệu.' },
        { property: 'og:image', content: '/icons/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },

  css: [
    '@fontsource-variable/inter/opsz.css',
    '@fontsource-variable/inter/opsz-italic.css',
    '~/assets/css/tokens.css',
    '~/assets/css/base.css',
  ],

  // Components are referenced by file name (e.g. <ObsRow>), folders only group them.
  components: [{ path: '~/components', pathPrefix: false }],

  router: { options: { hashMode } },

  runtimeConfig: {
    public: {
      // Static previews (e.g. hash-routed builds) skip the service worker.
      noSw: process.env.NUXT_PUBLIC_NO_SW === '1' || hashMode,
    },
  },

  typescript: { strict: true },

  vite: {
    worker: { format: 'es' },
    optimizeDeps: { include: ['maplibre-gl'] },
  },
})
