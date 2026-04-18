import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  X,
  IndianRupee
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { Input, Select } from '../../components/common/Input'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { goalsAPI, savingsAPI } from '../../services/api'
import './GoalPages.css'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null

  const parsedDeadline = new Date(deadline)
  if (Number.isNaN(parsedDeadline.getTime())) return null

  parsedDeadline.setHours(0, 0, 0, 0)
  return Math.ceil((parsedDeadline.getTime() - startOfToday().getTime()) / MS_PER_DAY)
}

const getGoalValidationMessage = ({ targetAmount, deadline, savingFrequency }) => {
  if (!targetAmount || targetAmount <= 0 || !deadline || !savingFrequency) {
    return 'Please fill in all fields'
  }

  const daysUntilDeadline = getDaysUntilDeadline(deadline)

  if (daysUntilDeadline === null) {
    return 'Please choose a valid deadline'
  }

  if (daysUntilDeadline < 0) {
    return 'Deadline cannot be in the past'
  }

  if (daysUntilDeadline <= 7 && ['weekly', 'monthly'].includes(savingFrequency)) {
    return 'For deadlines within 7 days, only daily saving frequency is allowed'
  }

  if (daysUntilDeadline <= 31 && savingFrequency === 'monthly') {
    return 'Monthly saving frequency is only allowed when the deadline is more than 1 month away'
  }

  return ''
}

const getAdjustedFrequency = (deadline, currentFrequency) => {
  const daysUntilDeadline = getDaysUntilDeadline(deadline)

  if (daysUntilDeadline === null) {
    return currentFrequency
  }

  if (daysUntilDeadline <= 7 && ['weekly', 'monthly'].includes(currentFrequency)) {
    return 'daily'
  }

  if (daysUntilDeadline <= 31 && currentFrequency === 'monthly') {
    return 'daily'
  }

  return currentFrequency
}

function GoalsListPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [formData, setFormData] = useState({
    target_amount: '',
    deadline: '',
    saving_frequency: '',
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showAddSavings, setShowAddSavings] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [savingsAmount, setSavingsAmount] = useState('')
  const todayMin = startOfToday().toISOString().split('T')[0]

  const openAddSavings = (e, goalId) => {
    e.stopPropagation()
    setSelectedGoalId(goalId)
    setShowAddSavings(true)
  }

  const handleAddSavings = async (e) => {
    e.preventDefault()
    if (!savingsAmount || !selectedGoalId) return

    try {
      await savingsAPI.add({
        goal_id: selectedGoalId,
        amount: Number(savingsAmount), // FIXED
        date: new Date()
      })

      setSavingsAmount('')
      setShowAddSavings(false)
      fetchGoals()
    } catch (error) {
      console.error("Failed to add savings", error)
      alert(error.message || "Failed to add savings.")
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await goalsAPI.list()
      setGoals(data.goals || data || [])
    } catch (err) {
      setError(err.message || 'Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const nextState = { ...prev, [name]: value }

      if (name === 'deadline') {
        nextState.saving_frequency = getAdjustedFrequency(value, nextState.saving_frequency)
      }

      const validationMessage = getGoalValidationMessage({
        targetAmount: Number(nextState.target_amount),
        deadline: nextState.deadline,
        savingFrequency: nextState.saving_frequency,
      })

      setFormError(validationMessage)
      return nextState
    })
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    setFormError('')

    const targetAmount = Number(formData.target_amount)
    const deadline = formData.deadline?.trim()
    const savingFrequency = formData.saving_frequency?.trim()

    const validationMessage = getGoalValidationMessage({
      targetAmount,
      deadline,
      savingFrequency,
    })

    if (validationMessage) {
      setFormError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      await goalsAPI.create({
        target_amount: targetAmount,
        deadline,
        saving_frequency: savingFrequency,
      })

      setFormData({
        target_amount: '',
        deadline: '',
        saving_frequency: '',
      })
      setShowCreateModal(false)
      fetchGoals()
    } catch (err) {
      setFormError(err.message || 'Failed to create goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateProgress = (goal) => {
    const savedAmount = goal.saved_amount ?? 0
    const targetAmount = goal.target_amount ?? 0
    if (!savedAmount || !targetAmount) return 0
    return Math.min(100, Math.round((savedAmount / targetAmount) * 100))
  }

  const daysUntilDeadline = getDaysUntilDeadline(formData.deadline)
  const createFrequencyOptions = [
    { value: '', label: 'Select frequency' },
    { value: 'daily', label: 'Daily' },
    {
      value: 'weekly',
      label: 'Weekly',
      disabled: daysUntilDeadline !== null && daysUntilDeadline <= 7,
      title: 'Weekly frequency requires more than 7 days before the deadline'
    },
    {
      value: 'monthly',
      label: 'Monthly',
      disabled: daysUntilDeadline !== null && daysUntilDeadline <= 31,
      title: 'Monthly frequency requires more than 1 month before the deadline'
    },
  ]

  return (
    <div className="goals-page animate-fade-in">
      <div className="goals-page-header">
        <div>
          <h2>My Goals</h2>
          <p>Set and track your savings goals</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Create New Goal
        </Button>
      </div>

      <div className="goals-stats">
        <Card className="goal-stat">
          <div className="stat-icon-wrapper">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{goals.length}</span>
            <span className="stat-text">Active Goals</span>
          </div>
        </Card>
        <Card className="goal-stat">
          <div className="stat-icon-wrapper stat-icon--success">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {formatAmount(goals.reduce((sum, g) => sum + (g.saved_amount || 0), 0))}
            </span>
            <span className="stat-text">Total Saved</span>
          </div>
        </Card>
        <Card className="goal-stat">
          <div className="stat-icon-wrapper stat-icon--warning">
            <Calendar size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {formatAmount(goals.reduce((sum, g) => sum + (g.target_amount || 0), 0))}
            </span>
            <span className="stat-text">Total Target</span>
          </div>
        </Card>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="goals-section">
        <h3>Your Goals</h3>
        {isLoading ? (
          <div className="loading-state">
            <p>Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="goals-grid">
            <Card className="empty-goal-card">
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Start your savings journey by creating your first goal."
                action={
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    Create Goal
                  </Button>
                }
              />
            </Card>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => (
              <Card
                key={goal._id} // ✅ FIXED
                className="goal-card"
                onClick={() => navigate(`/goals/${goal._id}`)} // ✅ FIXED
              >
                <div className="goal-card-header">
                  <div className="goal-card-icon">
                    <Target size={20} />
                  </div>
                  <span className="goal-frequency-badge">{goal.saving_frequency}</span>
                </div>
                <div className="goal-card-body">
                  <div className="goal-amounts">
                    <div className="goal-saved">
                      <span className="amount-label">Saved</span>
                      <span className="amount-value">{formatAmount(goal.saved_amount || 0)}</span>
                    </div>
                    <div className="goal-target">
                      <span className="amount-label">Target</span>
                      <span className="amount-value">{formatAmount(goal.target_amount)}</span>
                    </div>
                  </div>

                  <div className="goal-progress-section">
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${calculateProgress(goal)}%` }}
                      ></div>
                    </div>
                    <span className="goal-progress-text">{calculateProgress(goal)}%</span>
                  </div>

                  <div className="goal-deadline">
                    <Calendar size={14} />
                    <span>Deadline: {formatDate(goal.deadline)}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={(e) => openAddSavings(e, goal._id)} // ✅ FIXED
                  >
                    + Add Contribution
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Create New Goal</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleCreateGoal} className="modal-form">

              <Input
                label="Target Amount"
                type="number"
                name="target_amount"
                value={formData.target_amount}
                onChange={handleChange}
                required
              />

              <Input
                label="Deadline"
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={todayMin}
                required
              />

              <Select
                label="Saving Frequency"
                name="saving_frequency"
                options={createFrequencyOptions}
                value={formData.saving_frequency}
                onChange={handleChange}
                required
              />

              <div className="modal-actions">
                <Button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Goal
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add Savings Modal */}
      {showAddSavings && (
        <div className="modal-overlay" onClick={() => setShowAddSavings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Contribution</h3>
              <button className="modal-close" onClick={() => setShowAddSavings(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSavings} className="modal-form">
              <Input
                label="Amount (₹)"
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                placeholder="e.g. 500"
                autoFocus
                required
              />
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setShowAddSavings(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalsListPage
