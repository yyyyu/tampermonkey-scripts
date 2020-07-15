import { openInTab } from '../../common/tampermonkey'
import {
  isFJWer,
  getCaseID,
  getVoteCount,
  VoteType,
  vote,
  JudgementCode,
} from '../bilibili-api'
import { config, Config } from './config'
import { delay } from '../../common/misc'

window.onload = main

async function main() {
  if (location.pathname !== '/') {
    renderSetting()
  }

  if (!(await isFJWer())[0]) {
    return
  }

  if (location.pathname === '/') {
    const [cid, code] = await getCaseID()
    if (code !== JudgementCode.Finished) {
      openInTab(`//www.bilibili.com/judgement?cid=${cid}`, { insert: true })
    }
    return
  }

  // 从查询参数上拿到首页获取案件拿到的id
  let queryCid: number = -1
  try {
    const result = parseInt(location.search.replace('?', '').split('=')[1], 10)
    if (result > 0) {
      queryCid = result
    }
  } catch {}

  while (true) {
    setSlogan(
      `(${config.todayCompletedCount}/${Config.MAX_DAILY_CASE_COUNT})获取案件...`,
    )

    let cid: number = -1
    let code: number = -1

    if (queryCid > 0) {
      cid = queryCid
      queryCid = -1
    } else {
      const result = await getCaseID()
      cid = result[0]
      code = result[1]
    }

    if (JudgementCode.NoCase === code) {
      setSlogan(
        `(${config.todayCompletedCount}/${Config.MAX_DAILY_CASE_COUNT})当前无案件，5s后自动重试`,
      )
      await delay(5000)
      continue
    }

    if (JudgementCode.Finished === code) {
      const enableClose = config.todayCompletedCount !== 0

      config.todayCompletedCount = 0
      setSlogan(
        `(${Config.MAX_DAILY_CASE_COUNT}/${Config.MAX_DAILY_CASE_COUNT})今日已完成任务`,
      )

      if (config.autoClose) {
        if (enableClose) {
          setTimeout(window.close, 0)
        }
      } else {
        setSlogan(`今日已完成，半小时后继续检查`)
        await delay(30 * 60 * 1000)
        continue
      }

      return
    }

    setSlogan(
      `(${config.todayCompletedCount}/${Config.MAX_DAILY_CASE_COUNT})获取案件票数...`,
    )

    // 被审理案件违规的情况更普遍，投票早期偶有发生投反对导致最终结果出现差异
    const approve =
      (await getVoteCount(cid, { type: VoteType.Approve }))[0] +
        config.approveAlter >=
      (await getVoteCount(cid, { type: VoteType.Refuse }))[0]

    setSlogan(
      `(${config.todayCompletedCount}/${Config.MAX_DAILY_CASE_COUNT})案件投${
        approve ? '赞成' : '反对'
      }票...`,
    )

    await vote(cid, {
      approve,
      anonymous: config.anonymous,
      content: approve ? config.approveText : config.refuseText,
    })

    config.todayCompletedCount++

    let intervel = config.voteMinInterval + Math.round(Math.random() * 2) * 1000

    setSlogan(
      `(${config.todayCompletedCount}/${Config.MAX_DAILY_CASE_COUNT})${intervel}ms后处理下一案件`,
    )

    await delay(intervel)
  }
}

/**
 * 设置口号
 */
function setSlogan(text: string) {
  const sloganEl = document.querySelector<HTMLDivElement>('.fjw-user .u-img')
  if (sloganEl) {
    sloganEl.innerText = text
  }
}

/**
 * 渲染设置UI
 */
function renderSetting() {
  const button = document.createElement('button')
  button.className = 'votescript-cfgbtn'
  button.innerText = '投票配置'
  let modal: HTMLDivElement
  button.addEventListener('click', () => {
    if (!modal) {
      modal = document.createElement('div')
      modal.className = 'votescript-modal'
      const form = createForm(() => {
        modal.className = 'votescript-modal hide'
      })
      modal.appendChild(form)
      document.body.append(modal)
    } else {
      modal.className = 'votescript-modal'
    }
  })
  document.body.append(button)
  document.head.append(createStyle())
}

/**
 * 创建表单
 */
function createForm(hide: () => void) {
  const form = document.createElement('div')
  form.className = 'votescript-form'
  const approveRow = createInputRow('赞成描述:', '赞成描述', config.approveText)
  const refuseRow = createInputRow('反对描述:', '反对描述', config.refuseText)
  const approveAlterRow = createInputRow(
    '赞成修正(判定投票结果时添加到赞成方):',
    '赞成修正',
    `${config.approveAlter}`,
  )
  const anonymousRow = createInputRow(
    '匿名投票(1匿名/0实名):',
    '匿名投票(1匿名/0实名)',
    `${config.anonymous ? 1 : 0}`,
  )
  const autoCloseRow = createInputRow(
    '当日完成后是否关闭(1关闭/0不关闭):',
    '当日完成后是否关闭(1关闭/0不关闭)',
    `${config.autoClose ? 1 : 0}`,
  )
  const intervelRow = createInputRow(
    '最小投票间隔(ms)(实际会额外增加0~2s):',
    '最小投票间隔(ms)',
    `${config.voteMinInterval}`,
  )
  const buttonGroup = document.createElement('div')
  buttonGroup.className = 'votescript-buttongroup'
  const saveBtn = createButton('保存')

  saveBtn.addEventListener('click', () => {
    const approveInput = approveRow.lastElementChild as HTMLInputElement
    const approveText = approveInput.value.trim()
    config.approveText = approveText
    approveInput.value = approveText

    const refuseInput = refuseRow.lastElementChild as HTMLInputElement
    const refuseText = refuseInput.value.trim()
    config.refuseText = refuseText
    refuseInput.value = refuseText

    const approveAlterInput = approveAlterRow.lastElementChild as HTMLInputElement
    let approveAlter = parseInt(approveAlterInput.value, 10)
    config.approveAlter = approveAlter
    approveAlterInput.value = `${approveAlter}`

    const anonymousInput = anonymousRow.lastElementChild as HTMLInputElement
    let anonymous = parseInt(anonymousInput.value, 10)
    config.anonymous = anonymous === 1
    anonymousInput.value = `${anonymous}`

    const autoCloseInput = autoCloseRow.lastElementChild as HTMLInputElement
    let autoClose = parseInt(autoCloseInput.value, 10)
    config.autoClose = autoClose === 1
    autoCloseInput.value = `${autoClose}`

    const intervelInput = intervelRow.lastElementChild as HTMLInputElement
    let intervel = parseInt(intervelInput.value, 10)
    config.voteMinInterval = intervel
    intervelInput.value = `${intervel}`

    hide()
  })

  const cancelBtn = createButton('取消')
  cancelBtn.addEventListener('click', () => hide())
  buttonGroup.append(saveBtn, cancelBtn)
  form.append(
    approveRow,
    refuseRow,
    approveAlterRow,
    anonymousRow,
    autoCloseRow,
    intervelRow,
    buttonGroup,
  )
  return form
}

/**
 * 创建输入框
 */
function createInputRow(
  labelText: string,
  inputPlaceholder: string,
  inputValue: string,
) {
  const row = document.createElement('div')
  row.className = 'votescript-row'
  const label = document.createElement('label')
  label.innerText = labelText
  label.className = 'votescript-label'
  const input = document.createElement('input')
  input.value = inputValue
  input.placeholder = inputPlaceholder
  input.className = 'votescript-input'
  row.append(label, input)
  return row
}

/**
 * 创建按钮
 */
function createButton(text: string) {
  const button = document.createElement('button')
  button.className = 'votescript-btn'
  button.innerText = text
  return button
}

/**
 * 创建样式
 */
function createStyle() {
  const style = document.createElement('style')
  style.type = 'text/css'
  style.appendChild(
    document.createTextNode(`
.votescript-cfgbtn {
  -webkit-appearance: none;
  position: fixed;
  bottom: 20px;
  right: 0px;
  width: 100px;
  height: 32px;
  line-height: 32px;
  background-color: #00a1d6;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.votescript-modal {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
}

.votescript-modal.hide {
  display: none;
}

.votescript-form {
  box-sizing: border-box;
  width: 500px;
  margin: 100px auto 0;
  padding: 15px;
  background-color: #fff;
  border-radius: 5px;
}

.votescript-row {
  margin: 10px 0;
}

.votescript-buttongroup {
  margin-top: 20px;
}

.votescript-btn {
  -webkit-appearance: none;
  margin-right: 10px;
  padding: 4px 12px;
  border: none;
  border-radius: 3px;
  background-color: #00a1d6;
  color: #fff;
  cursor: pointer;
}

.votescript-label {
  display: inline-block;
  margin-bottom: 5px;
}

.votescript-input {
  -webkit-appearance: none;
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  border: 1px solid #c1c1c1;
  border-radius: 3px;
  padding: 2px 5px;
}
`),
  )
  return style
}
