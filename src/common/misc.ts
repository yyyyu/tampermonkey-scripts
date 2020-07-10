/**
 * 延时
 */
export async function delay(timer: number) {
  return new Promise((resolve) => setTimeout(resolve, timer))
}
