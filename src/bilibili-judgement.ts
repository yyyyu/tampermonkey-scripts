window.onload = scriptMain

// 默认赞成票数补偿
const DEFAULT_APPROVE_ALTER = 2
// 默认最小投票间隔
const DEFAULT_MIN_INTERVAL = 2000
// 每日最大案件数
const DAILY_MAX_CASE = 20

async function scriptMain() {
  const sloganEl = getSloganEl()
  if (location.pathname !== '/') {
    renderSetting()
  }
  if (GM_getValue('finish_day') === getDay()) {
    if (sloganEl) {
      setSlogan(sloganEl, `(${DAILY_MAX_CASE}/${DAILY_MAX_CASE})今日已完成任务`)
    }
    GM_setValue('today_completed_count', '0')
    return
  }
  if (!(await isFJWer())[0]) {
    return
  }
  if (location.pathname === '/') {
    GM_openInTab('//www.bilibili.com/judgement', { insert: true })
    return
  }
  let todayCount = parseInt(GM_getValue('today_completed_count', '0'), 10)
  while (true) {
    if (sloganEl) {
      setSlogan(sloganEl, `(${todayCount}/${DAILY_MAX_CASE})获取案件...`)
    }
    const [caseID, code] = await getCaseID()
    if (code === 25008) {
      if (sloganEl) {
        setSlogan(
          sloganEl,
          `(${todayCount}/${DAILY_MAX_CASE})当前无案件，5s后自动重试`,
        )
      }
      await delay(5000)
      location.reload()
      return
    }
    if (code === 25014) {
      GM_setValue('finish_day', getDay())
      window.close()
      return
    }
    if (sloganEl) {
      setSlogan(sloganEl, `(${todayCount}/${DAILY_MAX_CASE})获取案件票数...`)
    }
    // 被审理案件违规的情况更普遍，投票早期偶有发生投反对导致最终结果出现差异
    let approveALter = parseInt(
      GM_getValue('approve_alter', `${DEFAULT_APPROVE_ALTER}`),
      10,
    )
    approveALter = Number.isInteger(approveALter)
      ? approveALter
      : DEFAULT_APPROVE_ALTER
    const approve =
      (await getVoteCount(caseID, 1))[0] + approveALter >=
      (await getVoteCount(caseID, 2))[0]
    if (sloganEl) {
      setSlogan(
        sloganEl,
        `(${todayCount}/${DAILY_MAX_CASE})案件投${
          approve ? '赞成' : '反对'
        }票...`,
      )
    }
    await vote(
      caseID,
      approve,
      approve
        ? GM_getValue('approve_text', '')
        : GM_getValue('disapprove_text', ''),
    )
    GM_setValue('today_completed_count', `${++todayCount}`)
    let intervel = parseInt(
      GM_getValue('vote_min_interval', `${DEFAULT_MIN_INTERVAL}`),
      10,
    )
    intervel =
      (Number.isInteger(intervel) && intervel >= 0
        ? intervel
        : DEFAULT_MIN_INTERVAL) +
      Math.round(Math.random() * 2) * 1000
    if (sloganEl) {
      setSlogan(
        sloganEl,
        `(${todayCount}/${DAILY_MAX_CASE})${intervel}ms后处理下一案件`,
      )
    }
    await delay(intervel)
  }
}

/**
 * 是否是风纪委员
 * 25005 请成为风纪委员后再试
 */
async function isFJWer(): Promise<[boolean, number]> {
  const response = await fetch('//api.bilibili.com/x/credit/jury/jury', {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
  const result = await response.json()
  return [result.code === 0, result.code]
}

type CaseID = number
type Code = number

/**
 * 获取案件ID
 * 25008 真给力 , 移交众裁的举报案件已经被处理完了
 * 25014 done
 */
async function getCaseID(): Promise<[CaseID, Code]> {
  const response = await fetch('//api.bilibili.com/x/credit/jury/caseObtain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    mode: 'cors',
    credentials: 'include',
    body: `jsonp=jsonp&csrf=${getCookie('bili_jct')}`,
  })
  const result = await response.json()
  return [result.code === 0 ? result.data.id : -1, result.code]
}

/**
 * 获取投票数
 */
async function getVoteCount(
  caseID: CaseID,
  type: number,
): Promise<[number, Code]> {
  const response = await fetch(
    `//api.bilibili.com/x/credit/jury/vote/opinion?cid=${caseID}&otype=${type}`,
    {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    },
  )
  const result = await response.json()
  return [result.code === 0 ? result.data.count : -1, result.code]
}

/**
 * 投票
 */
async function vote(
  caseID: CaseID,
  approve: boolean,
  content: string,
): Promise<[boolean, Code]> {
  const vot = approve ? 4 : 2
  const csrf = getCookie('bili_jct')
  const response = await fetch('//api.bilibili.com/x/credit/jury/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    mode: 'cors',
    credentials: 'include',
    body: `cid=${caseID}&vote=${vot}&content=${encodeURIComponent(
      content,
    )}&attr=0&csrf=${csrf}`,
  })
  const result = await response.json()
  return [result.code === 0, result.code]
}

/**
 * 获取cookie
 * @param {string} name
 */
function getCookie(name: string) {
  return getCookies()[name]
}

/**
 * 获取cookies(map 形式)
 */
function getCookies(): { [key: string]: string } {
  return document.cookie
    .split('; ')
    .map(item => item.split('='))
    .reduce((acc: { [key: string]: string }, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
}

/**
 * 延时
 */
async function delay(timer: number) {
  return new Promise(resolve => setTimeout(resolve, timer))
}

/**
 * 20201001
 */
function getDay() {
  const date = new Date()
  return `${date.getFullYear()}${date.getMonth()}${date.getDate()}`
}

/**
 * 获取口号 element
 */
function getSloganEl() {
  return document.querySelector<HTMLDivElement>('.fjw-user .u-img')
}

/**
 * 设置口号
 */
function setSlogan(el: HTMLDivElement, text: string) {
  el.innerText = text
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
  const approveRow = createInputRow(
    '赞成描述:',
    '赞成描述',
    GM_getValue('approve_text', ''),
  )
  const disapproveRow = createInputRow(
    '反对描述:',
    '反对描述',
    GM_getValue('disapprove_text', ''),
  )
  const approveALterRow = createInputRow(
    '赞成修正(判定投票结果时添加到赞成方):',
    '赞成修正',
    GM_getValue('approve_alter', `${DEFAULT_APPROVE_ALTER}`),
  )
  const intervelRow = createInputRow(
    '最小投票间隔(ms)(实际会额外增加0~2s):',
    '最小投票间隔(ms)',
    GM_getValue('vote_min_interval', `${DEFAULT_MIN_INTERVAL}`),
  )
  const buttonGroup = document.createElement('div')
  buttonGroup.className = 'votescript-buttongroup'
  const saveBtn = createButton('保存')
  saveBtn.addEventListener('click', () => {
    const approveInput = approveRow.lastElementChild as HTMLInputElement
    const approveText = approveInput.value.trim()
    GM_setValue('approve_text', approveText)
    approveInput.value = approveText

    const disapproveInput = disapproveRow.lastElementChild as HTMLInputElement
    const disapproveText = disapproveInput.value.trim()
    GM_setValue('disapprove_text', disapproveText)
    disapproveInput.value = disapproveText

    const approveALterInput = approveALterRow.lastElementChild as HTMLInputElement
    let approveALter = parseInt(approveALterInput.value, 10)
    approveALter =
      Number.isInteger(approveALter) && approveALter >= 0
        ? approveALter
        : DEFAULT_APPROVE_ALTER
    GM_setValue('approve_alter', `${approveALter}`)
    approveALterInput.value = `${approveALter}`

    const intervelInput = intervelRow.lastElementChild as HTMLInputElement
    let intervel = parseInt(intervelInput.value, 10)
    intervel =
      Number.isInteger(intervel) && intervel >= 0
        ? intervel
        : DEFAULT_MIN_INTERVAL
    GM_setValue('vote_min_interval', `${intervel}`)
    intervelInput.value = `${intervel}`

    hide()
  })
  const cancelBtn = createButton('取消')
  cancelBtn.addEventListener('click', () => hide())
  buttonGroup.append(saveBtn, cancelBtn)
  form.append(
    approveRow,
    disapproveRow,
    approveALterRow,
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
