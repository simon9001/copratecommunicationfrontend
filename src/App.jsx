import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import ExplorePage from './pages/ExplorePage/ExplorePage'
import ProjectPage from './pages/ProjectPage/ProjectPage'
import AdminLoginPage from './pages/AdminLogin/AdminLoginPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          <Route path="/admin-portal" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </ThemeProvider>
  )
}

export default App
