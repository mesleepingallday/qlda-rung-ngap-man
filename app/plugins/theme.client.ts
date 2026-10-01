// Apply the saved theme before the first paint of the app shell.
export default defineNuxtPlugin(() => {
  useTheme().apply()
})
