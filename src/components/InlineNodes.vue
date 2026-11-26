<template>
  <text class="inline-wrap">
    <template v-for="(node, ni) in safeNodes" :key="ni">
      <text v-if="node.type === 'text'">{{ node.content }}</text>
      <text v-else-if="node.type === 'bold'" class="md-bold">{{ node.content }}</text>
      <text v-else-if="node.type === 'italic'" class="md-italic">{{ node.content }}</text>
      <text v-else-if="node.type === 'code'" class="md-inline-code">{{ node.content }}</text>
      <text v-else-if="node.type === 'strikethrough'" class="md-strike">{{ node.content }}</text>
      <text
        v-else-if="node.type === 'entity'"
        class="md-entity"
        :class="'entity-' + node.kind"
        :data-kind="node.kind"
        :data-name="node.name"
        @tap.stop="onEntityTap"
      >{{ node.content }}</text>
      <text v-else-if="node.type === 'br'">\n</text>
    </template>
  </text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InlineNode } from '@/utils/markdown'

const props = defineProps<{
  nodes?: InlineNode[]
}>()

/**
 * 实体（方剂 / 穴位）点击跳转详情。
 * 用静态方法 + dataset 取值：避免在 v-for 里为每个节点生成闭包处理器，
 * 小程序渲染层对这种动态处理器绑定兼容性较差。
 */
function onEntityTap(e: any) {
  const ds = (e && e.currentTarget && e.currentTarget.dataset) || {}
  const name = ds.name ? String(ds.name) : ''
  if (!name) return
  const kind = ds.kind === 'formula' ? 'formula' : 'acupoint'
  const url = kind === 'formula'
    ? `/pages/formulas/detail?name=${encodeURIComponent(name)}`
    : `/pages/acupuncture/detail?name=${encodeURIComponent(name)}`
  uni.navigateTo({ url, fail: () => {} })
}

// 兜底：任何非数组输入都按空数组渲染，避免小程序 wx:for 迭代 undefined 报错
const safeNodes = computed<InlineNode[]>(() => (Array.isArray(props.nodes) ? props.nodes : []))
</script>

<style lang="scss" scoped>
.inline-wrap {
  display: inline;
}

.md-bold {
  font-weight: 700;
  color: var(--text-primary, var(--text-primary));
}

.md-italic {
  font-style: italic;
  color: var(--text-primary, var(--text-primary));
}

.md-inline-code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
  background: var(--brand-soft);
  color: var(--primary, var(--brand-ink));
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.md-strike {
  text-decoration: line-through;
  color: var(--text-muted, var(--text-muted));
}

/* 可点击实体：方剂 / 穴位 */
.md-entity {
  color: var(--brand-ink);
  border-bottom: 1rpx solid var(--brand-soft);
}

.md-entity.entity-acupoint {
  color: var(--jade-ink);
  border-bottom-color: var(--jade-soft);
}

.md-entity:active {
  opacity: 0.6;
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
