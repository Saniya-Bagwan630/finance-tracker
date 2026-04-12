import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Target,
  Bell,
  ArrowRight,
  Wallet,
  ShoppingBag,
  Coffee,
  Car,
  Utensils,
  Film,
  FileText,
  Heart,
  GraduationCap,
  Package,
  X
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts' // Recharts
import Button from '../../components/common/Button' // Use common Button
import { expensesAPI, goalsAPI } from '../../services/api'
import './DashboardPage.css'

const categoryIcons = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  bills: FileText,
  health: Heart,
  education: GraduationCap,
  other: Package,
}

// Chart Colors
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#64748b'];

function DashboardPage() {
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [goals, setGoals] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // New Income State Logic Removed


  const [balance, setBalance] = useState({ account: 0, cash: 0 })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [summaryData, goalsData, expensesData] = await Promise.all([
        expensesAPI.summary().catch(() => null),
        goalsAPI.list().catch(() => ({ goals: [] })),
        expensesAPI.list().catch(() => ({ expenses: [] })),
      ])

      // Fetch Dashboard Balance (New Route needed or modify summary)
      // Since we updated dashboard.routes.js /summary, let's use that if we were calling it.
      // But here we call expensesAPI.summary().
      // Let's call the new dashboard summary route if possible, or just fetch user details.
      // For now, let's assume expensesAPI.summary() was updated? No, I updated dashboard.routes.js which is likely called by dashboardAPI.summary() or similar.
      // Let's check api.js to see what expensesAPI.summary calls.

      // Temporary fix: Call the dashboard summary route directly or via api
      const dashboardRes = await fetch('http://localhost:5000/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const dashboardData = await dashboardRes.json();

      setBalance(dashboardData.balance || { account: 0, cash: 0 })
      setSummary(summaryData)
      setGoals(goalsData.goals || goalsData || [])

      const expenses = expensesData.expenses || expensesData || []
      setRecentExpenses(expenses.slice(0, 5))
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // handleAddIncome Removed


  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹ --'
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
    })
  }

  const getCategoryIcon = (category) => {
    const IconComponent = categoryIcons[category] || Package
    return <IconComponent size={18} />
  }

  const calculateGoalProgress = (goal) => {
    if (!goal.saved_amount || !goal.target_amount) return 0
    return Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100))
  }

  const totalSaved = goals.reduce((sum, g) => sum + (g.saved_amount || 0), 0)

  // Prepare Chart Data
  const chartData = summary?.by_category
    ? Object.entries(summary.by_category).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="dashboard animate-fade-in relative">
      <div className="dashboard-welcome">
        <div>
          <h2>Welcome back! 👋</h2>
          <p>Here's your financial overview</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Fix Button Styling: Use standard Button component if possible or match classes */}
          <button
            onClick={() => setShowAddIncome(true)}
            className="quick-add-btn"
            style={{ backgroundColor: '#10b981', border: 'none', color: 'white' }}
          >
            <span>+ Add Income</span>
          </button>
          <Link to="/expenses/add" className="quick-add-btn">
            <span>+ Add Expense</span>
          </Link>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon stat-icon--primary">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Balance</span>
            <span className="stat-value">
              {isLoading ? '...' : formatAmount((balance.account || 0) + (balance.cash || 0))}
            </span>
            <div className="flex gap-2 text-xs text-gray-500 mt-1">
              <span>Acc: {formatAmount(balance.account || 0)}</span>
              <span>•</span>
              <span>Cash: {formatAmount(balance.cash || 0)}</span>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon stat-icon--success">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Saved</span>
            <span className="stat-value">
              {isLoading ? '...' : formatAmount(totalSaved)}
            </span>
            <span className="stat-change neutral">
              {goals.length} active goal{goals.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon stat-icon--warning">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Monthly Spend</span>
            <span className="stat-value">
              {isLoading ? '...' : formatAmount(summary?.total_spent || summary?.monthly_total || 0)}
            </span>
            <span className="stat-change neutral">This month</span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <Link to="/expenses/analytics" className="card-link">
              View All <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            <div style={{ height: 220, width: '100%', display: 'flex', justifyContent: 'center' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatAmount(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data available
                </div>
              )}
            </div>

            {/* Dynamic Legend */}
            <div className="mt-4 text-xs">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between py-1 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="capitalize text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold">{formatAmount(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="goals-card">
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <Link to="/goals" className="card-link">
              View All <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="goals-placeholder">
              {isLoading ? (
                <p className="loading-text">Loading goals...</p>
              ) : goals.length === 0 ? (
                <>
                  <div className="goal-item-placeholder">
                    <div className="goal-icon">
                      <Target size={20} />
                    </div>
                    <div className="goal-info">
                      <span className="goal-name">No goals yet</span>
                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    <span className="goal-percent">0%</span>
                  </div>
                  <Link to="/goals" className="add-goal-link">
                    + Create New Goal
                  </Link>
                </>
              ) : (
                <>
                  {goals.slice(0, 2).map((goal, index) => (
                    <div key={goal.id || index} className="goal-item-placeholder">
                      <div className="goal-icon active">
                        <Target size={20} />
                      </div>
                      <div className="goal-info">
                        <span className="goal-name">
                          {formatAmount(goal.target_amount)} Goal
                        </span>
                        <div className="goal-progress-bar">
                          <div
                            className="goal-progress-fill"
                            style={{ width: `${calculateGoalProgress(goal)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="goal-percent">{calculateGoalProgress(goal)}%</span>
                    </div>
                  ))}
                  <Link to="/goals" className="add-goal-link">
                    + Create New Goal
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="expenses-card">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <Link to="/expenses/history" className="card-link">
              View All <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="expenses-placeholder">
              {isLoading ? (
                <p className="loading-text">Loading expenses...</p>
              ) : recentExpenses.length === 0 ? (
                <div className="expense-item-placeholder">
                  <div className="expense-icon">
                    <Coffee size={18} />
                  </div>
                  <div className="expense-info">
                    <span className="expense-name">No expenses yet</span>
                    <span className="expense-date">Start tracking today</span>
                  </div>
                  <span className="expense-amount">--</span>
                </div>
              ) : (
                recentExpenses.map((expense, index) => (
                  <div key={expense.id || index} className="expense-item-placeholder">
                    <div className="expense-icon">
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div className="expense-info">
                      <span className="expense-name">
                        {expense.category?.charAt(0).toUpperCase() + expense.category?.slice(1)}
                      </span>
                      <span className="expense-date">{formatDate(expense.date)}</span>
                    </div>
                    <span className="expense-amount">{formatAmount(expense.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="alerts-card">
          <CardHeader>
            <CardTitle>
              <Bell size={18} />
              Tips & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="alerts-placeholder">
              <div className="alert-item">
                <div className="alert-dot alert-dot--info"></div>
                <div className="alert-content">
                  <span className="alert-title">Track Daily</span>
                  <span className="alert-desc">Log your expenses daily for better insights.</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot alert-dot--success"></div>
                <div className="alert-content">
                  <span className="alert-title">Set Goals</span>
                  <span className="alert-desc">Create savings goals to stay motivated.</span>
                </div>
              </div>
              {goals.length > 0 && (
                <div className="alert-item">
                  <div className="alert-dot alert-dot--warning"></div>
                  <div className="alert-content">
                    <span className="alert-title">Keep Going!</span>
                    <span className="alert-desc">You have {goals.length} active goal{goals.length !== 1 ? 's' : ''}.</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}

export default DashboardPage