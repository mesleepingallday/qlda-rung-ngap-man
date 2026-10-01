// Register the offline service worker in production builds only (dev
// servers change assets constantly) and tell people when they go offline.
export default defineNuxtPlugin(() => {
  const { show } = useToast()
  window.addEventListener('offline', () => show('Đang ngoại tuyến. Dữ liệu đã tải vẫn dùng được.', { tone: 'warn', ms: 5000 }))
  window.addEventListener('online', () => show('Đã có kết nối trở lại.', { tone: 'ok' }))
  if (import.meta.dev || !('serviceWorker' in navigator) || useRuntimeConfig().public.noSw) return
  const url = `${useRuntimeConfig().app.baseURL}sw.js`
  const register = () => navigator.serviceWorker.register(url).catch(() => { /* offline support is optional */ })
  // The SPA may boot after window "load" has already fired.
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
