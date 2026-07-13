<template>
  <view class="locator-container">
    <view class="locator-header">
      <text class="locator-title">{{ pointName }} 穴位定位</text>
    </view>

    <!-- 参考图 -->
    <view class="reference-section">
      <text class="ref-label">经络参考图</text>
      <image class="reference-image" :src="referenceImage" mode="aspectFit" @tap="previewImage" />
      <text class="ref-hint">点击查看大图</text>
    </view>

    <!-- 定位步骤 -->
    <view class="location-steps">
      <text class="steps-title">取穴方法</text>
      <view v-for="(step, index) in locationSteps" :key="index" class="step-item">
        <view class="step-number">{{ index + 1 }}</view>
        <text class="step-text">{{ step }}</text>
      </view>
    </view>

    <!-- 简易取穴法 -->
    <view v-if="quickMethod" class="quick-method">
      <text class="quick-title">简便取穴法</text>
      <text class="quick-text">{{ quickMethod }}</text>
    </view>

    <!-- 体表标志 -->
    <view class="landmarks">
      <text class="landmarks-title">体表标志参考</text>
      <view class="landmark-grid">
        <view v-for="(landmark, index) in landmarks" :key="index" class="landmark-item">
          <text class="landmark-dot">-</text>
          <text class="landmark-text">{{ landmark }}</text>
        </view>
      </view>
    </view>

    <!-- 解剖位置说明 -->
    <view class="anatomy-section">
      <text class="anatomy-title">解剖位置</text>
      <text class="anatomy-text">{{ anatomyDescription }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  pointName: string
  meridianName: string
  position: string
}>()

// 参考图映射
const referenceImages: Record<string, string> = {
  '手太阴肺经': '/static/acupuncture/chinese.jpg',
  '手阳明大肠经': '/static/acupuncture/meridians.jpg',
  '足阳明胃经': '/static/acupuncture/meridians.jpg',
  '足太阴脾经': '/static/acupuncture/meridians.jpg',
  '手少阴心经': '/static/acupuncture/chinese.jpg',
  '手太阳小肠经': '/static/acupuncture/meridians.jpg',
  '足太阳膀胱经': '/static/acupuncture/meridians.jpg',
  '足少阴肾经': '/static/acupuncture/meridians.jpg',
  '手厥阴心包经': '/static/acupuncture/chinese.jpg',
  '手少阳三焦经': '/static/acupuncture/meridians.jpg',
  '足少阳胆经': '/static/acupuncture/meridians.jpg',
  '足厥阴肝经': '/static/acupuncture/meridians.jpg'
}

const referenceImage = computed(() => {
  return referenceImages[props.meridianName] || '/static/acupuncture/meridians.jpg'
})

// 穴位定位步骤
const locationStepsData: Record<string, string[]> = {
  '合谷': [
    '手背朝上，拇指与食指自然张开',
    '在第一、二掌骨之间',
    '第二掌骨桡侧的中点处',
    '按压有明显酸胀感'
  ],
  '曲池': [
    '屈肘成90度直角',
    '肘横纹外侧端凹陷处',
    '尺泽穴与肱骨外上髁连线的中点'
  ],
  '足三里': [
    '正坐屈膝',
    '外膝眼（犊鼻）下3寸（四横指）',
    '距胫骨前缘一横指（中指宽度）'
  ],
  '三阴交': [
    '正坐或仰卧位',
    '内踝尖直上3寸（四横指）',
    '胫骨内侧缘后方凹陷处'
  ],
  '太冲': [
    '正坐或仰卧位',
    '足背侧',
    '第一、二跖骨结合部之前凹陷处',
    '可触及足背动脉搏动'
  ],
  '内关': [
    '伸臂仰掌',
    '腕掌侧远端横纹上2寸（三横指）',
    '掌长肌腱与桡侧腕屈肌腱之间'
  ],
  '外关': [
    '伸臂俯掌',
    '腕背侧远端横纹上2寸（三横指）',
    '尺骨与桡骨间隙中点处'
  ],
  '百会': [
    '正坐位',
    '前发际正中直上5寸',
    '或两耳尖连线的中点处',
    '头顶正中最高点'
  ],
  '风池': [
    '正坐位，头略前倾',
    '项部枕骨之下',
    '胸锁乳突肌与斜方肌上端之间的凹陷处',
    '与风府穴相平'
  ],
  '大椎': [
    '正坐位，头微前倾',
    '后正中线上',
    '第七颈椎棘突下凹陷中',
    '低头时颈后最突出的骨头下方'
  ],
  '关元': [
    '仰卧位',
    '下腹部前正中线上',
    '脐中下3寸（四横指）处'
  ],
  '气海': [
    '仰卧位',
    '下腹部前正中线上',
    '脐中下1.5寸（二横指）处'
  ],
  '神门': [
    '仰掌',
    '腕掌侧远端横纹尺侧端',
    '尺侧腕屈肌腱的桡侧缘凹陷处'
  ],
  '后溪': [
    '微握拳',
    '手掌尺侧',
    '第五掌指关节尺侧近端赤白肉际凹陷处',
    '握拳时小指指尖所指处'
  ],
  '太溪': [
    '正坐平放足底',
    '足踝区内踝尖与跟腱之间',
    '内踝尖与跟腱之间的凹陷处',
    '可触及胫后动脉搏动'
  ],
  '委中': [
    '俯卧位',
    '腘窝横纹中点',
    '股二头肌腱与半腱肌肌腱之间'
  ],
  '承山': [
    '正坐或俯卧位',
    '小腿后面正中',
    '委中穴与昆仑穴之间',
    '伸直小腿时腓肠肌肌腹下出现尖角凹陷处'
  ],
  '昆仑': [
    '正坐位',
    '足踝区外踝尖与跟腱之间',
    '外踝尖与跟腱之间的凹陷处'
  ],
  '阳陵泉': [
    '正坐位',
    '小腿外侧',
    '腓骨头前下方凹陷处',
    '屈膝时腓骨小头前下方即是'
  ],
  '阴陵泉': [
    '正坐或仰卧位',
    '小腿内侧',
    '胫骨内侧髁后下方凹陷处',
    '沿胫骨内侧缘向上推至转折处即是'
  ],
  '中脘': [
    '仰卧位',
    '上腹部前正中线上',
    '脐中上4寸',
    '胸骨下端与肚脐连线中点'
  ],
  '涌泉': [
    '仰卧位',
    '足底部',
    '卷足时足前部凹陷处',
    '足底第2、3趾趾缝纹头端与足跟连线的前1/3处'
  ]
}

// 简便取穴法
const quickMethodData: Record<string, string> = {
  '合谷': '以一手拇指指间关节横纹放在另一手拇食指之间指蹼缘上，拇指尖下即是',
  '足三里': '用同侧手张开虎口围住髌骨上外缘，四指向下，中指尖处即是',
  '百会': '两耳尖向上连线与前正中线交点即是',
  '大椎': '低头时颈后最突出的骨头（第七颈椎）下方凹陷处即是',
  '劳宫': '握拳屈指时中指尖所指处即是',
  '涌泉': '足底前1/3与后2/3交界凹陷处，卷足时最凹陷处即是'
}

// 体表标志
const landmarksData: Record<string, string[]> = {
  '合谷': ['第一掌骨', '第二掌骨', '指蹼缘', '掌骨间背侧肌'],
  '曲池': ['肘横纹', '肱骨外上髁', '尺泽穴', '肱桡肌起始部'],
  '足三里': ['髌骨', '外膝眼（犊鼻）', '胫骨前缘', '胫骨前肌'],
  '三阴交': ['内踝尖', '胫骨内侧缘', '比目鱼肌', '趾长屈肌'],
  '太冲': ['第一跖骨间隙', '第二跖骨', '足背动脉', '拇长伸肌腱'],
  '内关': ['腕横纹', '掌长肌腱', '桡侧腕屈肌腱', '正中神经'],
  '外关': ['腕横纹', '尺骨', '桡骨', '骨间背侧神经'],
  '百会': ['前发际', '后发际', '耳尖', '矢状缝'],
  '风池': ['胸锁乳突肌', '斜方肌', '枕骨下缘', '枕动脉'],
  '大椎': ['第七颈椎棘突', '第一胸椎棘突', '项韧带', '斜方肌'],
  '关元': ['脐', '耻骨联合', '腹白线', '腹横筋膜'],
  '气海': ['脐', '腹白线', '腹直肌', '腹横筋膜'],
  '神门': ['腕横纹', '尺侧腕屈肌腱', '豌豆骨', '尺神经'],
  '后溪': ['第五掌指关节', '掌骨', '赤白肉际', '小指展肌'],
  '太溪': ['内踝尖', '跟腱', '胫后动脉', '胫神经'],
  '委中': ['腘横纹', '股二头肌腱', '半腱肌腱', '腘动脉'],
  '承山': ['腓肠肌', '跟腱', '比目鱼肌', '胫神经'],
  '昆仑': ['外踝尖', '跟腱', '腓骨短肌', '腓肠神经'],
  '阳陵泉': ['腓骨头', '腓骨长肌', '腓总神经', '膝外侧副韧带'],
  '阴陵泉': ['胫骨内侧髁', '腓肠肌内侧头', '膝内侧副韧带', '隐神经'],
  '中脘': ['脐', '胸骨剑突', '腹白线', '腹直肌'],
  '涌泉': ['足底腱膜', '趾短屈肌', '足底外侧动脉', '足底内侧神经']
}

// 解剖位置描述
const anatomyData: Record<string, string> = {
  '合谷': '在手背，第一、二掌骨间，第二掌骨桡侧的中点处。穴区皮肤→皮下组织→第一骨间背侧肌→拇收肌。浅层布有桡神经浅支，深部有正中神经的指掌侧固有神经。',
  '曲池': '在肘横纹外侧端，屈肘，尺泽与肱骨外上髁连线中点。穴区皮肤→皮下组织→肱桡肌→肱肌。浅层布有前臂背侧皮神经，深层有桡神经本干。',
  '足三里': '在小腿前外侧，犊鼻下3寸，距胫骨前缘一横指。穴区皮肤→皮下组织→胫骨前肌→趾长伸肌。浅层布有腓肠外侧皮神经，深层有腓深神经。',
  '三阴交': '在小腿内侧，内踝尖上3寸，胫骨内侧缘后方。穴区皮肤→皮下组织→趾长屈肌→胫骨后肌。浅层布有小腿内侧皮神经，深层有胫神经。',
  '太冲': '在足背侧，第一跖骨间隙的后方凹陷处。穴区皮肤→皮下组织→拇长伸肌腱与趾长伸肌腱之间→骨间背侧肌。浅层布有足背中间皮神经，深层有足背动脉。',
  '内关': '在前臂前区，腕掌侧远端横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间。穴区皮肤→皮下组织→指浅屈肌→指深屈肌。浅层布有前臂内侧皮神经，深层有正中神经本干。',
  '百会': '在头部，前发际正中直上5寸。穴区皮肤→皮下组织→帽状腱膜→腱膜下疏松结缔组织。浅层布有眶上神经、眶上动静脉和枕大神经吻合网。',
  '风池': '在项部，枕骨之下，胸锁乳突肌与斜方肌上端之间的凹陷处。穴区皮肤→皮下组织→斜方肌→头夹肌→头后大直肌。浅层布有枕小神经，深层有椎动脉。'
}

const locationSteps = computed(() => {
  return locationStepsData[props.pointName] || ['请参考针灸学教材中的定位方法']
})

const quickMethod = computed(() => {
  return quickMethodData[props.pointName] || ''
})

const landmarks = computed(() => {
  return landmarksData[props.pointName] || ['请参考针灸学教材']
})

const anatomyDescription = computed(() => {
  return anatomyData[props.pointName] || props.position
})

// 预览图片
function previewImage() {
  uni.previewImage({
    urls: [referenceImage.value],
    current: referenceImage.value
  })
}
</script>

<style lang="scss" scoped>
.locator-container {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.locator-header {
  margin-bottom: 20rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.locator-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #8B0000;
}

.reference-section {
  margin-bottom: 24rpx;
  text-align: center;
}

.ref-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.reference-image {
  width: 100%;
  height: 300rpx;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
}

.ref-hint {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.location-steps {
  margin-bottom: 24rpx;
}

.steps-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.step-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.step-number {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #8B0000;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 26rpx;
  color: #444;
  line-height: 1.6;
}

.quick-method {
  background: linear-gradient(135deg, #fff9f0, #fff5e6);
  border-radius: 8rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
  border-left: 4rpx solid #B8860B;
}

.quick-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #B8860B;
  margin-bottom: 8rpx;
  display: block;
}

.quick-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.landmarks {
  margin-bottom: 24rpx;
}

.landmarks-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.landmark-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.landmark-item {
  display: flex;
  align-items: center;
}

.landmark-dot {
  color: #9370DB;
  margin-right: 8rpx;
}

.landmark-text {
  font-size: 24rpx;
  color: #666;
}

.anatomy-section {
  background: #f8f8f8;
  border-radius: 8rpx;
  padding: 16rpx;
}

.anatomy-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.anatomy-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
}
</style>
