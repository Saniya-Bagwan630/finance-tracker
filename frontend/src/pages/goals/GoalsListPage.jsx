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

const frequencyOptions = [
  { value: '', label: 'Select frequency' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function GoalsListPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    target_amount: '',
    deadline: '',
    saving_frequency: '',
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Savings Modal State
  const [showAddSavings, setShowAddSavings] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [savingsAmount, setSavingsAmount] = useState('')

  const openAddSavings = (e, goalId) => {
    e.stopPropagation()
    setSelectedGoalId(goalId)
    setShowAddSavings(true)
  }

  const handleAddSavings = async (e) => {
    e.preventDefault()
    if (!savingsAmount) return

    try {
      // Import api if not fully imported? No, goalsAPI is imported. We need savingsAPI.
      // We will need to update imports or use fetch? existing api.js exports specific objects. 
      // check imports: import { goalsAPI } from ... 
      // Need to change import to: import { goalsAPI, savingsAPI } from ...

      // Assuming imports updated below.
      await savingsAPI.add({
        goal_id: selectedGoalId,
        amount: parseFloat(savingsAmount),
        date: new Date()
      })

      setSavingsAmount('')
      setShowAddSavings(false)
      fetchGoals()
    } catch (error) {
      console.error("Failed to add savings", error)
      alert("Failed to add savings.")
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
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!formData.target_amount || !formData.deadline || !formData.saving_frequency) {
      setFormError('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      await goalsAPI.create({
        target_amount: Number(formData.target_amount),
        deadline: formData.deadline,
        saving_frequency: formData.saving_frequency,
      })

      // Reset form and close modal
      setFormData({
        target_amount: '',
        deadline: '',
        saving_frequency: '',
      })
      setShowCreateModal(false)

      // Refresh goals list
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
    if (!goal.saved_amount || !goal.target_amount) return 0
    return Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100))
  }

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

      {/* Stats */}
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

      {/* Error State */}
      {error && <div className="form-error">{error}</div>}

      {/* Goals List */}
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
            {goals.map((goal, index) => (
              <Card
                key={goal.id || index}
                className="goal-card"
                onClick={() => navigate(`/goals/${goal.id || index}`)}
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
                    onClick={(e) => openAddSavings(e, goal.id || index)} // pass index if id missing (mock)
                  >
                    + Add Contribution
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Goal</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleCreateGoal} className="modal-form">
              <Input
                label="Target Amount (₹) *"
                type="number"
                name="target_amount"
                placeholder="e.g., 50000"
                icon={IndianRupee}
                value={formData.target_amount}
                onChange={handleChange}
                required
              />

              <Input
                label="Deadline *"
                type="date"
                name="deadline"
                icon={Calendar}
                value={formData.deadline}
                onChange={handleChange}
                required
              />

              <Select
                label="Saving Frequency *"
                name="saving_frequency"
                options={frequencyOptions}
                value={formData.saving_frequency}
                onChange={handleChange}
                required
              />

              <div className="modal-actions">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Goal'}
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