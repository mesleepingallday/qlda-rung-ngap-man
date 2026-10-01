<script setup lang="ts">
import { BadgeCheck, Clock, MessageCircleQuestion } from '@lucide/vue'
import { STATUS, type ObsStatus } from '~/composables/useObservations'

defineProps<{ status: ObsStatus; size?: 'sm' | 'md' }>()
const ICONS = { pending: Clock, verified: BadgeCheck, needs_info: MessageCircleQuestion }
</script>

<template>
  <UiBadge :tone="STATUS[status].tone" :icon="ICONS[status]" :size="size ?? 'sm'">{{ STATUS[status].label }}</UiBadge>
</template>
