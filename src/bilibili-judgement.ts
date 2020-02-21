window.onload = async function main() {
  if (GM_getValue('finish_day') === getDay()) {
    return
  }
  if (!(await isFJWer())[0]) {
    return
  }
  if (location.pathname === '/') {
    GM_openInTab('//www.bilibili.com/judgement', { insert: true })
    return
  }
  while (true) {
    const [caseID, code] = await getCaseID()
    if (code === 25008) {
      await delay(5000)
      location.reload()
      return
    }
    if (code === 25014) {
      GM_setValue('finish_day', getDay())
      window.close()
      return
    }
    const approve =
      (await getVoteCount(caseID, 1))[0] >= (await getVoteCount(caseID, 2))[0]
    await vote(caseID, approve)
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
    body: `cid=${caseID}&vote=${vot}&content=&attr=0&csrf=${csrf}`,
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
