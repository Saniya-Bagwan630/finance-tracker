import { Outlet } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import './AuthLayout.css'

function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-brand">
          <BrandLogo subtitle="Premium personal finance" size="large" />
        </div>
        <div className="auth-tagline">
          <h2>Smart money management for the next generation</h2>
          <p>Track expenses, set goals, and let AI guide your financial journey.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="feature-dot"></div>
            <span>AI-powered expense tracking</span>
          </div>
          <div className="auth-feature">
            <div className="feature-dot"></div>
            <span>Personalized savings goals</span>
          </div>
          <div className="auth-feature">
            <div className="feature-dot"></div>
            <span>Smart insights & reports</span>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
