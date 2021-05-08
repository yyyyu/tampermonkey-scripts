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

(function () {
  'use strict';

  main();
  function main() {
      const button = document.createElement('button');
      const site = location.host.split('.')[0];
      if ('pcsitepp-fm' === site) {
          button.innerText = '一键价保';
          button.onclick = async () => {
              while (true) {
                  const buttons = Array.from(document.querySelectorAll('[id^=applyBT]')).filter((btn) => btn.innerText === '申请价保' && !btn.hasAttribute('style'));
                  if (buttons.length === 0) {
                      break;
                  }
                  while (true) {
                      const buttons5 = buttons.splice(0, 5);
                      if (buttons5.length === 0) {
                          break;
                      }
                      buttons5.forEach((btn) => btn.click());
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                  }
              }
          };
      }
      else if ('cart' === site) {
          button.innerText = '复制链接';
          button.onclick = async () => {
              let linkText = '';
              for (const el of Array.from(document.getElementsByClassName('item-selected'))) {
                  linkText += `https://item.jd.com/${el.getAttribute('skuid')}.html\n\n`;
              }
              for (const el of Array.from(document.getElementsByClassName('item-seleted'))) {
                  if (el instanceof HTMLElement) {
                      linkText += `https://item.jd.com/${el.dataset.sku}.html\n\n`;
                  }
              }
              linkText += '复制';
              await navigator.clipboard.writeText(linkText);
              alert('复制成功');
          };
      }
      else {
          return;
      }
      button.setAttribute('style', `
-webkit-appearance: none;
position: fixed;
top: 350px;
right: 20px;
width: 100px;
height: 32px;
line-height: 32px;
color: #fff;
font-family: "Microsoft YaHei";
background-color: #e2231a;
border: none;
`);
      document.body.appendChild(button);
  }

}());
