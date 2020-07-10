import { getValue, setValue, deleteValue } from '../../common/tampermonkey'

export class Config {
  /** 赞成票数补偿 */
  public static readonly APPROVE_ALTER = 2

  /** 最小投票间隔 */
  public static readonly MIN_INTERVAL = 2000

  /** 匿名投票 */
  public static readonly ANONYMOUS = true

  /** 当日完成后自动关闭 */
  public static readonly AUTO_CLOSE = true

  /** 每日最多案件 */
  public static readonly MAX_DAILY_CASE_COUNT = 20

  public set approveText(text: string) {
    setValue('approve_text', text)
  }

  public get approveText() {
    return getValue('approve_text', '')
  }

  public set refuseText(text: string) {
    setValue('refuse_text', text)
  }

  public get refuseText() {
    return getValue('refuse_text', '')
  }

  public set approveAlter(alter: number) {
    setValue('approve_alter', alter)
  }

  public get approveAlter() {
    return getValue('approve_alter', Config.APPROVE_ALTER)
  }

  public set anonymous(anonymous: boolean) {
    setValue('anonymous', anonymous)
  }

  public get anonymous() {
    return getValue('anonymous', Config.ANONYMOUS)
  }

  public set autoClose(autoClose: boolean) {
    setValue('auto_close', autoClose)
  }

  public get autoClose() {
    return getValue('auto_close', Config.AUTO_CLOSE)
  }

  public set voteMinInterval(interval: number) {
    setValue('min_interval', interval >= 0 ? interval : 0)
  }

  public get voteMinInterval() {
    return getValue('min_interval', Config.MIN_INTERVAL)
  }

  public set todayCompletedCount(count: number) {
    if (count < 0) {
      count = 0
    } else if (count > Config.MAX_DAILY_CASE_COUNT) {
      count = Config.MAX_DAILY_CASE_COUNT
    }

    setValue('today_completed_count', count)
  }

  public get todayCompletedCount() {
    return getValue('today_completed_count', Config.MIN_INTERVAL)
  }
}

export const config = new Config()

// migrate
;(() => {
  const approveAlter = getValue('approve_alter', null)
  if (approveAlter && typeof approveAlter === 'string') {
    config.approveAlter = parseInt(approveAlter, 10)
  }
  const todayCompletedCount = getValue('today_completed_count', null)
  if (todayCompletedCount !== null && typeof todayCompletedCount === 'string') {
    config.todayCompletedCount = parseInt(todayCompletedCount, 10)
  }
  const voteMinInterval = getValue('vote_min_interval', null)
  if (voteMinInterval !== null && typeof voteMinInterval === 'string') {
    config.voteMinInterval = parseInt(voteMinInterval, 10)
    deleteValue('vote_min_interval')
  }
  const refuseText = getValue('disapprove_text', null)
  if (refuseText !== null && typeof refuseText === 'string') {
    config.refuseText = refuseText
    deleteValue('disapprove_text')
  }
  deleteValue('finish_day')
})()
