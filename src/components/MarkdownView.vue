<template>
  <view class="markdown" :class="themeClass">
    <template v-for="(block, bi) in blocks" :key="bi">
      <!-- 标题 -->
      <view v-if="block.type === 'heading'" class="md-heading" :class="`level-${block.level}`">
        <text v-if="block.level <= 3" class="md-heading-mark">◆</text>
        <inline-nodes :nodes="block.inline" />
      </view>

      <!-- 段落 -->
      <view v-else-if="block.type === 'paragraph'" class="md-paragraph">
        <inline-nodes :nodes="block.inline" />
      </view>

      <!-- 无序列表 -->
      <view v-else-if="block.type === 'ul'" class="md-list md-ul">
        <view v-for="(item, ii) in block.items" :key="ii" class="md-list-item">
          <text class="md-bullet">·</text>
          <view class="md-list-content">
            <inline-nodes :nodes="item.inline" />
          </view>
        </view>
      </view>

      <!-- 有序列表 -->
      <view v-else-if="block.type === 'ol'" class="md-list md-ol">
        <view v-for="(item, ii) in block.items" :key="ii" class="md-list-item">
          <text class="md-num">{{ block.start + ii }}.</text>
          <view class="md-list-content">
            <inline-nodes :nodes="item.inline" />
          </view>
        </view>
      </view>

      <!-- 引用 -->
      <view v-else-if="block.type === 'quote'" class="md-quote">
        <inline-nodes :nodes="block.inline" />
      </view>

      <!-- 代码块 -->
      <view v-else-if="block.type === 'code'" class="md-code">
        <text v-if="block.lang" class="md-code-lang">{{ block.lang }}</text>
        <text class="md-code-content" selectable>{{ block.code }}</text>
      </view>

      <!-- 表格 -->
      <view v-else-if="block.type === 'table'" class="md-table-wrap">
        <scroll-view scroll-x class="md-table-scroll" :scroll-into-view="''">
          <view class="md-table">
            <!-- 表头 -->
            <view class="md-table-row md-table-header">
              <view v-for="(cell, ci) in block.header" :key="ci" class="md-table-cell" :class="`align-${cell.align || 'left'}`">
                <inline-nodes :nodes="cell.inline" />
              </view>
            </view>
            <!-- 数据行 -->
            <view v-for="(row, ri) in block.rows" :key="ri" class="md-table-row" :class="{ 'md-table-row-even': ri % 2 === 0 }">
              <view v-for="(cell, ci) in row" :key="ci" class="md-table-cell" :class="`align-${cell.align || 'left'}`">
                <inline-nodes :nodes="cell.inline" />
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 分隔线 -->
      <view v-else-if="block.type === 'hr'" class="md-hr"></view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseMarkdown } from '@/utils/markdown'
import type { Block } from '@/utils/markdown'
import { useTheme } from '@/utils/theme'
import InlineNodes from './InlineNodes.vue'

const props = defineProps<{
  content: string
}>()

const { themeClass } = useTheme()
const blocks = computed<Block[]>(() => parseMarkdown(props.content || ''))
</script>

<style lang="scss" scoped>
.markdown {
  font-size: 28rpx;
  color: var(--text-secondary, #444);
  line-height: 1.75;
  word-break: break-word;
}

/* 标题 */
.md-heading {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  font-weight: 700;
  color: var(--text-primary, #2C2C2C);
  margin-bottom: 12rpx;
  margin-top: 4rpx;
}

.md-heading-mark {
  color: var(--primary, #8B2500);
  font-size: 22rpx;
  line-height: 1;
  flex-shrink: 0;
  position: relative;
  top: -4rpx;
}

.level-1 { font-size: 38rpx; margin-top: 16rpx; margin-bottom: 16rpx; }
.level-2 { font-size: 34rpx; }
.level-3 { font-size: 30rpx; }
.level-4 { font-size: 28rpx; color: var(--primary, #8B2500); }
.level-5 { font-size: 28rpx; color: var(--secondary, #2D5F4A); }
.level-6 { font-size: 26rpx; color: var(--text-muted, #999); }

/* 段落 */
.md-paragraph {
  margin-bottom: 12rpx;
  color: var(--text-secondary, #444);
}

/* 列表 */
.md-list {
  margin-bottom: 12rpx;
}

.md-list-item {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.md-bullet {
  color: var(--primary, #8B2500);
  font-size: 32rpx;
  line-height: 1;
  flex-shrink: 0;
  font-weight: 700;
}

.md-num {
  color: var(--primary, #8B2500);
  font-size: 26rpx;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 36rpx;
}

.md-list-content {
  flex: 1;
  color: var(--text-secondary, #444);
}

/* 引用 */
.md-quote {
  border-left: 4rpx solid var(--accent, #B8860B);
  background: rgba(184, 134, 11, 0.06);
  padding: 12rpx 20rpx;
  margin: 12rpx 0;
  border-radius: 4rpx;
  color: var(--text-secondary, #555);
  font-style: italic;
}

/* 代码块 */
.md-code {
  background: #FAF7F0;
  border: 1rpx solid #E8E0D4;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  margin: 12rpx 0;
  overflow-x: auto;
}

.md-code-lang {
  display: block;
  font-size: 20rpx;
  color: var(--text-muted, #999);
  margin-bottom: 8rpx;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.md-code-content {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 24rpx;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

/* 分隔线 */
.md-hr {
  height: 2rpx;
  background: linear-gradient(to right, transparent, var(--border, #E8E0D4) 20%, var(--border, #E8E0D4) 80%, transparent);
  margin: 20rpx 0;
}

/* 表格 */
.md-table-wrap {
  margin: 16rpx 0;
  border: 1rpx solid var(--border, #E8E0D4);
  border-radius: 8rpx;
  overflow: hidden;
}

.md-table-scroll {
  width: 100%;
  max-height: 80vh;
  white-space: nowrap;
}

.md-table {
  display: inline-block;
  min-width: 100%;
}

.md-table-row {
  display: flex;
  border-bottom: 1rpx solid var(--border, #E8E0D4);
}

.md-table-row:last-child {
  border-bottom: none;
}

.md-table-header {
  background: rgba(139, 37, 0, 0.08);
  font-weight: 600;
  color: var(--text-primary, #2C2C2C);
}

.md-table-row-even {
  background: rgba(0, 0, 0, 0.02);
}

.md-table-cell {
  padding: 12rpx 16rpx;
  font-size: 24rpx;
  color: var(--text-secondary, #444);
  min-width: 120rpx;
  max-width: 320rpx;
  white-space: normal;
  word-break: break-word;
  border-right: 1rpx solid var(--border, #E8E0D4);
}

.md-table-cell:last-child {
  border-right: none;
}

.align-left { text-align: left; }
.align-center { text-align: center; }
.align-right { text-align: right; }

/* 暗色主题 */
.is-dark .markdown { color: #A0A0A0; }
.is-dark .md-heading { color: #E8E8E8; }
.is-dark .md-heading-mark { color: #C04520; }
.is-dark .level-4 { color: #C04520; }
.is-dark .level-5 { color: #3D7A62; }
.is-dark .level-6 { color: #707070; }
.is-dark .md-paragraph { color: #D0D0D0; }
.is-dark .md-bullet,
.is-dark .md-num { color: #C04520; }
.is-dark .md-list-content { color: #D0D0D0; }
.is-dark .md-quote {
  border-left-color: #C8960B;
  background: rgba(200, 150, 11, 0.1);
  color: #A0A0A0;
}
.is-dark .md-code {
  background: #1E1E1E;
  border-color: #2C2C2C;
}
.is-dark .md-code-lang { color: #707070; }
.is-dark .md-code-content { color: #D0D0D0; }
.is-dark .md-hr {
  background: linear-gradient(to right, transparent, #3A3A3A 20%, #3A3A3A 80%, transparent);
}
.is-dark .md-table-wrap { border-color: #2C2C2C; }
.is-dark .md-table-row { border-color: #2C2C2C; }
.is-dark .md-table-cell { border-color: #2C2C2C; color: #D0D0D0; }
.is-dark .md-table-header { background: rgba(192, 69, 32, 0.15); color: #E8E8E8; }
.is-dark .md-table-row-even { background: rgba(255, 255, 255, 0.02); }
</style>
