import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join } from 'path'

const STATIC_DIR = join(__dirname, '../src/static')
mkdirSync(STATIC_DIR, { recursive: true })

// 图标配置
const icons = [
  {
    name: 'tab-home',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  },
  {
    name: 'tab-diagnosis',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`
  },
  {
    name: 'tab-profile',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
  },
  {
    name: 'tab-formula',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
  },
  {
    name: 'tab-herb',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.84"></path><path d="M17 8l-4.58 6.03"></path></svg>`
  },
  {
    name: 'tab-case',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
  },
  {
    name: 'tab-acupuncture',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`
  }
]

async function generateIcons() {
  for (const icon of icons) {
    // 生成普通状态图标 (灰色)
    const normalSvg = icon.svg.replace('currentColor', '#999999')
    await sharp(Buffer.from(normalSvg))
      .resize(81, 81)
      .png()
      .toFile(join(STATIC_DIR, `${icon.name}.png`))

    // 生成选中状态图标 (红色)
    const activeSvg = icon.svg.replace('currentColor', '#8B2500')
    await sharp(Buffer.from(activeSvg))
      .resize(81, 81)
      .png()
      .toFile(join(STATIC_DIR, `${icon.name}-active.png`))

    console.log(`Generated: ${icon.name}.png, ${icon.name}-active.png`)
  }
  console.log('All icons generated!')
}

generateIcons().catch(console.error)
