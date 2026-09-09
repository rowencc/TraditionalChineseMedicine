<template>
  <text class="inline-wrap">
    <template v-for="(node, ni) in nodes" :key="ni">
      <text v-if="node.type === 'text'">{{ node.content }}</text>
      <text v-else-if="node.type === 'bold'" class="md-bold">{{ node.content }}</text>
      <text v-else-if="node.type === 'italic'" class="md-italic">{{ node.content }}</text>
      <text v-else-if="node.type === 'code'" class="md-inline-code">{{ node.content }}</text>
      <text v-else-if="node.type === 'strikethrough'" class="md-strike">{{ node.content }}</text>
      <text v-else-if="node.type === 'br'">\n</text>
    </template>
  </text>
</template>

<script setup lang="ts">
import type { InlineNode } from '@/utils/markdown'

defineProps<{
  nodes: InlineNode[]
}>()
</script>

<style lang="scss" scoped>
.inline-wrap {
  display: inline;
}

.md-bold {
  font-weight: 700;
  color: var(--text-primary, #2C2C2C);
}

.md-italic {
  font-style: italic;
  color: var(--text-primary, #2C2C2C);
}

.md-inline-code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
  background: rgba(139, 37, 0, 0.08);
  color: var(--primary, #8B2500);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.md-strike {
  text-decoration: line-through;
  color: var(--text-muted, #999);
}

/* 暗色主题 */
.is-dark .md-bold,
.is-dark .md-italic {
  color: #E8E8E8;
}
.is-dark .md-inline-code {
  background: rgba(192, 69, 32, 0.18);
  color: #E0A57A;
}
</style>
