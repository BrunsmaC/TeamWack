import { useEffect, useState } from 'react'
import Home from './Home.jsx'
import Game from './Game.jsx'
import { joinHunt } from './api.js'
import { getOrCreatePlayerId } from './player.js'

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
      onStart={async ({ phone, gameCode }) => {
        const playerId = getOrCreatePlayerId(phone)
        const hunt = await joinHunt(gameCode, playerId)
        window.history.pushState({}, '', `/game?code=${encodeURIComponent(hunt.access_code)}&player=${encodeURIComponent(playerId)}`)
        setPath(window.location.pathname)
      }}
    />
  )
}
