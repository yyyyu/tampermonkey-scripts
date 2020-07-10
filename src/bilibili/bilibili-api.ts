import { getCookie } from '../common/cookie'

type CaseID = number
type Code = number

export enum JudgementCode {
  NoCase = 25008,
  Finished = 25014,
}

/**
 * 是否是风纪委员
 *
 * 25005 请成为风纪委员后再试
 */
export async function isFJWer(): Promise<[boolean, number]> {
  const response = await fetch('//api.bilibili.com/x/credit/jury/jury', {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
  const result = await response.json()

  return [result.code === 0, result.code]
}

/**
 * 获取案件ID
 *
 * 25008 真给力 , 移交众裁的举报案件已经被处理完了
 * 25014 done
 */
export async function getCaseID(): Promise<[CaseID, Code]> {
  const csrf = getCookie('bili_jct')

  const response = await fetch('//api.bilibili.com/x/credit/jury/caseObtain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    mode: 'cors',
    credentials: 'include',
    body: `jsonp=jsonp&csrf=${csrf}`,
  })
  const result = await response.json()

  return [result.code === 0 ? result.data.id : -1, result.code]
}

export enum VoteType {
  Approve,
  Refuse,
}

/**
 * 获取票数
 */
export async function getVoteCount(
  cid: CaseID,
  config: { type: VoteType },
): Promise<[number, Code]> {
  let type = 1
  if (VoteType.Approve === config.type) {
    type = 1
  } else if (VoteType.Refuse === config.type) {
    type = 2
  }

  const response = await fetch(
    `//api.bilibili.com/x/credit/jury/vote/opinion?cid=${cid}&otype=${type}`,
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
export async function vote(
  cid: CaseID,
  config: {
    approve: boolean
    anonymous: boolean
    content: string
  },
): Promise<[boolean, Code]> {
  const approve = config.approve ? 4 : 2
  const anonymous = config.anonymous ? 0 : 1
  const content = encodeURIComponent(config.content)
  const csrf = getCookie('bili_jct')

  const response = await fetch('//api.bilibili.com/x/credit/jury/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    mode: 'cors',
    credentials: 'include',
    body: `cid=${cid}&vote=${approve}&content=${content}&attr=${anonymous}&csrf=${csrf}`,
  })
  const result = await response.json()

  return [result.code === 0, result.code]
}
