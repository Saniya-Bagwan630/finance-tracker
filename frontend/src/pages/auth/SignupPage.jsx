import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, IndianRupee } from 'lucide-react'
import { Input } from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import './AuthPages.css'

function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    income: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      const data = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        income: Number(formData.income),
      })

      // Auto-login handled in context if signup returns data, or we just rely on token in localStorage if context handles it.
      // Actually AuthContext.signup just calls API. We need to call login to update context state or manually update it.
      // But let's check AuthContext. It doesn't update state on signup.
      // So we should manually call login with the response data if possible, or just reload?
      // Better: Update AuthContext to handle signup response if it contains token.

      // For now, let's assume we need to manually set token if API returns it, or just use the login method
      // Actually, since I changed backend to return token, I can use that.
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Force context update or reload, but cleaner is to use a login-like action.
        // Let's just navigate to login for now as context might not be ready? 
        // NO, user wants Signup -> Onboarding.
        // I will assume AuthContext needs an update or I can just reload.
        window.location.href = '/onboarding';
      } else {
        navigate('/login', { state: { message: 'Account created successfully! Please login.' } })
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-form-container animate-slide-up">
      <div className="auth-form-header">
        <h2>Create your account</h2>
        <p>Start your journey to better finances</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          type="text"
          name="name"
          placeholder="Enter your full name"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Monthly Income (₹)"
          type="number"
          name="income"
          placeholder="Enter your monthly income"
          icon={IndianRupee}
          value={formData.income}
          onChange={handleChange}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Create a password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <div className="auth-form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
          </label>
        </div>

        <Button type="submit" fullWidth size="lg" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}

export default SignupPage