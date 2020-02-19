window.onload = async function main() {
  try {
    if (GM_getValue('finish_day') === getDay()) {
      return
    }
    if (await isFJWer()) {
      while (true) {
        const caseID = await getCaseID()
        if (caseID < 0) {
          return
        }
        const approve =
          (await getVoteCount(caseID, 1)) >= (await getVoteCount(caseID, 2))
        const success = await vote(caseID, approve)
        if (!success) {
          alert('投票失败，请检查接口参数')
          return
        }
      }
    }
  } catch (e) {
    alert(e.message)
  }
}

/**
 * 是否是风纪委员
 * 25005 请成为风纪委员后再试
 */
async function isFJWer() {
  const response = await fetch('https://api.bilibili.com/x/credit/jury/jury', {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
  return (await response.json()).code === 0
}

type CaseID = number

/**
 * 获取案件ID
 * 25008 真给力 , 移交众裁的举报案件已经被处理完了
 * 25014 done
 */
async function getCaseID(): Promise<CaseID> {
  const response = await fetch(
    'https://api.bilibili.com/x/credit/jury/caseObtain',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      mode: 'cors',
      credentials: 'include',
      body: `jsonp=jsonp&csrf=${getCookie('bili_jct')}`,
    },
  )
  const result = await response.json()
  if (result.code === 25014) {
    GM_setValue('finish_day', getDay())
  }
  return result.code === 0 ? result.data.id : -1
}

/**
 * 获取投票数
 */
async function getVoteCount(caseID: CaseID, type: number): Promise<number> {
  const response = await fetch(
    `https://api.bilibili.com/x/credit/jury/vote/opinion?cid=${caseID}&otype=${type}`,
    {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    },
  )
  const result = await response.json()
  return result.code === 0 ? result.data.count : -1
}

/**
 * 投票
 */
async function vote(caseID: CaseID, approve: boolean) {
  const vot = approve ? 4 : 2
  const csrf = getCookie('bili_jct')
  const response = await fetch('https://api.bilibili.com/x/credit/jury/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    mode: 'cors',
    credentials: 'include',
    body: `cid=${caseID}&vote=${vot}&content=&attr=0&csrf=${csrf}`,
  })
  const result = await response.json()
  return result.code === 0
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
 * 20201001
 */
function getDay() {
  const date = new Date()
  return `${date.getFullYear()}${date.getMonth()}${date.getDate()}`
}

/**
 * Tampermonkey GM_setValue
 * https://www.tampermonkey.net/documentation.php#GM_setValue
 */
declare function GM_setValue(name: string, value: any): undefined

/**
 * Tampermonkey GM_getValue
 * https://www.tampermonkey.net/documentation.php#GM_getValue
 */
declare function GM_getValue(name: string, defaultValue?: any): any
