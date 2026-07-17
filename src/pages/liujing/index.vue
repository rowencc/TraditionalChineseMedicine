<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '识六经 - 伤寒论六经辨证', path: '/pages/liujing/index' }
  },
  onShareTimeline() {
    return { title: '识六经 - 伤寒论六经辨证' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 标题 -->
    <view class="header">
      <text class="title">识六经</text>
      <text class="subtitle">伤寒论六经辨证体系</text>
    </view>

    <!-- 六经概览 -->
    <view class="section">
      <text class="section-title">六经辨证总论</text>
      <view class="intro-card">
        <text class="intro-text">六经辨证是《伤寒论》的核心辨证方法，将外感热病的发展过程归纳为太阳、阳明、少阳、太阴、少阴、厥阴六个阶段。每一经都有特定的病因、病机、证候和治法，是经方医学的理论基石。</text>
      </view>
    </view>

    <!-- 六经卡片 -->
    <view class="section">
      <text class="section-title">六经详解</text>
      <view class="meridian-list">
        <view 
          v-for="item in meridians" 
          :key="item.name"
          class="meridian-card"
          :class="'mc-' + item.cssClass"
          @tap="goToDetail(item)"
        >
          <view class="mc-header">
            <view class="mc-name-wrap">
              <text class="mc-name">{{ item.name }}经</text>
              <text class="mc-en">{{ item.enName }}</text>
            </view>
            <text class="mc-arrow">›</text>
          </view>
          <text class="mc-desc">{{ item.summary }}</text>
          <view class="mc-tags">
            <text v-for="tag in item.keySymptoms" :key="tag" class="mc-tag">{{ tag }}</text>
          </view>
          <view class="mc-formula">
            <text class="mc-formula-label">代表方剂：</text>
            <text class="mc-formula-text">{{ item.mainFormulas.join('、') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 六经传变 -->
    <view class="section">
      <text class="section-title">六经传变规律</text>
      <view class="flow-card">
        <view class="flow-row">
          <view class="flow-item flow-sun">太阳<br><text class="flow-sub">表证初起</text></view>
          <text class="flow-arrow">→</text>
          <view class="flow-item flow-yangming">阳明<br><text class="flow-sub">里热亢盛</text></view>
        </view>
        <view class="flow-row">
          <view class="flow-item flow-shaoyang">少阳<br><text class="flow-sub">半表半里</text></view>
          <text class="flow-arrow">→</text>
          <view class="flow-item flow-taiyin">太阴<br><text class="flow-sub">脾虚寒湿</text></view>
        </view>
        <view class="flow-row">
          <view class="flow-item flow-shaoyin">少阴<br><text class="flow-sub">心肾阳虚</text></view>
          <text class="flow-arrow">→</text>
          <view class="flow-item flow-jueyin">厥阴<br><text class="flow-sub">寒热错杂</text></view>
        </view>
      </view>
      <view class="note-card">
        <text class="note-title">传变规律</text>
        <text class="note-text">三阳经为表、热、实证，三阴经为里、寒、虚证。病邪由表入里，由阳入阴，病情逐渐加重。经方治疗的核心在于截断传变，使疾病在浅表阶段即被治愈。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/utils/theme'

const { themeClass } = useTheme()

const meridians = [
  {
    name: '太阳',
    cssClass: 'sun',
    enName: 'Taiyang',
    summary: '太阳主一身之表，统摄营卫，为人体抗御外邪的第一道防线。外邪侵袭，太阳首当其冲。',
    keySymptoms: ['发热', '恶寒', '头痛', '项强', '脉浮'],
    mainFormulas: ['桂枝汤', '麻黄汤', '小青龙汤', '葛根汤'],
    detail: {
      position: '体表，统领营卫之气',
      organs: '膀胱、小肠',
      nature: '三阳之首，主表证',
      mainSymptoms: '发热恶寒、头痛项强、脉浮、鼻鸣干呕',
      treatment: '辛温解表，调和营卫',
      formulas: [
        { name: '桂枝汤', usage: '太阳中风，营卫不和', composition: '桂枝、芍药、甘草、生姜、大枣' },
        { name: '麻黄汤', usage: '太阳伤寒，表实无汗', composition: '麻黄、桂枝、杏仁、甘草' },
        { name: '小青龙汤', usage: '太阳伤寒兼水饮', composition: '麻黄、桂枝、芍药、半夏、细辛、干姜、五味子、甘草' },
        { name: '葛根汤', usage: '太阳病项背强几几', composition: '葛根、麻黄、桂枝、芍药、甘草、生姜、大枣' }
      ],
      prevention: '注意保暖，避免受风。出现发热恶寒时及早治疗，防止病邪入里。'
    }
  },
  {
    name: '阳明',
    cssClass: 'yangming',
    enName: 'Yangming',
    summary: '阳明主里，为多气多血之经。邪入阳明，从燥化热，形成里热实证。',
    keySymptoms: ['壮热', '大汗', '大渴', '脉洪大', '便秘'],
    mainFormulas: ['白虎汤', '承气汤', '大承气汤', '调胃承气汤'],
    detail: {
      position: '里，胃肠之腑',
      organs: '胃、大肠',
      nature: '三阳之里，主里热实证',
      mainSymptoms: '身热汗出、口渴引饮、脉洪大、腹满便秘',
      treatment: '清热泻下，急下存阴',
      formulas: [
        { name: '白虎汤', usage: '阳明经热证（四大：大热、大汗、大渴、脉洪大）', composition: '石膏、知母、甘草、粳米' },
        { name: '大承气汤', usage: '阳明腑实证，燥屎内结', composition: '大黄、芒硝、枳实、厚朴' },
        { name: '调胃承气汤', usage: '阳明燥热内结，腹满不甚', composition: '大黄、芒硝、甘草' }
      ],
      prevention: '饮食清淡，忌辛辣油腻。保持大便通畅，避免积食化热。'
    }
  },
  {
    name: '少阳',
    cssClass: 'shaoyang',
    enName: 'Shaoyang',
    summary: '少阳主半表半里，为枢机之经。邪入少阳，正邪分争于半表半里之间。',
    keySymptoms: ['往来寒热', '胸胁苦满', '口苦', '咽干', '目眩'],
    mainFormulas: ['小柴胡汤', '大柴胡汤', '柴胡桂枝汤'],
    detail: {
      position: '半表半里，枢机之位',
      organs: '胆、三焦',
      nature: '三阳之枢，主半表半里证',
      mainSymptoms: '往来寒热、胸胁苦满、口苦咽干目眩、嘿嘿不欲饮食、心烦喜呕',
      treatment: '和解少阳，疏肝利胆',
      formulas: [
        { name: '小柴胡汤', usage: '少阳病主方，和解少阳', composition: '柴胡、黄芩、半夏、人参、甘草、生姜、大枣' },
        { name: '大柴胡汤', usage: '少阳阳明合病', composition: '柴胡、黄芩、半夏、枳实、芍药、大黄、生姜、大枣' },
        { name: '柴胡桂枝汤', usage: '少阳兼太阳表证', composition: '柴胡、桂枝、黄芩、人参、半夏、芍药、甘草、生姜、大枣' }
      ],
      prevention: '保持心情舒畅，避免情绪波动。少阳病多与情志相关。'
    }
  },
  {
    name: '太阴',
    cssClass: 'taiyin',
    enName: 'Taiyin',
    summary: '太阴主脾，为三阴之首。脾阳虚衰，寒湿内生，形成里虚寒证。',
    keySymptoms: ['腹痛', '呕吐', '下利', '不渴', '腹满'],
    mainFormulas: ['理中汤', '四逆汤', '小建中汤'],
    detail: {
      position: '里，脾土之脏',
      organs: '脾、肺',
      nature: '三阴之始，主里虚寒证',
      mainSymptoms: '腹满呕吐、食不下、下利清谷、口不渴、脉缓弱',
      treatment: '温中散寒，健脾燥湿',
      formulas: [
        { name: '理中汤', usage: '太阴虚寒，脾胃不和', composition: '人参、干姜、白术、甘草' },
        { name: '四逆汤', usage: '太阴病重证，阳虚欲脱', composition: '附子、干姜、甘草' },
        { name: '小建中汤', usage: '太阴里虚，腹中急痛', composition: '桂枝、芍药、甘草、生姜、大枣、饴糖' }
      ],
      prevention: '饮食宜温热，忌生冷寒凉。注意腹部保暖，避免过食肥甘。'
    }
  },
  {
    name: '少阴',
    cssClass: 'shaoyin',
    enName: 'Shaoyin',
    summary: '少阴主心肾，为水火之脏。心肾阳虚，阴寒内盛，病情危重。',
    keySymptoms: ['畏寒', '蜷卧', '四肢厥逆', '脉微细', '但欲寐'],
    mainFormulas: ['四逆汤', '真武汤', '附子汤', '黄连阿胶汤'],
    detail: {
      position: '里，心肾之脏',
      organs: '心、肾',
      nature: '三阴之重，主心肾阳虚证',
      mainSymptoms: '畏寒蜷卧、四肢厥冷、脉微细、但欲寐、下利清谷',
      treatment: '回阳救逆，温补心肾',
      formulas: [
        { name: '四逆汤', usage: '少阴病阳虚欲脱', composition: '附子、干姜、甘草' },
        { name: '真武汤', usage: '少阴阳虚水泛', composition: '附子、茯苓、白术、芍药、生姜' },
        { name: '附子汤', usage: '少阴阳虚身痛', composition: '附子、茯苓、人参、白术、芍药' },
        { name: '黄连阿胶汤', usage: '少阴病阴虚火旺，心中烦不得卧', composition: '黄连、黄芩、芍药、阿胶、鸡子黄' }
      ],
      prevention: '注意保暖，避免过劳。老年人尤需注意心肾功能保养。'
    }
  },
  {
    name: '厥阴',
    cssClass: 'jueyin',
    enName: 'Jueyin',
    summary: '厥阴主肝，为三阴之尽。寒热错杂，阴阳气不相顺接，病情复杂多变。',
    keySymptoms: ['消渴', '气上撞心', '心中疼热', '饥不欲食', '下利'],
    mainFormulas: ['乌梅丸', '当归四逆汤', '干姜黄芩黄连人参汤'],
    detail: {
      position: '里，肝木之脏',
      organs: '肝、心包',
      nature: '三阴之极，主寒热错杂证',
      mainSymptoms: '消渴气上撞心、心中疼热、饥不欲食、食则吐蛔、下利不止',
      treatment: '寒热并用，调和阴阳',
      formulas: [
        { name: '乌梅丸', usage: '厥阴病主方，寒热错杂', composition: '乌梅、细辛、干姜、黄连、当归、附子、蜀椒、桂枝、人参、黄柏' },
        { name: '当归四逆汤', usage: '厥阴血虚寒厥', composition: '当归、桂枝、芍药、细辛、甘草、通草、大枣' },
        { name: '干姜黄芩黄连人参汤', usage: '寒热格拒，上热下寒', composition: '干姜、黄芩、黄连、人参' }
      ],
      prevention: '饮食有节，调畅情志。厥阴病最为复杂，出现相关症状应及时就医。'
    }
  }
]

function goToDetail(item: any) {
  // 将六经数据暂存到 storage，详情页读取
  uni.setStorageSync('liujing_detail', JSON.stringify(item))
  uni.navigateTo({ url: '/pages/liujing/detail' })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 60rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 16rpx;
  position: relative;
  padding-left: 20rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #2D5F4A, #B8860B);
  border-radius: 3rpx;
}

.intro-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  border-left: 4rpx solid #2D5F4A;
}

.intro-text {
  font-size: 26rpx;
  color: #555;
  line-height: 1.8;
}

.meridian-list {
  display: grid;
  gap: 16rpx;
}

.meridian-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.meridian-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 8rpx;
  height: 100%;
}

.mc-sun::before { background: linear-gradient(180deg, #C0392B, #E74C3C); }
.mc-yangming::before { background: linear-gradient(180deg, #E67E22, #F39C12); }
.mc-shaoyang::before { background: linear-gradient(180deg, #F39C12, #F1C40F); }
.mc-taiyin::before { background: linear-gradient(180deg, #8B4513, #A0522D); }
.mc-shaoyin::before { background: linear-gradient(180deg, #2980B9, #3498DB); }
.mc-jueyin::before { background: linear-gradient(180deg, #8E44AD, #9B59B6); }

.mc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.mc-name-wrap {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.mc-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #2C2C2C;
}

.mc-en {
  font-size: 22rpx;
  color: #999;
}

.mc-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.mc-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
  margin-bottom: 16rpx;
}

.mc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.mc-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  background: rgba(45, 95, 74, 0.08);
  color: #2D5F4A;
  border-radius: 20rpx;
}

.mc-formula {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.mc-formula-label {
  font-size: 24rpx;
  color: #999;
}

.mc-formula-text {
  font-size: 24rpx;
  color: #8B2500;
  font-weight: 500;
}

.flow-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.flow-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.flow-item {
  width: 200rpx;
  text-align: center;
  padding: 20rpx 12rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.flow-sub {
  font-size: 20rpx;
  font-weight: 400;
  opacity: 0.8;
}

.flow-sun { background: linear-gradient(135deg, #C0392B, #E74C3C); }
.flow-yangming { background: linear-gradient(135deg, #E67E22, #F39C12); }
.flow-shaoyang { background: linear-gradient(135deg, #F39C12, #F1C40F); color: #333; }
.flow-taiyin { background: linear-gradient(135deg, #8B4513, #A0522D); }
.flow-shaoyin { background: linear-gradient(135deg, #2980B9, #3498DB); }
.flow-jueyin { background: linear-gradient(135deg, #8E44AD, #9B59B6); }

.flow-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.note-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  border-left: 4rpx solid #B8860B;
}

.note-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.note-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
</style>
