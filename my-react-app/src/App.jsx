import { useEffect, useState } from 'react'
import Home from './Home.jsx'
import Game from './Game.jsx'

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  const isGamePage = path === '/game'

  if (isGamePage) {
    return <Game />
  }

  return (
    <Home
      explorersThisWeek={286}
      onStart={({ gameCode }) => {
        window.history.pushState({}, '', `/game?code=${encodeURIComponent(gameCode)}`)
        setPath(window.location.pathname)
      }}
    />
  )
}
