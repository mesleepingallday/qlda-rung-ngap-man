declare module '#app' {
  interface PageMeta {
    /** Content fills the viewport edge to edge (map screens). */
    fullBleed?: boolean
  }
}
declare module 'vue-router' {
  interface RouteMeta {
    fullBleed?: boolean
  }
}
export {}
