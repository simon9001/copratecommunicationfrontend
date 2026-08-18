import { Link, useLocation } from 'react-router-dom'
import { Info, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import './Header.css'

export default function Header() {
  const location = useLocation()
  const isExplore = location.pathname === '/'
  const isAdmin = location.pathname.startsWith('/admin')
  const { theme, toggleTheme } = useTheme()

  if (isAdmin) return null

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="header-logo">
          <img
            src="/kenha-logo.jpg"
            alt="Kenya National Highways Authority"
            className="kenha-official-logo"
          />
          <div className="logo-text">
            <span className="logo-name">KeNHA Projects</span>
            <span className="logo-tagline">Quality Highways, Better Connections</span>
          </div>
        </Link>
      </div>

      <nav className="header-nav">
        <Link
          to="/"
          className={`header-nav-link ${isExplore ? 'active' : ''}`}
        >
          Explore Projects
        </Link>
      </nav>

      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <a
          href="https://www.kenha.co.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="header-about"
        >
          <Info size={16} />
          About KeNHA
        </a>
      </div>
    </header>
  )
}
