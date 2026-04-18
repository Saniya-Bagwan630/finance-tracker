import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Briefcase, ChevronRight, Check } from 'lucide-react'
import Button from '../../components/common/Button'
import { authAPI } from '../../services/api'
import './AuthPages.css'

const incomeRanges = [
  { value: '0-10000', label: '₹0 - ₹10,000' },
  { value: '10000-25000', label: '₹10,000 - ₹25,000' },
  { value: '25000-50000', label: '₹25,000 - ₹50,000' },
  { value: '50000-100000', label: '₹50,000 - ₹1,00,000' },
  { value: '100000+', label: '₹1,00,000+' },
]

function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState('')
  const [incomeRange, setIncomeRange] = useState('')

  const handleContinue = async () => {
    if (step === 1 && userType) {
      setStep(2)
    } else if (step === 2 && incomeRange) {
      try {
        await authAPI.updateProfile({
          occupation: userType === 'student' ? 'Student' : 'First-time Earner',
          incomeRange
        })
        navigate('/dashboard')
      } catch (err) {
        // Navigate anyway or show error? Navigate for now to avoid blocking
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="auth-form-container onboarding-container animate-slide-up">
      <div className="onboarding-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <div className="progress-circle">
            {step > 1 ? <Check size={16} /> : '1'}
          </div>
          <span>Profile</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <div className="progress-circle">2</div>
          <span>Income</span>
        </div>
      </div>

      {step === 1 && (
        <div className="onboarding-step">
          <div className="auth-form-header">
            <h2>What describes you best?</h2>
            <p>This helps us personalize your experience</p>
          </div>

          <div className="type-selection">
            <button
              className={`type-card ${userType === 'student' ? 'selected' : ''}`}
              onClick={() => setUserType('student')}
            >
              <div className="type-icon">
                <GraduationCap size={28} />
              </div>
              <div className="type-content">
                <h3>Student</h3>
                <p>I'm currently studying and managing a limited budget</p>
              </div>
              <div className="type-check">
                <Check size={20} />
              </div>
            </button>

            <button
              className={`type-card ${userType === 'earner' ? 'selected' : ''}`}
              onClick={() => setUserType('earner')}
            >
              <div className="type-icon">
                <Briefcase size={28} />
              </div>
              <div className="type-content">
                <h3>First-time Earner</h3>
                <p>I recently started earning and want to manage my money better</p>
              </div>
              <div className="type-check">
                <Check size={20} />
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-step">
          <div className="auth-form-header">
            <h2>What's your monthly income range?</h2>
            <p>This helps us set realistic goals for you</p>
          </div>

          <div className="income-selection">
            {incomeRanges.map((range) => (
              <button
                key={range.value}
                className={`income-option ${incomeRange === range.value ? 'selected' : ''}`}
                onClick={() => setIncomeRange(range.value)}
              >
                <span>{range.label}</span>
                <div className="income-check">
                  <Check size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleContinue}
        fullWidth
        size="lg"
        disabled={(step === 1 && !userType) || (step === 2 && !incomeRange)}
        icon={ChevronRight}
      >
        {step === 2 ? 'Get Started' : 'Continue'}
      </Button>
    </div>
  )
}

export default OnboardingPage
