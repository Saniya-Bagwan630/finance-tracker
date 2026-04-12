import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Wallet, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { budgetsAPI, expensesAPI } from '../../services/api'
import './ExpensePages.css'

const displayLabels = {
  food: 'Food',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  billsUtilities: 'Bills & Utilities',
  health: 'Health',
  education: 'Education',
  other: 'Other',
}

const chartColors = {
  budget: '#2563eb',
  spent: '#ef4444',
}

function BudgetComparisonPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [budgetData, setBudgetData] = useState([])

  useEffect(() => {
    fetchBudgetComparison()
  }, [])

  const fetchBudgetComparison = async () => {
    setLoading(true)
    setError('')

    try {
      const [budgetRes, summaryRes] = await Promise.all([
        budgetsAPI.get(),
        expensesAPI.summary(),
      ])

      const budgets = budgetRes.budgets || {}
      const spentByCategory = summaryRes.by_category || {}
      const allKeys = Array.from(new Set([...Object.keys(budgets), ...Object.keys(spentByCategory)]))

      const transformed = allKeys.map((key) => {
        const budget = Number(budgets[key] || 0)
        const spent = Number(spentByCategory[key] || 0)
        const variance = budget - spent
        const percentSpent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0

        return {
          key,
          label: displayLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
          budget,
          spent,
          variance,
          percentSpent,
        }
      }).sort((a, b) => b.spent - a.spent)

      setBudgetData(transformed)
    } catch (err) {
      console.error('Budget comparison error:', err)
      setError('Failed to load budget comparison data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹ --'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalBudget = budgetData.reduce((sum, item) => sum + item.budget, 0)
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0)

  return (
    <div className="expense-page animate-fade-in">
      <div className="expense-page-header">
        <div>
          <h2>Budget vs Spending</h2>
          <p>Compare your monthly category budgets with actual spending.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="analytics-stats">
        <Card className="analytics-stat">
          <div className="stat-icon-sm stat-icon--primary">
            <Wallet size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Budget</span>
            <span className="stat-value">{loading ? '...' : formatAmount(totalBudget)}</span>
          </div>
        </Card>

        <Card className="analytics-stat">
          <div className="stat-icon-sm stat-icon--danger">
            <TrendingUp size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{loading ? '...' : formatAmount(totalSpent)}</span>
          </div>
        </Card>

        <Card className="analytics-stat">
          <div className="stat-icon-sm stat-icon--success">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Budget Used</span>
            <span className="stat-value">
              {loading ? '...' : `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`}
            </span>
          </div>
        </Card>

        <Card className="analytics-stat">
          <div className="stat-icon-sm stat-icon--warning">
            <ArrowRight size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Categories Tracked</span>
            <span className="stat-value">{loading ? '...' : budgetData.length}</span>
          </div>
        </Card>
      </div>

      <div className="analytics-grid">
        <Card className="chart-card col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Budget vs Spent by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 350, width: '100%' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
              ) : budgetData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData} margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `₹${value}`} />
                    <Tooltip formatter={(value) => formatAmount(value)} />
                    <Bar dataKey="budget" name="Budget" fill={chartColors.budget} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" fill={chartColors.spent} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No budget or spending data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="categories-card col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading data...</p>
            ) : budgetData.length > 0 ? (
              <div className="budget-category-list">
                {budgetData.map((item) => (
                  <div key={item.key} className="budget-category-item">
                    <div className="budget-category-row">
                      <span className="budget-category-name">{item.label}</span>
                      <span className={`budget-status ${item.spent > item.budget ? 'over' : 'under'}`}>
                        {item.spent > item.budget ? 'Over' : 'Within'}
                      </span>
                    </div>
                    <div className="budget-numbers">
                      <span>{formatAmount(item.spent)}</span>
                      <span>{formatAmount(item.budget)}</span>
                    </div>
                    <div className="budget-progress-bar">
                      <div
                        className="budget-progress-fill"
                        style={{ width: `${item.percentSpent}%`, background: item.spent > item.budget ? chartColors.spent : chartColors.budget }}
                      />
                    </div>
                    <div className="budget-meta">
                      {item.budget > 0 ? `${item.percentSpent}% of budget used` : 'No budget set'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No budget categories found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BudgetComparisonPage
