import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { useAuth } from '../../context/AuthContext'
import { useChat } from "../../components/chat/ChatContext";
import './GoalPages.css'

const weeklyTasks = [
  { id: 1, title: 'Review weekly spending', done: false },
  { id: 2, title: 'Transfer to savings', done: false },
  { id: 3, title: 'Check goal progress', done: false },
  { id: 4, title: 'Log any cash expenses', done: false },
]

const monthlyTasks = [
  { id: 1, title: 'Review budget vs actual', done: false },
  { id: 2, title: 'Update income if changed', done: false },
  { id: 3, title: 'Adjust savings goals', done: false },
  { id: 4, title: 'Review subscriptions', done: false },
]

function SavingsChecklistPage() {
  const { user } = useAuth()
  const { lastAnalysis } = useChat()
  const [weeklyState, setWeekly] = useState(weeklyTasks)
  const [monthlyState, setMonthly] = useState(monthlyTasks)

  const toggleWeekly = (id) => {
    setWeekly(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const toggleMonthly = (id) => {
    setMonthly(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const completedWeekly = weeklyState.filter(t => t.done).length
  const completedMonthly = monthlyState.filter(t => t.done).length

  return (
    <div className="checklist-page animate-fade-in">
      <div className="checklist-header">
        <div>
          <h2>Savings Plan</h2>
          <p>Your personalized checklist to build better savings habits</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="checklist-overview">
        <Card className="overview-card">
          <div className="overview-icon">
            <Target size={24} />
          </div>
          <div className="overview-content">
            <span className="overview-value">{completedWeekly} / {weeklyState.length}</span>
            <span className="overview-label">Weekly Tasks</span>
          </div>
          <div className="overview-progress">
            <div className="mini-progress-bar">
              <div className="mini-progress-fill" style={{ width: `${(completedWeekly / weeklyState.length) * 100}%` }}></div>
            </div>
          </div>
        </Card>

        <Card className="overview-card">
          <div className="overview-icon">
            <Calendar size={24} />
          </div>
          <div className="overview-content">
            <span className="overview-value">{completedMonthly} / {monthlyState.length}</span>
            <span className="overview-label">Monthly Tasks</span>
          </div>
          <div className="overview-progress">
            <div className="mini-progress-bar">
              <div className="mini-progress-fill" style={{ width: `${(completedMonthly / monthlyState.length) * 100}%` }}></div>
            </div>
          </div>
        </Card>

        <Card className="overview-card">
          <div className="overview-icon overview-icon--success">
            <TrendingUp size={24} />
          </div>
          <div className="overview-content">
            <span className="overview-value">{user?.streak?.count || 0}</span>
            <span className="overview-label">Day Streak</span>
          </div>
        </Card>
      </div>

      <div className="checklist-grid">
        {/* Weekly Checklist */}
        <Card className="checklist-card">
          <CardHeader>
            <CardTitle>
              <Calendar size={18} />
              Weekly Checklist
            </CardTitle>
            <span className="checklist-badge">Resets Sunday</span>
          </CardHeader>
          <CardContent>
            <div className="tasks-list">
              {weeklyState.map((task) => (
                <label key={task.id} className="task-item cursor-pointer">
                  <div className={`task-checkbox ${task.done ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleWeekly(task.id)}
                      style={{ display: 'none' }}
                    />
                    {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <span className={`task-title ${task.done ? 'done' : ''}`}>
                    {task.title}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Checklist */}
        <Card className="checklist-card">
          <CardHeader>
            <CardTitle>
              <Calendar size={18} />
              Monthly Checklist
            </CardTitle>
            <span className="checklist-badge">Resets 1st</span>
          </CardHeader>
          <CardContent>
            <div className="tasks-list">
              {monthlyState.map((task) => (
                <label key={task.id} className="task-item cursor-pointer">
                  <div className={`task-checkbox ${task.done ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleMonthly(task.id)}
                      style={{ display: 'none' }}
                    />
                    {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <span className={`task-title ${task.done ? 'done' : ''}`}>
                    {task.title}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Tips */}
        <Card className="tips-card">
          <CardHeader>
            <CardTitle>
              <Lightbulb size={18} />
              Savings Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="savings-tips">
              <div className="tip-card-item">
                <div className="tip-emoji">🎯</div>
                <div className="tip-text">
                  <h4>50/30/20 Rule</h4>
                  <p>Allocate 50% to needs, 30% to wants, 20% to savings.</p>
                </div>
              </div>
              <div className="tip-card-item">
                <div className="tip-emoji">💰</div>
                <div className="tip-text">
                  <h4>Pay Yourself First</h4>
                  <p>Transfer savings immediately when you get paid.</p>
                </div>
              </div>
              <div className="tip-card-item">
                <div className="tip-emoji">📊</div>
                <div className="tip-text">
                  <h4>Track Everything</h4>
                  <p>Small expenses add up. Log everything to see patterns.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations — filled from chatbot analysis */}
        <Card className="ai-recommendations-card">
          <CardHeader>
            <CardTitle>
              <AlertCircle size={18} />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastAnalysis ? (
              <div className="ai-analysis-result">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🤖</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Based on your spending data
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-line',
                  margin: 0
                }}>
                  {lastAnalysis}
                </p>
              </div>
            ) : (
              <div className="recommendations-placeholder">
                <div className="ai-avatar">🤖</div>
                <p>Ask the chatbot <strong>"how can I save more?"</strong> or <strong>"where have I spent the most?"</strong> to get personalized recommendations here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SavingsChecklistPage