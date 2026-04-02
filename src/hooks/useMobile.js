import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 767)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}
