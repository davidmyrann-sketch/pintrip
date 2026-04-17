import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import FeedPage    from './pages/FeedPage'
import SearchPage  from './pages/SearchPage'
import TripsPage   from './pages/TripsPage'
import TripDetail  from './pages/TripDetail'
import ProfilePage from './pages/ProfilePage'
import AuthPage    from './pages/AuthPage'
import PrivacyPage        from './pages/PrivacyPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import BottomNav   from './components/BottomNav'
import GdprBanner  from './components/GdprBanner'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="h-full flex flex-col bg-bg overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/"            element={<FeedPage />} />
              <Route path="/search"      element={<SearchPage />} />
              <Route path="/trips"       element={<TripsPage />} />
              <Route path="/trips/:id"   element={<TripDetail />} />
              <Route path="/profile"     element={<ProfilePage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/auth"        element={<AuthPage />} />
              <Route path="/privacy"        element={<PrivacyPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*"               element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <BottomNav />
          <GdprBanner />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
