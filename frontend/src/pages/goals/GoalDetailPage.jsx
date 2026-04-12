import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Target,
  Plus,
  Edit2,
  Trash2,
  Clock,
  X
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import Button from '../../components/common/Button'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../../services/api'
import './GoalPages.css'

function GoalDetailPage() {
  const { id } = useParams()
  const [goalData, setGoalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddSavings, setShowAddSavings] = useState(false)
  const [amount, setAmount] = useState('')

  // Fetch Goal Progress
  const fetchGoalData = async () => {
    try {
      setLoading(true)
      const data = await api.goals.progress(id)
      setGoalData(data)
    } catch (error) {
      console.error("Failed to fetch goal", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoalData()
  }, [id])

  // Handle Add Savings
  const handleAddSavings = async (e) => {
    e.preventDefault()
    if (!amount) return

    try {
      await api.savings.add({
        goal_id: id,
        amount: parseFloat(amount),
        date: new Date()
      })
      // Refresh data and close modal
      setAmount('')
      setShowAddSavings(false)
      fetchGoalData()
    } catch (error) {
      console.error("Failed to add savings", error)
      alert("Failed to add savings. Please try again.")
    }
  }

  if (loading && !goalData) {
    return <div className="p-8 text-center">Loading goal details...</div>
  }

  if (!goalData) {
    return <div className="p-8 text-center">Goal not found.</div>
  }

  // Calculate percentage safely
  const percent = Math.min(
    Math.round((goalData.saved_so_far / goalData.target_amount) * 100),
    100
  )

  return (
    <div className="goal-detail-page animate-fade-in relative">
      <Link to="/goals" className="back-link">
        <ArrowLeft size={20} />
        <span>Back to Goals</span>
      </Link>

      <div className="goal-detail-header">
        <div className="goal-title-section">
          <div className="goal-icon-large">
            <Target size={28} />
          </div>
          <div>
            <h2>Goal Details</h2>
            <p className="goal-subtitle">Target: ₹{goalData.target_amount.toLocaleString()}</p>
          </div>
        </div>
        <div className="goal-actions">
          <Button variant="outline" icon={Edit2} size="sm">Edit</Button>
          <Button variant="danger" icon={Trash2} size="sm">Delete</Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="progress-card">
        <div className="progress-overview">
          <div className="progress-ring-placeholder">
            <div className="ring-center">
              <span className="ring-percent">{percent}%</span>
              <span className="ring-label">Complete</span>
            </div>
            {/* Simple SVG Ring could go here, but using placeholder style for now */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * percent) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="progress-stat-label">Target Amount</span>
              <span className="progress-stat-value">₹ {goalData.target_amount.toLocaleString()}</span>
            </div>
            <div className="progress-stat">
              <span className="progress-stat-label">Saved So Far</span>
              <span className="progress-stat-value saved">₹ {goalData.saved_so_far.toLocaleString()}</span>
            </div>
            <div className="progress-stat">
              <span className="progress-stat-label">Remaining</span>
              <span className="progress-stat-value">₹ {goalData.remaining.toLocaleString()}</span>
            </div>
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
        {/* Savings History Placeholder */}
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

      {/* Add Savings Modal Overlay */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
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