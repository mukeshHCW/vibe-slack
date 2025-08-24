import { useState, useEffect } from 'react'
import Login from './components/Login.tsx'
import ChatApp from './components/ChatApp.tsx'
import './App.css'

function App() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <div className="app">
      {user ? (
        <ChatApp user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App
