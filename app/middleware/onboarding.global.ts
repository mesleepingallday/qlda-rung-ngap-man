// First visit goes through onboarding; everything else stays reachable by
// deep link afterwards (shared links to a species or a patch keep working).
export default defineNuxtRouteMiddleware((to) => {
  const { isOnboarded } = useUser()
  if (!isOnboarded.value && to.path !== '/welcome') {
    return navigateTo({ path: '/welcome', query: to.fullPath !== '/' ? { next: to.fullPath } : undefined })
  }
})
