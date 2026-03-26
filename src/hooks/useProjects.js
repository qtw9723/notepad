import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function useProjects() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    api.getProjects()
      .then(data => setProjects(data || []))
      .catch(e => console.error('Failed to load projects:', e))
  }, [])

  return { projects }
}
