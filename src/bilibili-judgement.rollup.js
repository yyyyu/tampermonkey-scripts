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
// @version      0.1
// @author       yuuuu
// @description  选择多数意见进行投票
// @icon         https://www.bilibili.com/favicon.ico
// @match        https://www.bilibili.com
// @match        https://www.bilibili.com/judgement*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`,
  },
  plugins: [typescript({ tsconfig: 'tsconfig.json' })],
}
