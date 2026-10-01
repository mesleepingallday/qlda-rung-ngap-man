<script setup lang="ts">
// Hand-drawn morphology glyphs (64 × 64, stroke = currentColor). Used as
// answer cards in the identification key and as species glyphs, so the
// same visual vocabulary teaches what to look for everywhere in the app.
import type { ArtId } from '~/data/key'

defineProps<{ art: ArtId; title?: string }>()

type El = { d: string; f?: 'tint' | 'paper' | 'solid'; w?: number; o?: number }
const ART: Record<ArtId, El[]> = {
  'form-tree': [
    { d: 'M19 36c-5 0-8-4-7-8 1-4 5-6 8-5 1-6 6-10 12-10 5 0 9 3 11 8 5-1 10 3 10 8s-4 7-8 7H19z', f: 'tint' },
    { d: 'M32 37v17M32 45l-6-5M32 43l6-5' },
    { d: 'M17 54h30' },
  ],
  'form-shrub': [
    { d: 'M10 47c0-9 9-17 22-17s22 8 22 17H10z', f: 'tint' },
    { d: 'M17 38l-3-3M24 33l-1-4M32 31v-4M40 33l1-4M47 38l3-3' },
    { d: 'M25 54l3-7M32 54v-7M39 54l-3-7' },
    { d: 'M8 54h48' },
  ],
  'form-climber': [
    { d: 'M40 8v46', w: 4, o: 0.28 },
    { d: 'M26 54c8-3 18-6 14-13s-14-6-10-13 14-7 12-14' },
    { d: 'M30 43c-5 1-8-1-9-4 4-1 7 1 9 4zM36 29c5 1 8-1 9-4-4-1-7 1-9 4zM34 16c-5 0-7-3-7-6 4 0 6 3 7 6z', f: 'tint' },
    { d: 'M16 54h36' },
  ],
  'form-tuft': [
    { d: 'M32 54V35M32 39l-9-8M32 37l9-9' },
    { d: 'M23 31c-6-1-11-4-13-9M23 31c-3-5-4-11-2-16M23 31c1-6 5-11 10-13M23 31c4-3 9-4 13-2M41 28c-3-5-3-11 0-16M41 28c2-5 6-9 12-10M41 28c5-1 10 1 13 5M41 28c-5-3-10-3-14 0' },
    { d: 'M32 46l-6 8M32 46l6 8M32 48l-2 6M32 48l2 6' },
    { d: 'M16 54h32' },
  ],
  'leaf-simple': [
    { d: 'M32 8c11 7 15 18 12 29-2 8-6 12-12 15-6-3-10-7-12-15-3-11 1-22 12-29z', f: 'tint' },
    { d: 'M32 12v46M32 24l-6-5M32 24l6-5M32 33l-8-5M32 33l8-5M32 42l-7-4M32 42l7-4' },
  ],
  'leaf-compound': [
    { d: 'M32 60V12' },
    { d: 'M31 46c-4-6-11-8-17-5 4 6 11 8 17 5zM33 46c4-6 11-8 17-5-4 6-11 8-17 5zM31 31c-4-6-11-8-17-5 4 6 11 8 17 5zM33 31c4-6 11-8 17-5-4 6-11 8-17 5zM32 17c-5-3-6-9-1-13 6 3 6 9 1 13z', f: 'tint' },
  ],
  'leaf-strap': [
    { d: 'M13 57C21 41 35 23 53 9c-1 5-4 9-7 12C34 33 25 45 18 58z', f: 'tint' },
    { d: 'M15.5 57.5C25 42 37 27 50 14' },
  ],
  'margin-spiny': [
    { d: 'M32 6l4 8 8-1-3 8 8 3-6 6 6 6-8 2 2 8-8-1-3 9-3-9-8 1 2-8-8-2 6-6-6-6 8-3-3-8 8 1z', f: 'tint' },
    { d: 'M32 14v38M32 52v8' },
  ],
  'margin-smooth': [
    { d: 'M32 7c12 8 15 22 11 33-3 7-7 11-11 13-4-2-8-6-11-13-4-11-1-25 11-33z', f: 'tint' },
    { d: 'M32 11v42M32 53v6' },
  ],
  'roots-prop': [
    { d: 'M32 6v30', w: 4 },
    { d: 'M32 28c-7 4-12 13-14 26M32 28c7 4 12 13 14 26M32 34c-3 5-6 12-7 20M32 34c3 5 6 12 7 20' },
    { d: 'M8 54h48' },
    { d: 'M12 59h7M28 59h8M45 59h7', o: 0.45 },
  ],
  'roots-none': [
    { d: 'M32 6v44', w: 4 },
    { d: 'M27 54c3-2 4-5 5-9 1 4 2 7 5 9' },
    { d: 'M8 54h48' },
    { d: 'M12 59h7M28 59h8M45 59h7', o: 0.45 },
  ],
  'sap-yes': [
    { d: 'M8 46L37 29', w: 5 },
    { d: 'M37 29l3-6 2 5 4-3-1 6' },
    { d: 'M43 35c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z', f: 'paper' },
    { d: 'M45 56a2 2 0 1 0 0.1 0', f: 'paper' },
  ],
  'sap-no': [
    { d: 'M8 46L37 29', w: 5 },
    { d: 'M37 29l3-6 2 5 4-3-1 6' },
    { d: 'M14 39c3 0 4 2 4 4M24 33c3 0 4 2 4 4', o: 0.5 },
  ],
  'flower-spike': [
    { d: 'M32 58V30' },
    { d: 'M32 46c-6-3-12-1-16 3 6 3 12 2 16-3zM32 46c6-3 12-1 16 3-6 3-12 2-16-3z', f: 'tint' },
    { d: 'M32 31a4 4 0 1 0 .1 0M27 25a4 4 0 1 0 .1 0M37 25a4 4 0 1 0 .1 0M32 19a4 4 0 1 0 .1 0M28.5 12.5a3.5 3.5 0 1 0 .1 0M35.5 12.5a3.5 3.5 0 1 0 .1 0M32 6a3 3 0 1 0 .1 0', f: 'tint' },
  ],
  'flower-pea': [
    { d: 'M14 8c11 2 19 11 21 25' },
    { d: 'M21 15a3.5 3.5 0 1 0 .1 0M27 21a3.5 3.5 0 1 0 .1 0M31 29a3.5 3.5 0 1 0 .1 0M34 37a3.5 3.5 0 1 0 .1 0M36 45a3.5 3.5 0 1 0 .1 0M37 53a3 3 0 1 0 .1 0', f: 'tint' },
    { d: 'M18 15h3M24 21h3M28 29h3M31 37h3M33 45h3', o: 0.5 },
  ],
  'flower-catkin': [
    { d: 'M8 14h30' },
    { d: 'M17 14c-2-5 0-9 6-10 1 5-1 9-6 10zM45 15c5-3 9-2 11 2-4 3-8 2-11-2z', f: 'tint' },
    { d: 'M31 15c2 12 4 25 6 37', w: 7, o: 0.18 },
    { d: 'M31.5 19h.1M33 25h.1M34 31h.1M35 37h.1M36 43h.1M36.5 49h.1M30 22h.1M35.5 28h.1M32.5 34h.1M37.5 40h.1M34 46h.1', w: 3 },
  ],
  'flower-bract': [
    { d: 'M32 6v14' },
    { d: 'M32 20c-9 6-12 19-7 32 5-7 7-17 7-32zM32 20c9 6 12 19 7 32-5-7-7-17-7-32z', f: 'paper' },
    { d: 'M32 22v28', w: 4, o: 0.3 },
  ],
  'fruit-multiple': [
    { d: 'M32 20a17 17 0 1 0 .1 0', f: 'tint' },
    { d: 'M18 30l7 4 7-4 7 4 7-4M16 40l8 4 8-4 8 4 8-4M20 50l6-2 6 3 6-3 6 2M25 34v10M39 34v10M32 30v-9', o: 0.6 },
    { d: 'M32 20v-8M32 13c-4-4-9-5-14-3M32 13c4-4 9-5 14-3' },
  ],
  'fruit-pod': [
    { d: 'M11 46c9-15 25-25 43-27-6 13-23 25-43 27z', f: 'tint' },
    { d: 'M14 43c9-12 23-20 37-22', o: 0.6 },
    { d: 'M24 39a2.5 2.5 0 1 0 .1 0M33 34a2.5 2.5 0 1 0 .1 0M42 29a2.5 2.5 0 1 0 .1 0', o: 0.7 },
    { d: 'M11 46l-5 5' },
  ],
  'fruit-lobed': [
    { d: 'M32 13a10 10 0 1 0 .1 0M22.5 29a10 10 0 1 0 .1 0M41.5 29a10 10 0 1 0 .1 0', f: 'tint' },
    { d: 'M32 33v-6M32 33l-5 4M32 33l5 4', o: 0.6 },
  ],
  'fruit-capsule': [
    { d: 'M32 7c7 6 10 18 8 30-1 7-4 11-8 11s-7-4-8-11c-2-12 1-24 8-30z', f: 'tint' },
    { d: 'M32 11v34', o: 0.55 },
    { d: 'M23 51c3-3 6-3 9 0 3-3 6-3 9 0M32 51v8' },
  ],
}
</script>

<template>
  <svg class="art" viewBox="0 0 64 64" :role="title ? 'img' : undefined" :aria-label="title" :aria-hidden="title ? undefined : 'true'">
    <path
      v-for="(el, i) in ART[art]"
      :key="i"
      :d="el.d"
      :class="el.f ? `f-${el.f}` : 'f-none'"
      :stroke-width="el.w ?? 2.2"
      :opacity="el.o"
    />
  </svg>
</template>

<style scoped>
.art { width: 100%; height: 100%; overflow: visible; }
path { stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; fill: none; }
.f-tint { fill: currentColor; fill-opacity: 0.14; }
.f-paper { fill: var(--bg-elevated); }
.f-solid { fill: currentColor; }
</style>
