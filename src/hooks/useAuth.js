import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { touchActivity, hasActivity, clearActivity } from '../lib/cookieStorage'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const userRef = useRef(null)

  useEffect(() => {
    // 세션 확인: 활동 쿠키가 없으면 로그아웃 처리
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hasActivity()) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        if (session) touchActivity()
        setUser(session?.user ?? null)
        userRef.current = session?.user ?? null
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null
    })

    // 활동 감지: 60초마다 최대 1회 쿠키 갱신 (쓰로틀)
    let lastTouch = 0
    const onActivity = () => {
      if (!userRef.current) return
      const now = Date.now()
      if (now - lastTouch > 60_000) {
        lastTouch = now
        touchActivity()
      }
    }

    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('click', onActivity)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('click', onActivity)
    }
  }, [])

  const signIn = async (slug, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${slug}@notepad.local`,
      password,
    })
    if (error) throw error
    touchActivity()
  }

  const signOut = async () => {
    clearActivity()
    await supabase.auth.signOut()
  }

  return { user, signIn, signOut }
}
