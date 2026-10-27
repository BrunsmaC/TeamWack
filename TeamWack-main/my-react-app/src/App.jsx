import { useEffect, useState } from 'react'
import Home from './Home.jsx'
import Game from './Game.jsx'
import { joinHunt } from './joinApi.js'

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
        // Throws on failure; Home shows the message under the form.
        await joinHunt(gameCode, phone)
        window.history.pushState({}, '', `/game?code=${encodeURIComponent(gameCode)}`)
        setPath(window.location.pathname)
      }}
    />
  )
}
