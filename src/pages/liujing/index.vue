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
        { name: '葛根汤', usage: '太阳病项背强几几', composition: '葛根、麻黄、桂枝、芍药、甘草、生姜、大枣' },
        { name: '大青龙汤', usage: '太阳伤寒兼里热，身烦疼', composition: '麻黄、桂枝、杏仁、甘草、生姜、大枣、石膏' },
        { name: '桂枝加厚朴杏子汤', usage: '太阳中风兼喘', composition: '桂枝、芍药、甘草、生姜、大枣、厚朴、杏仁' },
        { name: '桂枝加葛根汤', usage: '太阳病项背强，下利', composition: '桂枝、芍药、甘草、生姜、大枣、葛根' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第1条', text: '太阳之为病，脉浮，头项强痛而恶寒。' },
        { title: '《伤寒论》第12条', text: '太阳中风，阳浮而阴弱，阳浮者热自发，阴弱者汗自出，啬啬恶寒，淅淅恶风，翕翕发热，鼻鸣干呕者，桂枝汤主之。' },
        { title: '《伤寒论》第35条', text: '太阳病，头痛发热，身疼腰痛，骨节疼痛，恶风无汗而喘者，麻黄汤主之。' },
        { title: '《伤寒论》第46条', text: '太阳病，脉浮紧，无汗，发热，身疼痛，八九日不解，表证仍在者，麻黄汤主之。' },
        { title: '《金匮要略》', text: '太阳之为病，外邪袭表，营卫不和，气血郁滞，头项强痛。' }
      ],
      acupoints: [
        { name: '风池', meridian: '足少阳胆经', indication: '头痛、颈项强痛、感冒发热' },
        { name: '大椎', meridian: '督脉', indication: '发热恶寒、骨节疼痛、疟疾' },
        { name: '合谷', meridian: '手阳明大肠经', indication: '头痛、发热、无汗、面肿' },
        { name: '外关', meridian: '手少阳三焦经', indication: '寒热往来、胁痛、目赤' },
        { name: '后溪', meridian: '手太阳小肠经', indication: '头项强痛、身热、腰背痛' },
        { name: '曲池', meridian: '手阳明大肠经', indication: '发热、恶风、汗出、上肢不遂' },
        { name: '列缺', meridian: '手太阴肺经', indication: '头痛、项强、咳嗽' },
        { name: '肩井', meridian: '足少阳胆经', indication: '颈项强痛、肩背酸痛' }
      ],
      massage: [
        { technique: '按揉', position: '风池穴（枕骨下两侧凹陷处）', duration: '每侧2分钟', caution: '孕妇慎用' },
        { technique: '刮痧', position: '大椎穴至第七颈椎区域', duration: '3-5分钟', caution: '皮肤破损或过敏者禁用' },
        { technique: '推按', position: '太阳穴（眉梢与目外眦之间凹陷）', duration: '每侧3分钟', caution: '力度适中，以酸胀为度' },
        { technique: '擦法', position: '背部膀胱经（脊柱两侧）', duration: '5分钟', caution: '以皮肤发热、出痧为度' },
        { technique: '点按', position: '后溪穴（小指本节前尺侧）', duration: '每侧1分钟', caution: '无' }
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
        { name: '调胃承气汤', usage: '阳明燥热内结，腹满不甚', composition: '大黄、芒硝、甘草' },
        { name: '小承气汤', usage: '阳明腑实轻证，痞满而不燥', composition: '大黄、枳实、厚朴' },
        { name: '白虎加人参汤', usage: '阳明热盛，气津两伤', composition: '石膏、知母、甘草、粳米、人参' },
        { name: '麻杏石甘汤', usage: '阳明邪热壅肺，喘而汗出', composition: '麻黄、杏仁、石膏、甘草' },
        { name: '葛根芩连汤', usage: '阳明协热下利', composition: '葛根、黄芩、黄连、甘草' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第180条', text: '阳明之为病，胃家实是也。' },
        { title: '《伤寒论》第200条', text: '伤寒若吐若下若发汗后，微烦，小便不利，大便微硬者，此时小便必利，当亡其津液，亡津液故大便硬，大便因发而小便利，此名曰阳明病。' },
        { title: '《伤寒论》第26条', text: '服桂枝汤，大汗出后，大烦渴不解，脉洪大者，白虎加人参汤主之。' },
        { title: '《伤寒论》第219条', text: '伤寒一二日至四五日，太阳证犹在而复下之，若微烦者，此下早故也，下早故病情如疟者，此欲自外解也。' },
        { title: '《金匮要略》', text: '阳明病，口燥渴，足跗上微热，小便不利者，宜桂枝加附子汤主之。' }
      ],
      acupoints: [
        { name: '合谷', meridian: '手阳明大肠经', indication: '壮热、头痛、牙痛、面肿' },
        { name: '曲池', meridian: '手阳明大肠经', indication: '高热、汗出、手臂疼痛' },
        { name: '内庭', meridian: '足阳明胃经', indication: '身热、牙痛、口臭、便秘' },
        { name: '厉兑', meridian: '足阳明胃经', indication: '发热、神昏、足痛' },
        { name: '足三里', meridian: '足阳明胃经', indication: '腹胀、便秘、腹痛、呕吐' },
        { name: '天枢', meridian: '足阳明胃经', indication: '腹满、便秘、腹泻、肠鸣' },
        { name: '中脘', meridian: '任脉', indication: '胃脘痛、腹胀、呕吐、纳差' },
        { name: '大椎', meridian: '督脉', indication: '高热、骨节疼痛、恶寒' }
      ],
      massage: [
        { technique: '点按', position: '合谷穴（虎口处，第一二掌骨间）', duration: '每侧2分钟', caution: '孕妇禁用' },
        { technique: '按揉', position: '足三里穴（外膝眼下三寸）', duration: '每侧3分钟', caution: '无' },
        { technique: '拨筋', position: '面部（地仓、颊车、迎香）', duration: '3-5分钟', caution: '力度由轻到重' },
        { technique: '摩法', position: '腹部（以肚脐为中心顺时针）', duration: '5分钟', caution: '饭后1小时进行' },
        { technique: '点按', position: '内庭穴（第二三趾间）', duration: '每侧1分钟', caution: '无' }
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
        { name: '柴胡桂枝汤', usage: '少阳兼太阳表证', composition: '柴胡、桂枝、黄芩、人参、半夏、芍药、甘草、生姜、大枣' },
        { name: '柴胡加龙骨牡蛎汤', usage: '少阳兼三焦壅滞，胸满烦惊', composition: '柴胡、龙骨、黄芩、人参、半夏、桂枝、茯苓、大黄、铅丹、牡蛎、生姜、大枣' },
        { name: '柴胡加芒硝汤', usage: '少阳兼阳明里实，少下之', composition: '小柴胡汤去甘草，加芒硝' },
        { name: '柴胡桂枝干姜汤', usage: '少阳兼太阴水饮，渴而下利', composition: '柴胡、桂枝、干姜、黄芩、天花粉、牡蛎、甘草' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第263条', text: '少阳之为病，口苦，咽干，目眩也。' },
        { title: '《伤寒论》第96条', text: '伤寒五六日中风，往来寒热，胸胁苦满，嘿嘿不欲饮食，心烦喜呕，或胸中烦而不呕，或渴，或腹中痛，或胁下痞硬，或心下悸，或小便利，或头昏，或不渴，身体有微热，或咳者，小柴胡汤主之。' },
        { title: '《伤寒论》第100条', text: '血弱气尽，腠理开，邪气因入，与正气相搏，结于胁下。正邪纷争，往来寒热，休作有时，嘿嘿不欲饮食。' },
        { title: '《伤寒论》第103条', text: '太阳病，得之八九日，如疟状，发热，恶寒，热多寒少，头痛，项强，胁痛，目眩，脉微细者，与以小柴胡汤。' },
        { title: '《金匮要略》', text: '少阳之为病，枢机不利，气机升降失常，正邪分争于半表半里之间。' }
      ],
      acupoints: [
        { name: '外关', meridian: '手少阳三焦经', indication: '寒热往来、胁痛、耳鸣、头痛' },
        { name: '环跳', meridian: '足少阳胆经', indication: '腰腿痛、下肢痿痹、坐骨神经痛' },
        { name: '风池', meridian: '足少阳胆经', indication: '头痛、眩晕、口苦、咽干' },
        { name: '支沟', meridian: '手少阳三焦经', indication: '便秘、胁痛、耳鸣、耳聋' },
        { name: '阳陵泉', meridian: '足少阳胆经', indication: '胁痛、口苦、下肢痿痹、筋痛' },
        { name: '胆俞', meridian: '足太阳膀胱经', indication: '胁痛、呕吐、口苦、黄疸' },
        { name: '手三里', meridian: '手阳明大肠经', indication: '胁痛、上肢酸痛、腹痛' },
        { name: '期门', meridian: '足厥阴肝经', indication: '胸胁胀痛、胁痛、腹胀' }
      ],
      massage: [
        { technique: '按揉', position: '阳陵泉穴（腓骨小头前下方凹陷）', duration: '每侧2分钟', caution: '无' },
        { technique: '拨法', position: '胁肋部（腋下至季肋缘）', duration: '每侧3分钟', caution: '力度适中，以酸胀为度' },
        { technique: '按揉', position: '耳后（翳风穴区域）', duration: '每侧2分钟', caution: '力度轻柔' },
        { technique: '弹拨', position: '期门穴（乳头直下第六肋间隙）', duration: '每侧2分钟', caution: '孕妇慎用' },
        { technique: '点按', position: '外关穴（腕背横纹上2寸）', duration: '每侧1分钟', caution: '无' }
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
        { name: '理中丸', usage: '太阴脾虚，呕吐下利', composition: '人参、干姜、白术、甘草' },
        { name: '小建中汤', usage: '太阴里虚，腹中急痛', composition: '桂枝、芍药、甘草、生姜、大枣、饴糖' },
        { name: '黄芪建中汤', usage: '虚劳里急，诸不足', composition: '桂枝、芍药、甘草、生姜、大枣、饴糖、黄芪' },
        { name: '桂枝人参汤', usage: '太阴下利，脾阳不足', composition: '桂枝、人参、白术、甘草、干姜' },
        { name: '真武汤', usage: '太阴少阴合病，阳虚水泛', composition: '附子、茯苓、白术、芍药、生姜' },
        { name: '吴茱萸汤', usage: '太阴肝寒上逆，干呕吐涎沫', composition: '吴茱萸、人参、生姜、大枣' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第273条', text: '太阴之为病，腹满而吐，食不下，自利益甚，时腹自痛。若下之，必胸下结硬。' },
        { title: '《伤寒论》第274条', text: '太阴中兼阳明，理中汤主之。' },
        { title: '《伤寒论》第277条', text: '自吐利，腹满而喘，发热，手足不温者，可温之。' },
        { title: '《伤寒论》第386条', text: '霍乱，头痛发热，身疼，热多欲饮水者，五苓散主之；寒多不用水者，理中丸主之。' },
        { title: '《金匮要略》', text: '夫中焦受气取汁，变化而赤，是谓血。太阴病，脾阳虚衰，寒湿内生，运化失司。' }
      ],
      acupoints: [
        { name: '足三里', meridian: '足阳明胃经', indication: '腹痛、呕吐、下利、腹胀' },
        { name: '中脘', meridian: '任脉', indication: '腹满、呕吐、食不下、胃脘痛' },
        { name: '脾俞', meridian: '足太阳膀胱经', indication: '腹胀、下利、水肿、体倦' },
        { name: '太白', meridian: '足太阴脾经', indication: '腹痛、下利、腹胀、不食' },
        { name: '公孙', meridian: '足太阴脾经', indication: '腹满、呕吐、下利、胸胁痛' },
        { name: '三阴交', meridian: '足太阴脾经', indication: '腹痛、下利、腹胀、小便不利' },
        { name: '关元', meridian: '任脉', indication: '下利清谷、腹痛、脐下冷痛' },
        { name: '天枢', meridian: '足阳明胃经', indication: '腹满、下利、腹痛、肠鸣' }
      ],
      massage: [
        { technique: '摩法', position: '中脘穴（脐上4寸）及腹部', duration: '5分钟', caution: '饭后1小时进行' },
        { technique: '按揉', position: '脾俞穴（第十一胸椎旁开1.5寸）', duration: '每侧2分钟', caution: '无' },
        { technique: '点按', position: '足三里穴（外膝眼下3寸）', duration: '每侧2分钟', caution: '无' },
        { technique: '摩法', position: '腹部顺时针（以肚脐为中心）', duration: '5分钟', caution: '力度轻柔，以温热为度' },
        { technique: '温灸', position: '关元穴（脐下3寸）', duration: '10-15分钟', caution: '皮肤破损处禁用' }
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
        { name: '黄连阿胶汤', usage: '少阴病阴虚火旺，心中烦不得卧', composition: '黄连、黄芩、芍药、阿胶、鸡子黄' },
        { name: '通脉四逆汤', usage: '少阴病，里寒外热，汗出而厥', composition: '附子、干姜、甘草' },
        { name: '麻黄附子细辛汤', usage: '少阴病兼表证，发热恶寒', composition: '麻黄、附子、细辛' },
        { name: '白通汤', usage: '少阴病下利，厥逆无脉', composition: '葱白、干姜、附子' },
        { name: '四逆加人参汤', usage: '少阴病阳虚欲脱，汗出', composition: '附子、干姜、甘草、人参' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第281条', text: '少阴之为病，脉微细，但欲寐也。' },
        { title: '《伤寒论》第302条', text: '少阴病，得之二三日以上，心中烦，不得卧，黄连阿胶汤主之。' },
        { title: '《伤寒论》第319条', text: '少阴病，下利，白通加猪胆汁汤主之。' },
        { title: '《伤寒论》第351条', text: '少阴病，二三日不已，至四五日，腹痛，小便不利，四肢沉重疼痛，自下利者，此为有水气。其人或咳，或小便利，或下利，或呕者，真武汤主之。' },
        { title: '《金匮要略》', text: '少阴之为病，心肾阳虚，阴寒内盛，气化失常，水液代谢失调。' }
      ],
      acupoints: [
        { name: '神门', meridian: '手少阴心经', indication: '心悸、失眠、心烦、健忘' },
        { name: '内关', meridian: '手厥阴心包经', indication: '心悸、胸闷、恶心、失眠' },
        { name: '肾俞', meridian: '足太阳膀胱经', indication: '腰膝酸软、耳鸣、遗精、水肿' },
        { name: '太溪', meridian: '足少阴肾经', indication: '畏寒、腰膝酸软、心悸、失眠' },
        { name: '涌泉', meridian: '足少阴肾经', indication: '引火下行、头痛、失眠、足冷' },
        { name: '心俞', meridian: '足太阳膀胱经', indication: '心悸、胸闷、心痛、失眠' },
        { name: '厥阴俞', meridian: '足太阳膀胱经', indication: '心痛、心悸、胸闷、胁痛' },
        { name: '关元', meridian: '任脉', indication: '畏寒、下利、阳虚欲脱' }
      ],
      massage: [
        { technique: '摩法', position: '涌泉穴（足底前1/3凹陷处）', duration: '每侧5分钟', caution: '力度由轻到重' },
        { technique: '按揉', position: '内关穴（腕横纹上2寸，两筋之间）', duration: '每侧2分钟', caution: '无' },
        { technique: '擦法', position: '肾俞穴（第二腰椎旁开1.5寸）', duration: '每侧3分钟', caution: '以皮肤发热为度' },
        { technique: '摩法', position: '涌泉穴引火下行（从足底向涌泉方向）', duration: '每侧10分钟', caution: '力度均匀' },
        { technique: '温灸', position: '关元穴（脐下3寸）', duration: '15分钟', caution: '孕妇禁用' }
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
        { name: '干姜黄芩黄连人参汤', usage: '寒热格拒，上热下寒', composition: '干姜、黄芩、黄连、人参' },
        { name: '吴茱萸汤', usage: '厥阴肝寒上逆，干呕吐涎沫', composition: '吴茱萸、人参、生姜、大枣' },
        { name: '麻黄升麻汤', usage: '厥阴阴阳错杂，发热下利', composition: '麻黄、升麻、当归、知母、芍药、黄芩、干姜、栝蒌根、桂枝、甘草、竹叶、梗米' },
        { name: '栀子生姜豉汤', usage: '厥阴热扰胸膈，心中懊憹', composition: '栀子、生姜、香豉' }
      ],
      classicalQuotes: [
        { title: '《伤寒论》第326条', text: '厥阴之为病，消渴，气上撞心，心中疼热，饥而不欲食，食则吐蚘，下之利不止。' },
        { title: '《伤寒论》第338条', text: '伤寒脉细而厥，至七八日微烦，手足不温者，此为厥阴病，设当温其上，厥自知其。' },
        { title: '《伤寒论》第331条', text: '少阴病，四肢厥，悸咳，小便不利者，四逆加人参汤主之。' },
        { title: '《伤寒论》第370条', text: '下利清谷，里寒外热，汗出而厥者，通脉四逆汤主之。' },
        { title: '《金匮要略》', text: '厥阴之为病，寒热错杂，阴阳气不相顺接，气机紊乱，病情复杂多变。' }
      ],
      acupoints: [
        { name: '太冲', meridian: '足厥阴肝经', indication: '头痛、眩晕、胁痛、情绪不舒' },
        { name: '期门', meridian: '足厥阴肝经', indication: '胸胁胀痛、胁痛、腹胀' },
        { name: '行间', meridian: '足厥阴肝经', indication: '头痛、头晕、胁痛、口苦' },
        { name: '中冲', meridian: '手厥阴心包经', indication: '昏厥、中暑、头痛、目赤' },
        { name: '百会', meridian: '督脉', indication: '头痛、眩晕、心悸、失眠' },
        { name: '厥阴俞', meridian: '足太阳膀胱经', indication: '心痛、心悸、胸闷、胁痛' },
        { name: '蠡沟', meridian: '足厥阴肝经', indication: '胁痛、疝气、月经不调' },
        { name: '太溪', meridian: '足少阴肾经', indication: '消渴、心中疼热、下利' }
      ],
      massage: [
        { technique: '按揉', position: '太冲穴（足背第一二跖骨间）', duration: '每侧2分钟', caution: '无' },
        { technique: '点按', position: '行间穴（第一二趾间）', duration: '每侧1分钟', caution: '无' },
        { technique: '摩法', position: '百会穴（头顶正中）', duration: '3分钟', caution: '力度轻柔' },
        { technique: '点按', position: '膻中穴（两乳之间）', duration: '1分钟', caution: '无' },
        { technique: '按揉', position: '涌泉穴（足底前1/3凹陷）', duration: '每侧3分钟', caution: '无' }
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
