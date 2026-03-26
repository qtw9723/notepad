const MAX_AGE = 600 // 10분 (초)

export const cookieStorage = {
  getItem: (key) => {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
  },
  setItem: (key, value) => {
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${MAX_AGE}; path=/; SameSite=Strict`
  },
  removeItem: (key) => {
    document.cookie = `${key}=; max-age=0; path=/; SameSite=Strict`
  },
}
