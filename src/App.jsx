import Home from './Home.jsx'

export default function App() {
  return (
    <Home
      explorersThisWeek={286}
      onStart={({ phone, gameCode }) => {
        console.log(phone, gameCode) // replace with navigation to the game page
      }}
    />
  )
}