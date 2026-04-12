import { useState, useEffect } from 'react'
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { Select } from '../../components/common/Input'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { expensesAPI } from '../../services/api'
import './ExpensePages.css'

const timeOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
]

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#06b6d4', '#f97316'];

function CategoryAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      // Logic for time range can be added to API if supported, currently just fetching summary
      // Ideally pass ?range=${timeRange}
      const data = await expensesAPI.summary() // Assume this returns total & category breakdown
      setSummary(data)

      // Transform breakdown for charts
      if (data?.by_category) {
        const transformed = Object.entries(data.by_category).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          originalName: name
        })).sort((a, b) => b.value - a.value);
        setCategoryData(transformed)
      } else {
        setCategoryData([])
      }

    } catch (err) {
      setError('Failed to load analytics data')
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

  const totalSpent = summary?.total_spent || summary?.monthly_total || 0
  const avgPerCategory = categoryData.length > 0 ? totalSpent / categoryData.length : 0

  return (
    <div className="expense-page animate-fade-in">
      <div className="expense-page-header">
        <div>
          <h2>Category Analytics</h2>
          <p>Understand your spending patterns across categories</p>
        </div>
        {/* Placeholder for real time filter implementation */}
        <Select
          options={timeOptions}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-selector"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="analytics-stats">
        <Card className="analytics-stat">
          <div className="stat-icon-sm">
            <TrendingUp size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">
              {loading ? '...' : formatAmount(totalSpent)}
            </span>
          </div>
        </Card>
        <Card className="analytics-stat">
          <div className="stat-icon-sm">
            <PieChartIcon size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Categories Used</span>
            <span className="stat-value">{loading ? '...' : categoryData.length}</span>
          </div>
        </Card>
        <Card className="analytics-stat">
          <div className="stat-icon-sm">
            <BarChart3 size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Avg. per Category</span>
            <span className="stat-value">
              {loading ? '...' : formatAmount(avgPerCategory)}
            </span>
          </div>
        </Card>
        <Card className="analytics-stat">
          <div className="stat-icon-sm">
            <Calendar size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{loading ? '...' : (summary?.transaction_count || 0)}</span>
          </div>
        </Card>
      </div>

      <div className="analytics-grid">
        {/* Pie Chart */}
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 280, width: '100%' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category List */}
        <Card className="categories-card">
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading categories...</p>
            ) : categoryData.length > 0 ? (
              <div className="category-list">
                {categoryData.map((cat, index) => {
                  const percent = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
                  return (
                    <div key={cat.name} className="category-item">
                      <div className="category-color" style={{ background: COLORS[index % COLORS.length] }}></div>
                      <div className="category-info">
                        <div className="flex justify-between mb-1">
                          <span className="category-name">{cat.name}</span>
                          <span className="text-xs text-gray-500">{percent}%</span>
                        </div>
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{ width: `${percent}%`, background: COLORS[index % COLORS.length] }}
                          ></div>
                        </div>
                      </div>
                      <span className="category-amount">{formatAmount(cat.value)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No categories found</p>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Bar Chart */}
        <Card className="top-spending-card relative col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300, width: '100%' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatAmount(value)}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CategoryAnalyticsPage