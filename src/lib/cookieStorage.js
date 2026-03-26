const COOKIE_NAME = 'notepad-active'
const MAX_AGE = 600 // 10분 (초)

// 활동 쿠키 갱신 (마지막 활동으로부터 10분 연장)
export const touchActivity = () => {
  document.cookie = `${COOKIE_NAME}=1; max-age=${MAX_AGE}; path=/; SameSite=Strict`
}

// 활동 쿠키 존재 여부 확인
export const hasActivity = () => {
  return document.cookie.split('; ').some(row => row.startsWith(`${COOKIE_NAME}=`))
}

// 활동 쿠키 삭제
export const clearActivity = () => {
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Strict`
}
