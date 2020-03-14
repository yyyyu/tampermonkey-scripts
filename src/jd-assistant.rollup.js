import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/jd-assistant.ts',
  output: {
    dir: 'dist',
    format: 'iife',
    banner: `\
// ==UserScript==
// @name         京东助理
// @namespace    JD
// @version      0.2
// @author       yyyyu
// @description  一键保价、复制购物车选中链接
// @license      MIT
// @homepage     https://github.com/yyyyu/tampermonkey-scripts
// @icon         https://www.jd.com/favicon.ico
// @match        https://pcsitepp-fm.jd.com/
// @match        https://cart.jd.com/*
// ==/UserScript==
`,
  },
  plugins: [typescript({ tsconfig: 'tsconfig.json' })],
}
