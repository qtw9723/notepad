import { createClient } from '@supabase/supabase-js'
import { cookieStorage } from './cookieStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    autoRefreshToken: false, // 자동 갱신 X → 쿠키 만료 시 세션 소멸
    persistSession: true,
  },
})
