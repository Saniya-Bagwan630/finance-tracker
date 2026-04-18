import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Target,
  Plus,
  Edit2,
  Trash2,
  Clock,
  X,
  Flame
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import './GoalPages.css'

const toPercent = (value) => {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(100, Math.round(value * 100))
}

const getFrequencyProgressLabel = (frequency) => {
  if (!frequency) return 'Progress'
  return `${frequency.charAt(0).toUpperCase()}${frequency.slice(1)} Progress`
}

function GoalDetailPage() {
  const { id } = useParams()
  const [goalData, setGoalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddSavings, setShowAddSavings] = useState(false)
  const [amount, setAmount] = useState('')

  const fetchGoalData = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.goals.progress(id)
      const listData = await api.goals.list()
      const goalMeta = (listData.goals || listData || []).find((goal) => goal._id === id)
      setGoalData({
        ...goalMeta,
        ...data,
      })
    } catch (error) {
      setError(error.message || 'Failed to load goal details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoalData()
  }, [id])

  const handleAddSavings = async (e) => {
    e.preventDefault()
    if (!amount) return

    try {
      await api.savings.add({
        goal_id: id,
        amount: parseFloat(amount),
        date: new Date()
      })
      setAmount('')
      setShowAddSavings(false)
      fetchGoalData()
    } catch (error) {
      setError(error.message || 'Failed to add savings. Please try again.')
    }
  }

  if (loading && !goalData) {
    return <div className="p-8 text-center">Loading goal details...</div>
  }

  if (!goalData) {
    return <div className="p-8 text-center">Goal not found.</div>
  }

  const overallPercent = toPercent(goalData.overallProgress ?? (goalData.saved_so_far / goalData.target_amount))
  const frequencyPercent = toPercent(goalData.frequencyProgress ?? 0)

  return (
    <div className="goal-detail-page animate-fade-in relative">
      <Link to="/goals" className="back-link">
        <ArrowLeft size={20} />
        <span>Back to Goals</span>
      </Link>

      {error && <div className="form-error">{error}</div>}

      <div className="goal-detail-header">
        <div className="goal-title-section">
          <div className="goal-icon-large">
            <Target size={28} />
          </div>
          <div>
            <h2>Goal Details</h2>
            <p className="goal-subtitle">Target: Rs {goalData.target_amount.toLocaleString()}</p>
            <div className="goal-detail-streak">
              <Flame size={16} />
              <span>{goalData.streakCount || 0} streak</span>
            </div>
          </div>
        </div>
        <div className="goal-actions">
          <Button variant="outline" icon={Edit2} size="sm">Edit</Button>
          <Button variant="danger" icon={Trash2} size="sm">Delete</Button>
        </div>
      </div>

      <Card className="progress-card">
        <div className="progress-stats progress-stats--detail">
          <div className="progress-stat">
            <span className="progress-stat-label">Target Amount</span>
            <span className="progress-stat-value">Rs {goalData.target_amount.toLocaleString()}</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-label">Saved So Far</span>
            <span className="progress-stat-value saved">Rs {goalData.saved_so_far.toLocaleString()}</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-label">Remaining</span>
            <span className="progress-stat-value">Rs {goalData.remaining.toLocaleString()}</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-label">{getFrequencyProgressLabel(goalData.saving_frequency)}</span>
            <span className="progress-stat-value progress-stat-value--secondary">{frequencyPercent}%</span>
          </div>
        </div>

        <div className="detail-progress-stack">
          <div className="detail-progress-row">
            <div className="detail-progress-head">
              <span>Overall Progress</span>
              <span>{overallPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={overallPercent}
              disabled
              readOnly
              aria-label="Overall progress"
              className="goal-progress-slider goal-progress-slider--large"
            />
          </div>

          <div className="detail-progress-row">
            <div className="detail-progress-head">
              <span>{getFrequencyProgressLabel(goalData.saving_frequency)}</span>
              <span>{frequencyPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={frequencyPercent}
              disabled
              readOnly
              aria-label="Frequency progress"
              className="goal-progress-slider goal-progress-slider--secondary goal-progress-slider--large"
            />
          </div>
        </div>

        <div className="progress-footer">
          <div className="deadline-info">
            <Clock size={16} />
            <span>Keep going! You're doing great.</span>
          </div>
          <Button icon={Plus} size="sm" onClick={() => setShowAddSavings(true)}>
            Add Contribution
          </Button>
        </div>
      </Card>

      <div className="goal-detail-grid">
        <Card className="history-card">
          <CardHeader><CardTitle>Savings History</CardTitle></CardHeader>
          <CardContent>
            <div className="history-list">
              <div className="history-empty">
                <p>Detailed history chart coming shortly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddSavings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-fade-in mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Savings</h3>
              <button onClick={() => setShowAddSavings(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSavings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. 500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddSavings(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalDetailPage
