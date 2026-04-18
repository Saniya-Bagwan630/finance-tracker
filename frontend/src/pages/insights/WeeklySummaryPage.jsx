import { useState, useEffect } from 'react'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Target,
  Wallet
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { dashboardAPI, expensesAPI } from '../../services/api'
import './InsightPages.css'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

function WeeklySummaryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    totalSpent: 0,
    dailySpending: [],
    categoryBreakdown: []
  })

  // Calculate current week range
  const [currentDate, setCurrentDate] = useState(new Date())

  const getWeekRange = (date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay() + 1) // Monday
    const end = new Date(start)
    end.setDate(end.getDate() + 6) // Sunday

    // Format: "Dec 9 - Dec 15, 2024"
    const options = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
  }

  useEffect(() => {
    fetchWeeklyData()
  }, [currentDate])

  const fetchWeeklyData = async () => {
    setLoading(true)
    setError('')
    try {
      // Simulation of weekly fetch or using available APIs
      // In a real app, pass ?startDate=${...}&endDate=${...}
      const summary = await expensesAPI.summary()
      const expenses = await expensesAPI.list()
      // Fetch Dashboard Summary for Total Saved
      const dashSum = await dashboardAPI.summary()

      // Process for chart (mocking weekly filtering mostly, as backend is simple)
      const dailyData = [
        { name: 'Mon', amount: 0 },
        { name: 'Tue', amount: 0 },
        { name: 'Wed', amount: 0 },
        { name: 'Thu', amount: 0 },
        { name: 'Fri', amount: 0 },
        { name: 'Sat', amount: 0 },
        { name: 'Sun', amount: 0 },
      ]

      // Simple aggregation of expenses by day (using list)
      if (expenses && expenses.expenses) {
        expenses.expenses.forEach(exp => {
          const d = new Date(exp.date);
          const day = d.getDay();
          // Adjust for Mon-Sun (Mon=1 ... Sun=0 in JS) -> Array index 0-6
          const index = day === 0 ? 6 : day - 1;
          if (index >= 0 && index <= 6) {
            dailyData[index].amount += exp.amount;
          }
        })
      }

      // Process Categories
      let categories = [];
      if (summary?.by_category) {
        categories = Object.entries(summary.by_category).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })).sort((a, b) => b.value - a.value).slice(0, 5);
      }

      setData({
        totalSpent: summary?.weekly_total || 0,
        totalSaved: (dashSum.total_saved || 0) + (dashSum.total_income || 0),
        dailySpending: dailyData,
        categoryBreakdown: categories
      })

    } catch (err) {
      setError(err.message || 'Unable to load weekly insights right now.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="insights-page animate-fade-in">
      <div className="insights-header">
        <div>
          <h2>Weekly Summary</h2>
          <p>Your financial overview for this week</p>
        </div>
        <div className="week-navigation">
          <button className="nav-btn" onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 7);
            setCurrentDate(d);
          }}>
            <ArrowLeft size={18} />
          </button>
          <span className="week-label">{getWeekRange(currentDate)}</span>
          <button className="nav-btn" onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 7);
            setCurrentDate(d);
          }}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Weekly Stats */}
      <div className="weekly-stats">
        <Card className="weekly-stat-card">
          <div className="stat-header">
            <Wallet size={20} />
            <span>Total Spent</span>
          </div>
          <div className="stat-body">
            <span className="stat-amount">{loading ? '...' : formatAmount(data.totalSpent)}</span>
            <span className="stat-comparison neutral">
              <TrendingUp size={14} />
              This Week
            </span>
          </div>
        </Card>

        <Card className="weekly-stat-card">
          <div className="stat-header">
            <Target size={20} />
            <span>Daily Average</span>
          </div>
          <div className="stat-body">
            <span className="stat-amount">{loading ? '...' : formatAmount(data.totalSpent / 7)}</span>
            <span className="stat-comparison neutral">
              Per day
            </span>
          </div>
        </Card>

        <Card className="weekly-stat-card">
          <div className="stat-header">
            <Wallet size={20} />
            <span>Total Saved</span>
          </div>
          <div className="stat-body">
            <span className="stat-amount">{loading ? '...' : formatAmount(data.totalSaved)}</span>
            <span className="stat-comparison success">
              Income + Goals
            </span>
          </div>
        </Card>
      </div>

      <div className="insights-grid">
        {/* Daily Spending Chart */}
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 250, width: '100%' }}>
              {loading ? <p className="text-center pt-10 text-gray-400">Loading...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(value) => formatAmount(value)}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="breakdown-card">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 200, width: '100%' }}>
              {loading ? <p className="text-center pt-10 text-gray-400">Loading...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="breakdown-list mt-4">
              {data.categoryBreakdown.map((cat, index) => (
                <div key={cat.name} className="breakdown-item flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{formatAmount(cat.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Weekly Insights */}
        <Card className="ai-insights-card">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ai-insights-list">
              <div className="ai-insight-item">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <h4>Week Analysis</h4>
                  <p>You have spent <b>{formatAmount(data.totalSpent)}</b> this week. {data.totalSpent > 5000 ? "Use the insights to identify where you can save next week!" : "Great job keeping your expenses low!"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WeeklySummaryPage
