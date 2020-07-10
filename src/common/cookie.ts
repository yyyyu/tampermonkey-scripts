export function getCookie(name: string) {
  return getCookieMap()[name]
}

export function getCookieMap(): { [key: string]: string } {
  return document.cookie
    .split('; ')
    .map((item) => item.split('='))
    .reduce((acc: { [key: string]: string }, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
}
