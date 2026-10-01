// Optional generated images (see app/assets/images/README.md). Vite resolves
// the glob at build time, so a missing file simply means "use the SVG art".
import type { SpeciesId } from '~/data/species'

const speciesFiles = import.meta.glob('../assets/images/species/*.{webp,png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const onboardingFiles = import.meta.glob('../assets/images/onboarding/*.{webp,png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const byName = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), url]))

const species = byName(speciesFiles)
const onboarding = byName(onboardingFiles)

export function speciesImageUrl(id: SpeciesId): string | null {
  return species[id] ?? null
}
export function onboardingImageUrl(name: string): string | null {
  return onboarding[name] ?? null
}
