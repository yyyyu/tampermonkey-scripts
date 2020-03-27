import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/bilibili-judgement.ts',
  output: {
    dir: 'dist',
    format: 'iife',
    banner: `\
// ==UserScript==
// @name         Bilibili 风纪委员投票
// @namespace    Bilibili
// @version      0.5
// @change-log   0.5 添加投票补偿、描述性文字
//               案件刚开始审理时投票不多，少量票数不能反映总体趋势，添加补偿票数减少
//               和主流意见差异。处理案件过程中在界面Slogan UI上添加描述状态的文字
// @change-log   0.4 添加配置提交内容及投票间隔UI
// @author       yyyyu
// @description  选择多数意见进行投票
// @license      MIT
// @homepage     https://github.com/yyyyu/tampermonkey-scripts
// @icon         https://www.bilibili.com/favicon.ico
// @match        https://www.bilibili.com
// @match        https://www.bilibili.com/judgement*
// @grant        window.close
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
`,
  },
  plugins: [typescript({ tsconfig: 'tsconfig.json' })],
}
