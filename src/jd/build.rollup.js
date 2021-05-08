import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/jd/jd-assistant.ts',
  output: {
    file: 'releases/jd-assistant.js',
    format: 'iife',
    banner: `\
// ==UserScript==
// @name         京东助理
// @namespace    JD
// @version      0.6
// @author       yvvw
// @description  一键保价、复制购物车选中链接
// @license      MIT
// @homepage     https://github.com/yvvw/tampermonkey-scripts
// @downloadURL  https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/master/releases/jd-assistant.js
// @icon         https://www.jd.com/favicon.ico
// @match        https://pcsitepp-fm.jd.com/
// @match        https://cart.jd.com/*
// ==/UserScript==
`,
  },
  plugins: [typescript({ tsconfig: 'tsconfig.json' })],
}
