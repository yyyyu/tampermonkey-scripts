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
// @version      0.3
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
