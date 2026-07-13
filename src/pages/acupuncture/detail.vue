<template>
  <view class="container" v-if="pointInfo">
    <!-- 头部 -->
    <view class="header">
      <text class="point-name">{{ pointName }}</text>
      <text class="meridian-name">{{ meridianName }}</text>
    </view>

    <!-- 定位 -->
    <view class="section">
      <text class="section-title">定位方法</text>
      <text class="content">{{ pointInfo.position }}</text>
    </view>

    <!-- 主治 -->
    <view class="section">
      <text class="section-title">主治病症</text>
      <text class="content highlight-text">{{ pointInfo.indication }}</text>
    </view>

    <!-- 常用配穴 -->
    <view class="section">
      <text class="section-title">常用配穴</text>
      <view class="combo-list">
        <view
          v-for="(combo, index) in combos"
          :key="index"
          class="combo-item"
        >
          <view class="combo-header">
            <text class="combo-points">{{ pointInfo.combination[index] }}</text>
          </view>
          <text class="combo-effect">{{ pointInfo.combinationEffect[index] }}</text>
        </view>
      </view>
    </view>

    <!-- 穴位定位 -->
    <PointLocator :point-name="pointName" :meridian-name="meridianName" :position="pointInfo.position" />

    <!-- 临床应用 -->
    <view class="section">
      <text class="section-title">临床应用要点</text>
      <text class="content">{{ clinicalNotes }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import meridiansData from '@/data/acupoints.json'
import PointLocator from '@/components/PointLocator.vue'

const meridianName = ref('')
const pointName = ref('')

const pointInfo = computed(() => {
  for (const meridian of meridiansData.meridians) {
    if (meridian.name === meridianName.value) {
      return meridian.points.find(p => p.name === pointName.value)
    }
  }
  return null
})

const combos = computed(() => {
  if (!pointInfo.value) return []
  return pointInfo.value.combination.map((c: string, i: number) => ({
    points: c,
    effect: pointInfo.value!.combinationEffect[i]
  }))
})

// 临床应用要点
const clinicalNotesData: Record<string, string> = {
  '合谷': '合谷穴为手阳明大肠经原穴，临床应用极为广泛。针刺时注意：孕妇禁针，因本穴有催产作用。治疗头面五官疾病效果显著，常与太冲穴配伍称为"开四关"，可调理全身气机。本穴止痛效果好，是各种痛症的常用穴。',
  '曲池': '曲池穴为手阳明大肠经合穴，五行属土。本穴善于清热，凡发热性疾病皆可选用。配伍合谷可疏风解表，配伍足三里可清热和胃。高血压患者常按揉此穴有辅助降压作用。',
  '足三里': '足三里穴为足阳明胃经合穴，五行属土，是人体最重要的保健强壮穴之一。常灸此穴可增强体质、预防疾病。配伍中脘治胃病，配伍气海治气虚，配伍三阴交调理脾胃。本穴主治范围广，有"肚腹三里留"之说。',
  '三阴交': '三阴交穴为足太阴脾经穴，是肝、脾、肾三经交会穴，临床应用广泛。本穴为妇科要穴，凡月经不调、带下、不孕等妇科疾病皆可选用。孕妇禁针。配伍血海调经，配伍足三里健脾，配伍太冲疏肝。',
  '太冲': '太冲穴为足厥阴肝经原穴、输穴，五行属土。本穴为疏肝理气要穴，凡肝气郁结所致的头痛、眩晕、胁痛等皆可选用。与合谷配伍称为"开四关"，可调理全身气机。常按揉此穴可缓解压力、改善情绪。',
  '内关': '内关穴为手厥阴心包经络穴，八脉交会穴通阴维脉。本穴为治疗心胸胃疾病要穴，配伍公孙治心胸胃痛效果显著。常按揉此穴可缓解心悸、胸闷、恶心等症状。晕车时按压内关穴有止吐作用。',
  '百会': '百会穴位于头顶正中，为督脉穴，手足三阳经与督脉交会穴。本穴为升阳举陷要穴，凡气虚下陷所致的脱肛、子宫脱垂、泄泻等皆可选用。常灸此穴可健脑益智、预防老年痴呆。',
  '大椎': '大椎穴为督脉穴，手足三阳经与督脉交会穴。本穴为退热要穴，凡发热性疾病皆可选用。配伍曲池清热，配伍肺俞宣肺。常按揉此穴可增强免疫力、预防感冒。',
  '关元': '关元穴为任脉穴，小肠募穴，是人体重要的保健强壮穴。本穴位于丹田之处，常灸此穴可培元固真、延年益寿。配伍气海补气，配伍肾俞温肾。需排尿后针刺，以免损伤膀胱。',
  '气海': '气海穴为任脉穴，本穴为补气要穴，凡气虚所致的各种病症皆可选用。配伍关元培元固本，配伍足三里补中益气。常灸此穴可增强体质、改善亚健康状态。',
  '神门': '神门穴为手少阴心经原穴、输穴，本穴为安神要穴，凡失眠、健忘、心悸等心神不宁之症皆可选用。配伍内关宁心安神，配伍三阴交养心安神。常按揉此穴可改善睡眠质量。',
  '后溪': '后溪穴为手太阳小肠经输穴，八脉交会穴通督脉。本穴为治疗颈椎病要穴，配伍申脉通督脉。常按揉此穴可缓解颈椎疼痛、改善颈部活动度。',
  '太溪': '太溪穴为足少阴肾经原穴、输穴，本穴为补肾要穴，凡肾虚所致的各种病症皆可选用。配伍肾俞滋阴补肾，配伍关元温肾壮阳。常按揉此穴可增强肾功能、改善腰膝酸软。',
  '外关': '外关穴为手少阳三焦经络穴，八脉交会穴通阳维脉。本穴与内关相对，为表里经络穴配伍要穴。配伍内关调理气机，配伍合谷疏风解表。常按揉此穴可缓解头痛、耳鸣等症状。',
  '风池': '风池穴为足少阳胆经穴，手足阳维脉与足少阳经交会穴。本穴为治疗头面部疾病要穴，配伍合谷疏风清热，配伍太阳治头痛。常按揉此穴可缓解头痛、眩晕、颈项强痛。',
  '阳陵泉': '阳陵泉穴为足少阳胆经合穴，八会穴之筋会。本穴为治疗筋病要穴，凡筋脉拘急、下肢痿痹等皆可选用。配伍足三里疏肝利胆，配伍悬钟强筋壮骨。',
  '委中': '委中穴为足太阳膀胱经合穴，本穴为治疗腰背疾病要穴，有"腰背委中求"之说。配伍肾俞强腰壮肾，配伍环跳治坐骨神经痛。本穴可点刺出血治疗急性吐泻。',
  '承山': '承山穴为足太阳膀胱经穴，本穴为治疗小腿抽筋要穴。配伍委中舒筋活络，配伍昆仑通络止痛。常按揉此穴可缓解小腿疲劳、预防抽筋。',
  '昆仑': '昆仑穴为足太阳膀胱经经穴，本穴善于治疗头痛、项强、腰腿痛。配伍申脉通络止痛，配伍委中舒筋活络。孕妇禁针。常按揉此穴可缓解足跟痛。',
  '中脘': '中脘穴为任脉穴，胃之募穴，八会穴之腑会。本穴为治疗脾胃病要穴，配伍足三里健脾和胃，配伍内关和胃降逆。常按揉此穴可改善消化功能。',
  '涌泉': '涌泉穴为足少阴肾经井穴，本穴为急救要穴，配伍太溪滋阴降火，配伍百会醒脑开窍。睡前按揉涌泉穴可引火归元、改善睡眠。'
}

const clinicalNotes = computed(() => {
  return clinicalNotesData[pointName.value] || '该穴位为常用针灸穴位，具体临床应用请参考针灸学教材或咨询专业中医师。针刺操作需由专业医师进行。'
})

onLoad((options) => {
  if (options?.meridian) {
    meridianName.value = decodeURIComponent(options.meridian)
  }
  if (options?.point) {
    pointName.value = decodeURIComponent(options.point)
    uni.setNavigationBarTitle({ title: pointName.value })
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #9370DB, #BA55D3);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.point-name {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.meridian-name {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.highlight-text {
  color: #8B0000;
  font-weight: 500;
}

.combo-list {
  display: grid;
  gap: 12rpx;
}

.combo-item {
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  border-left: 4rpx solid #9370DB;
}

.combo-header {
  margin-bottom: 4rpx;
}

.combo-points {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.combo-effect {
  font-size: 24rpx;
  color: #9370DB;
}

.diagram-container {
  padding: 20rpx;
}

.diagram-placeholder {
  height: 200rpx;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.diagram-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 8rpx;
}

.diagram-hint {
  font-size: 22rpx;
  color: #999;
}
</style>
