<template>
  <view class="diagram-wrapper">
    <!-- 手部穴位图 -->
    <view v-if="bodyPart === 'hand'" class="diagram">
      <svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
        <!-- 手掌轮廓 - 更真实的形状 -->
        <path d="M70 280 L70 120 Q50 100 45 80 L45 45 Q45 30 55 28 L65 28 Q75 30 75 45 L75 80
                 L90 25 Q95 15 105 15 L115 15 Q125 15 125 25 L120 80
                 L140 20 Q145 10 155 10 L165 10 Q175 10 175 20 L165 80
                 L185 25 Q190 15 200 18 L208 22 Q215 28 212 40 L195 80
                 L200 45 Q202 35 210 38 L215 42 Q220 48 215 60 L195 100
                 Q195 120 185 130 L180 140 Q175 150 170 180 L165 280 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 手掌纹路 -->
        <path d="M80 140 Q120 135 160 145" fill="none" stroke="#D2B48C" stroke-width="1" opacity="0.6"/>
        <path d="M85 160 Q120 155 155 162" fill="none" stroke="#D2B48C" stroke-width="1" opacity="0.6"/>
        <path d="M90 180 Q120 175 145 182" fill="none" stroke="#D2B48C" stroke-width="1" opacity="0.6"/>
        <!-- 拇指 -->
        <path d="M45 80 Q35 75 30 65 Q25 55 30 45 Q35 35 45 35 L55 28" fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 指甲 -->
        <path d="M35 38 Q40 32 48 35" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M60 22 Q68 18 72 25" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M98 12 Q105 8 110 15" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M148 8 Q155 4 160 12" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M195 20 Q200 15 205 22" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <!-- 解剖标记 -->
        <text x="25" y="25" font-size="10" fill="#666">拇指</text>
        <text x="65" y="8" font-size="10" fill="#666">食指</text>
        <text x="108" y="5" font-size="10" fill="#666">中指</text>
        <text x="150" y="5" font-size="10" fill="#666">无名指</text>
        <text x="200" y="12" font-size="10" fill="#666">小指</text>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 前臂穴位图 -->
    <view v-else-if="bodyPart === 'forearm'" class="diagram">
      <svg viewBox="0 0 200 350" xmlns="http://www.w3.org/2000/svg">
        <!-- 前臂轮廓 -->
        <path d="M50 320 Q45 300 48 260 Q50 220 55 180 Q60 140 65 100 Q70 60 80 40
                 L120 40 Q130 60 135 100 Q140 140 145 180 Q150 220 152 260 Q155 300 150 320 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 手腕线 -->
        <path d="M48 280 Q100 275 152 280" fill="none" stroke="#8B4513" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="160" y="285" font-size="10" fill="#666">腕横纹</text>
        <!-- 肘部标记 -->
        <ellipse cx="100" cy="45" rx="25" ry="10" fill="none" stroke="#8B4513" stroke-width="1"/>
        <text x="160" y="50" font-size="10" fill="#666">肘横纹</text>
        <!-- 桡骨标记 -->
        <line x1="65" y1="100" x2="65" y2="270" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.5"/>
        <text x="55" y="190" font-size="8" fill="#999" transform="rotate(-90, 55, 190)">桡骨</text>
        <!-- 尺骨标记 -->
        <line x1="135" y1="100" x2="135" y2="270" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.5"/>
        <text x="145" y="190" font-size="8" fill="#999" transform="rotate(90, 145, 190)">尺骨</text>
        <!-- 肌肉纹理 -->
        <path d="M70 120 Q100 115 130 120" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <path d="M68 160 Q100 155 132 160" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <path d="M65 200 Q100 195 135 200" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 腿部穴位图 -->
    <view v-else-if="bodyPart === 'leg'" class="diagram">
      <svg viewBox="0 0 180 400" xmlns="http://www.w3.org/2000/svg">
        <!-- 腿部轮廓 -->
        <path d="M45 380 Q40 350 42 300 Q45 250 50 200 Q55 150 60 120 Q65 90 70 70
                 L110 70 Q115 90 120 120 Q125 150 130 200 Q135 250 138 300 Q140 350 135 380 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 膝盖 -->
        <ellipse cx="90" cy="85" rx="30" ry="20" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M65 85 Q90 75 115 85" fill="none" stroke="#8B4513" stroke-width="1"/>
        <text x="140" y="90" font-size="10" fill="#666">膝盖</text>
        <!-- 髌骨 -->
        <ellipse cx="90" cy="80" rx="15" ry="12" fill="none" stroke="#8B4513" stroke-width="1" stroke-dasharray="3,2"/>
        <!-- 胫骨前缘 -->
        <line x1="75" y1="100" x2="75" y2="360" stroke="#8B4513" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>
        <text x="65" y="230" font-size="8" fill="#999" transform="rotate(-90, 65, 230)">胫骨前缘</text>
        <!-- 腓骨标记 -->
        <line x1="120" y1="100" x2="120" y2="350" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.4"/>
        <!-- 腓骨头 -->
        <ellipse cx="118" cy="115" rx="8" ry="6" fill="none" stroke="#8B4513" stroke-width="1"/>
        <text x="135" y="120" font-size="9" fill="#666">腓骨头</text>
        <!-- 内踝 -->
        <ellipse cx="60" cy="370" rx="10" ry="8" fill="none" stroke="#8B4513" stroke-width="1"/>
        <text x="35" y="385" font-size="9" fill="#666">内踝</text>
        <!-- 外踝 -->
        <ellipse cx="120" cy="365" rx="10" ry="8" fill="none" stroke="#8B4513" stroke-width="1"/>
        <text x="135" y="380" font-size="9" fill="#666">外踝</text>
        <!-- 肌肉纹理 -->
        <path d="M55 150 Q90 145 125 150" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <path d="M50 200 Q90 195 130 200" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <path d="M48 250 Q90 245 132 250" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 足部穴位图 -->
    <view v-else-if="bodyPart === 'foot'" class="diagram">
      <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
        <!-- 足部轮廓 -->
        <path d="M55 260 Q45 230 48 200 Q50 170 55 140 Q60 110 65 90 Q70 70 80 55
                 L120 55 Q130 70 135 90 Q140 110 145 140 Q150 170 152 200 Q155 230 145 260 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 脚趾 -->
        <ellipse cx="65" cy="42" rx="10" ry="14" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <ellipse cx="82" cy="35" rx="10" ry="16" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <ellipse cx="100" cy="32" rx="10" ry="16" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <ellipse cx="118" cy="35" rx="10" ry="14" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <ellipse cx="135" cy="42" rx="8" ry="12" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <!-- 脚趾甲 -->
        <path d="M58 32 Q65 25 72 32" fill="none" stroke="#8B4513" stroke-width="1"/>
        <path d="M75 25 Q82 18 89 25" fill="none" stroke="#8B4513" stroke-width="1"/>
        <path d="M93 22 Q100 15 107 22" fill="none" stroke="#8B4513" stroke-width="1"/>
        <path d="M111 25 Q118 18 125 25" fill="none" stroke="#8B4513" stroke-width="1"/>
        <path d="M130 32 Q135 25 140 32" fill="none" stroke="#8B4513" stroke-width="1"/>
        <!-- 内踝 -->
        <ellipse cx="62" cy="215" rx="14" ry="10" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <text x="30" y="220" font-size="10" fill="#666">内踝</text>
        <!-- 外踝 -->
        <ellipse cx="140" cy="210" rx="12" ry="9" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <text x="155" y="215" font-size="10" fill="#666">外踝</text>
        <!-- 足弓 -->
        <path d="M60 180 Q90 170 120 180" fill="none" stroke="#8B4513" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="85" y="195" font-size="9" fill="#666">足弓</text>
        <!-- 第一跖骨 -->
        <line x1="70" y1="60" x2="65" y2="170" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.5"/>
        <!-- 第二跖骨 -->
        <line x1="88" y1="50" x2="85" y2="160" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.5"/>
        <!-- 第三跖骨 -->
        <line x1="105" y1="48" x2="102" y2="155" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.5"/>
        <!-- 足背动脉 -->
        <path d="M85 100 Q88 130 90 160" fill="none" stroke="#CC3333" stroke-width="1" opacity="0.5"/>
        <text x="95" y="140" font-size="8" fill="#CC3333" opacity="0.7">足背动脉</text>
        <!-- 肌腱纹理 -->
        <path d="M68 80 Q85 75 102 80" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <path d="M65 120 Q90 115 115 120" fill="none" stroke="#D2B48C" stroke-width="0.8" opacity="0.4"/>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 头部穴位图 -->
    <view v-else-if="bodyPart === 'head'" class="diagram">
      <svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg">
        <!-- 头部轮廓 -->
        <ellipse cx="110" cy="120" rx="85" ry="95" fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 头发轮廓 -->
        <path d="M30 100 Q30 40 110 25 Q190 40 190 100" fill="none" stroke="#8B4513" stroke-width="1.5" stroke-dasharray="4,3"/>
        <!-- 眉毛 -->
        <path d="M60 90 Q75 82 90 88" fill="none" stroke="#8B4513" stroke-width="2"/>
        <path d="M130 88 Q145 82 160 90" fill="none" stroke="#8B4513" stroke-width="2"/>
        <!-- 眼睛 -->
        <ellipse cx="75" cy="100" rx="14" ry="8" fill="white" stroke="#8B4513" stroke-width="1.5"/>
        <ellipse cx="145" cy="100" rx="14" ry="8" fill="white" stroke="#8B4513" stroke-width="1.5"/>
        <circle cx="75" cy="100" r="5" fill="#4A3728"/>
        <circle cx="145" cy="100" r="5" fill="#4A3728"/>
        <circle cx="77" cy="98" r="2" fill="white" opacity="0.8"/>
        <circle cx="147" cy="98" r="2" fill="white" opacity="0.8"/>
        <!-- 鼻子 -->
        <path d="M110 100 L110 135 L100 145 Q110 150 120 145 L110 135" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <!-- 嘴巴 -->
        <path d="M92 165 Q110 180 128 165" fill="none" stroke="#CC6666" stroke-width="2"/>
        <path d="M95 165 Q110 170 125 165" fill="none" stroke="#CC6666" stroke-width="1"/>
        <!-- 耳朵 -->
        <path d="M25 95 Q18 110 20 135 Q22 155 30 160 Q35 155 35 140 Q35 120 30 105" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <path d="M195 95 Q202 110 200 135 Q198 155 190 160 Q185 155 185 140 Q185 120 190 105" fill="#F5DEB3" stroke="#8B4513" stroke-width="1.5"/>
        <!-- 头部解剖标记 -->
        <text x="110" y="20" text-anchor="middle" font-size="10" fill="#666">百会</text>
        <line x1="110" y1="23" x2="110" y2="35" stroke="#666" stroke-width="0.5"/>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 腰背部穴位图 -->
    <view v-else-if="bodyPart === 'back'" class="diagram">
      <svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg">
        <!-- 背部轮廓 -->
        <path d="M30 300 Q25 260 28 220 Q30 180 35 140 Q40 100 50 70 Q60 45 80 35
                 L120 35 Q140 45 150 70 Q160 100 165 140 Q170 180 172 220 Q175 260 170 300 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 脊柱 -->
        <line x1="100" y1="40" x2="100" y2="290" stroke="#8B4513" stroke-width="2"/>
        <!-- 椎骨标记 -->
        <text x="105" y="55" font-size="9" fill="#666">C7（大椎）</text>
        <circle cx="100" cy="52" r="4" fill="#8B4513" opacity="0.5"/>
        <text x="105" y="80" font-size="9" fill="#666">T1</text>
        <circle cx="100" cy="77" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="100" font-size="9" fill="#666">T3（肺俞）</text>
        <circle cx="100" cy="97" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="120" font-size="9" fill="#666">T5（心俞）</text>
        <circle cx="100" cy="117" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="155" font-size="9" fill="#666">T9（肝俞）</text>
        <circle cx="100" cy="152" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="180" font-size="9" fill="#666">T11（脾俞）</text>
        <circle cx="100" cy="177" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="210" font-size="9" fill="#666">L2（肾俞）</text>
        <circle cx="100" cy="207" r="3" fill="#8B4513" opacity="0.4"/>
        <text x="105" y="250" font-size="9" fill="#666">L4（腰阳关）</text>
        <circle cx="100" cy="247" r="3" fill="#8B4513" opacity="0.4"/>
        <!-- 肩胛骨 -->
        <path d="M45 60 Q55 80 50 120 Q45 150 55 160" fill="none" stroke="#8B4513" stroke-width="1.5" stroke-dasharray="4,3"/>
        <path d="M155 60 Q145 80 150 120 Q155 150 145 160" fill="none" stroke="#8B4513" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="35" y="110" font-size="9" fill="#666">肩胛骨</text>
        <!-- 肋骨 -->
        <path d="M55 90 Q100 85 145 90" fill="none" stroke="#8B4513" stroke-width="0.8" opacity="0.4"/>
        <path d="M50 115 Q100 110 150 115" fill="none" stroke="#8B4513" stroke-width="0.8" opacity="0.4"/>
        <path d="M48 140 Q100 135 152 140" fill="none" stroke="#8B4513" stroke-width="0.8" opacity="0.4"/>
        <path d="M45 165 Q100 160 155 165" fill="none" stroke="#8B4513" stroke-width="0.8" opacity="0.4"/>
        <!-- 背部肌肉 -->
        <path d="M55 70 Q70 90 65 130" fill="none" stroke="#D2B48C" stroke-width="1" opacity="0.4"/>
        <path d="M145 70 Q130 90 135 130" fill="none" stroke="#D2B48C" stroke-width="1" opacity="0.4"/>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 胸腹部穴位图 -->
    <view v-else-if="bodyPart === 'front'" class="diagram">
      <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <!-- 躯干轮廓 -->
        <path d="M30 280 Q25 240 28 200 Q30 160 35 120 Q40 80 50 55 Q60 35 80 25
                 L120 25 Q140 35 150 55 Q160 80 165 120 Q170 160 172 200 Q175 240 170 280 Z"
              fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <!-- 正中线 -->
        <line x1="100" y1="30" x2="100" y2="270" stroke="#8B4513" stroke-width="1" stroke-dasharray="4,3"/>
        <!-- 肚脐 -->
        <ellipse cx="100" cy="195" rx="8" ry="10" fill="none" stroke="#8B4513" stroke-width="2"/>
        <text x="115" y="200" font-size="10" fill="#666">脐（神阙）</text>
        <!-- 胸骨 -->
        <path d="M90 55 L90 140 Q100 145 110 140 L110 55" fill="none" stroke="#8B4513" stroke-width="1.5"/>
        <text x="115" y="100" font-size="9" fill="#666">胸骨</text>
        <!-- 肋弓 -->
        <path d="M55 100 Q75 130 100 140" fill="none" stroke="#8B4513" stroke-width="1" opacity="0.6"/>
        <path d="M145 100 Q125 130 100 140" fill="none" stroke="#8B4513" stroke-width="1" opacity="0.6"/>
        <!-- 乳头 -->
        <circle cx="65" cy="85" r="5" fill="none" stroke="#8B4513" stroke-width="1"/>
        <circle cx="135" cy="85" r="5" fill="none" stroke="#8B4513" stroke-width="1"/>
        <!-- 腹部分区 -->
        <line x1="30" y1="170" x2="170" y2="170" stroke="#8B4513" stroke-width="0.5" stroke-dasharray="2,4" opacity="0.4"/>
        <text x="35" y="175" font-size="8" fill="#999">肋弓下缘</text>
        <!-- 腹直肌 -->
        <path d="M85 140 L85 250" fill="none" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.4"/>
        <path d="M115 140 L115 250" fill="none" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.4"/>
        <!-- 腹部标志线 -->
        <line x1="100" y1="155" x2="100" y2="165" stroke="#8B4513" stroke-width="1" opacity="0.5"/>
        <text x="110" y="162" font-size="8" fill="#999">脐上1寸</text>
        <line x1="100" y1="210" x2="100" y2="220" stroke="#8B4513" stroke-width="1" opacity="0.5"/>
        <text x="110" y="217" font-size="8" fill="#999">脐下1.5寸（气海）</text>
        <line x1="100" y1="235" x2="100" y2="245" stroke="#8B4513" stroke-width="1" opacity="0.5"/>
        <text x="110" y="242" font-size="8" fill="#999">脐下3寸（关元）</text>
        <!-- 穴位标记 -->
        <circle :cx="pointPos.x" :cy="pointPos.y" r="9" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text :x="pointPos.x" :y="pointPos.y - 15" text-anchor="middle" font-size="13" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <!-- 默认图 -->
    <view v-else class="diagram">
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="60" fill="#F5DEB3" stroke="#8B4513" stroke-width="2"/>
        <circle cx="80" cy="80" r="8" fill="#FF0000" opacity="0.9" stroke="#fff" stroke-width="2"/>
        <text x="80" y="110" text-anchor="middle" font-size="14" fill="#8B0000" font-weight="bold">{{ pointName }}</text>
      </svg>
    </view>

    <text class="diagram-hint">穴位位置仅供参考，具体定位请参考专业针灸学教材</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  pointName: string
  meridianName: string
}>()

// 各穴位的精确坐标位置
const pointPositions: Record<string, {x: number, y: number, body: string}> = {
  // 手部穴位
  '少商': {x: 35, y: 38, body: 'hand'},
  '商阳': {x: 60, y: 22, body: 'hand'},
  '中冲': {x: 105, y: 12, body: 'hand'},
  '关冲': {x: 155, y: 10, body: 'hand'},
  '少冲': {x: 200, y: 18, body: 'hand'},
  '少泽': {x: 200, y: 18, body: 'hand'},
  '鱼际': {x: 55, y: 145, body: 'hand'},
  '劳宫': {x: 100, y: 145, body: 'hand'},
  '少府': {x: 125, y: 140, body: 'hand'},
  '液门': {x: 160, y: 65, body: 'hand'},
  '中渚': {x: 175, y: 85, body: 'hand'},
  '合谷': {x: 65, y: 110, body: 'hand'},

  // 前臂穴位
  '内关': {x: 85, y: 220, body: 'forearm'},
  '外关': {x: 115, y: 220, body: 'forearm'},
  '列缺': {x: 70, y: 245, body: 'forearm'},
  '支沟': {x: 115, y: 185, body: 'forearm'},
  '郄门': {x: 85, y: 175, body: 'forearm'},
  '间使': {x: 85, y: 195, body: 'forearm'},
  '神门': {x: 70, y: 265, body: 'forearm'},
  '阳溪': {x: 100, y: 255, body: 'forearm'},
  '偏历': {x: 90, y: 235, body: 'forearm'},
  '温溜': {x: 90, y: 205, body: 'forearm'},
  '尺泽': {x: 80, y: 70, body: 'forearm'},
  '曲池': {x: 125, y: 55, body: 'forearm'},
  '手三里': {x: 115, y: 85, body: 'forearm'},

  // 腿部穴位
  '足三里': {x: 70, y: 155, body: 'leg'},
  '阳陵泉': {x: 110, y: 125, body: 'leg'},
  '阴陵泉': {x: 55, y: 130, body: 'leg'},
  '三阴交': {x: 55, y: 310, body: 'leg'},
  '地机': {x: 55, y: 270, body: 'leg'},
  '漏谷': {x: 55, y: 240, body: 'leg'},
  '承山': {x: 90, y: 290, body: 'leg'},
  '委中': {x: 90, y: 90, body: 'leg'},
  '飞扬': {x: 115, y: 275, body: 'leg'},
  '承筋': {x: 90, y: 230, body: 'leg'},
  '上巨虚': {x: 70, y: 195, body: 'leg'},
  '下巨虚': {x: 70, y: 230, body: 'leg'},

  // 足部穴位
  '太冲': {x: 95, y: 90, body: 'foot'},
  '行间': {x: 78, y: 60, body: 'foot'},
  '大敦': {x: 65, y: 40, body: 'foot'},
  '太溪': {x: 65, y: 210, body: 'foot'},
  '然谷': {x: 75, y: 195, body: 'foot'},
  '涌泉': {x: 95, y: 120, body: 'foot'},
  '昆仑': {x: 130, y: 205, body: 'foot'},
  '申脉': {x: 125, y: 190, body: 'foot'},
  '照海': {x: 68, y: 200, body: 'foot'},
  '大钟': {x: 62, y: 215, body: 'foot'},
  '水泉': {x: 60, y: 225, body: 'foot'},

  // 头部穴位
  '百会': {x: 110, y: 30, body: 'head'},
  '风池': {x: 45, y: 165, body: 'head'},
  '风府': {x: 110, y: 160, body: 'head'},
  '太阳': {x: 20, y: 100, body: 'head'},
  '印堂': {x: 110, y: 85, body: 'head'},
  '攒竹': {x: 62, y: 85, body: 'head'},
  '睛明': {x: 65, y: 100, body: 'head'},
  '迎香': {x: 88, y: 135, body: 'head'},
  '地仓': {x: 78, y: 165, body: 'head'},
  '颊车': {x: 48, y: 155, body: 'head'},
  '下关': {x: 40, y: 130, body: 'head'},
  '头维': {x: 45, y: 55, body: 'head'},
  '率谷': {x: 35, y: 80, body: 'head'},
  '丝竹空': {x: 28, y: 85, body: 'head'},
  '耳门': {x: 30, y: 115, body: 'head'},
  '听会': {x: 25, y: 125, body: 'head'},
  '角孙': {x: 35, y: 70, body: 'head'},

  // 腰背部穴位
  '大椎': {x: 100, y: 52, body: 'back'},
  '肺俞': {x: 65, y: 97, body: 'back'},
  '心俞': {x: 65, y: 117, body: 'back'},
  '肝俞': {x: 65, y: 152, body: 'back'},
  '脾俞': {x: 65, y: 177, body: 'back'},
  '肾俞': {x: 65, y: 207, body: 'back'},
  '命门': {x: 100, y: 205, body: 'back'},
  '腰阳关': {x: 100, y: 247, body: 'back'},
  '志室': {x: 50, y: 207, body: 'back'},
  '天宗': {x: 135, y: 115, body: 'back'},
  '肩井': {x: 125, y: 55, body: 'back'},
  '大杼': {x: 70, y: 65, body: 'back'},

  // 胸腹部穴位
  '中脘': {x: 100, y: 115, body: 'front'},
  '关元': {x: 100, y: 242, body: 'front'},
  '气海': {x: 100, y: 217, body: 'front'},
  '天枢': {x: 65, y: 195, body: 'front'},
  '中府': {x: 50, y: 60, body: 'front'},
  '膻中': {x: 100, y: 85, body: 'front'},
  '巨阙': {x: 100, y: 130, body: 'front'},
  '鸠尾': {x: 100, y: 140, body: 'front'},
  '水分': {x: 100, y: 162, body: 'front'},
  '石门': {x: 100, y: 255, body: 'front'},
  '阴交': {x: 100, y: 265, body: 'front'},
  '神阙': {x: 100, y: 195, body: 'front'}
}

// 根据穴位名称和经络判断身体部位
const bodyPart = computed(() => {
  const pos = pointPositions[props.pointName]
  if (pos) return pos.body

  const meridian = props.meridianName
  if (meridian.includes('肺') || meridian.includes('大肠')) {
    if (['合谷', '少商', '商阳'].includes(props.pointName)) return 'hand'
    return 'forearm'
  }
  if (meridian.includes('胃') || meridian.includes('脾')) return 'leg'
  if (meridian.includes('心') || meridian.includes('小肠')) return 'forearm'
  if (meridian.includes('膀胱') || meridian.includes('肾')) return 'leg'
  if (meridian.includes('心包') || meridian.includes('三焦')) return 'forearm'
  if (meridian.includes('胆') || meridian.includes('肝')) return 'leg'
  return 'default'
})

// 穴位坐标
const pointPos = computed(() => {
  const pos = pointPositions[props.pointName]
  if (pos) return {x: pos.x, y: pos.y}
  return {x: 100, y: 150}
})
</script>

<style lang="scss" scoped>
.diagram-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}

.diagram {
  width: 360rpx;
  height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fafafa, #f0f0f0);
  border-radius: 16rpx;
  border: 1rpx solid #e0e0e0;
}

.diagram svg {
  width: 100%;
  height: 100%;
}

.diagram-hint {
  font-size: 20rpx;
  color: #999;
  margin-top: 12rpx;
  text-align: center;
}
</style>
