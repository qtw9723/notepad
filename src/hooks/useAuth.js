import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = 로딩 중

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // slug로 프로젝트 계정 로그인 (이메일: {slug}@notepad.local)
  const signIn = async (slug, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${slug}@notepad.local`,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, signIn, signOut }
}
