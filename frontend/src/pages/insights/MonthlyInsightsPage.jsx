import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Target,
  Download,
  Loader2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import Button from '../../components/common/Button'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api, { dashboardAPI } from '../../services/api'
import './InsightPages.css'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const toMonthInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const toApiDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMonthRange = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  return {
    startDate: toApiDate(start),
    endDate: toApiDate(end),
    label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
}

function MonthlyInsightsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue(new Date()))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInsights()
  }, [selectedMonth])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError('')
      const { startDate, endDate } = getMonthRange(selectedMonth)
      const response = await api.expenses.summary({ startDate, endDate })
      // response format: { success, weekly_total, monthly_total, by_category }
      if (response.success) {
        setData(response)
        const chart = Object.entries(response.by_category || {}).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })).sort((a, b) => b.value - a.value);
        setChartData(chart);

        // Fetch Total Saved from goal contributions only.
        const dashSum = await dashboardAPI.summary()

        setData(prev => ({
          ...prev,
          totalSaved: dashSum.total_saved || 0
        }));
      }
    } catch (error) {
      setError(error.message || 'Unable to load monthly insights right now.')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!data || !chartData.length) return alert('No data to export');

    // Simple CSV export
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Amount (INR)\n";

    chartData.forEach(row => {
      csvContent += `${row.name},${row.value}\n`;
    });

    csvContent += `Total Monthly Spending,${data.monthly_total}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "monthly_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  const selectedMonthRange = getMonthRange(selectedMonth)

  // Find max category for "Most Spent"
  let mostSpentCategory = "None";
  let mostSpentAmount = 0;

  if (data?.by_category) {
    Object.entries(data.by_category).forEach(([cat, amount]) => {
      if (amount > mostSpentAmount) {
        mostSpentAmount = amount;
        mostSpentCategory = cat;
      }
    });
  }

  return (
    <div className="insights-page animate-fade-in">
      <div className="insights-header">
        <div>
          <h2>Monthly Insights</h2>
          <p>Deep dive into your monthly financial patterns</p>
        </div>
        <div className="header-actions">
          <div className="month-navigation">
            <input
              type="month"
              className="month-label"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              aria-label="Select month"
            />
          </div>
          <Button variant="outline" icon={Download} size="sm" onClick={exportReport}>
            Export Report
          </Button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Monthly Overview */}
      <div className="monthly-overview">
        <Card className="overview-main-card">
          <div className="overview-main">
            <div className="overview-section">
              <h3>Total Spending</h3>
              <span className="overview-amount">
                ₹ {data?.monthly_total?.toLocaleString() || 0}
              </span>
              <span className="overview-change neutral">
                <TrendingUp size={14} />
                vs last month
              </span>
            </div>
            <div className="overview-divider"></div>
            <div className="overview-section">
              <h3>Weekly Spending</h3>
              <span className="overview-amount saved">
                ₹ {data?.weekly_total?.toLocaleString() || 0}
              </span>
              <span className="overview-change neutral">
                Last 7 days
              </span>
            </div>
            <div className="overview-divider"></div>
            <div className="overview-section">
              <h3>Total Saved</h3>
              <span className="overview-amount success">
                ₹ {data?.totalSaved?.toLocaleString() || 0}
              </span>
              <span className="overview-change neutral">
                Goal contributions
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="insights-grid monthly-grid">
        {/* Category Distribution */}
        <Card className="distribution-card">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 220, width: '100%' }}>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center pt-20">No data</p>
              )}
            </div>

            <div className="distribution-stats mt-4">
              <div className="space-y-2">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                      {item.name}
                    </span>
                    <span className="font-medium">₹ {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="distribution-stats border-t mt-4 pt-4">
              <div className="dist-stat">
                <span className="dist-label">Most Spent</span>
                <span className="dist-value">{mostSpentCategory}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="goals-progress-card">
          <CardHeader>
            <CardTitle>Goals Progress This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="goals-progress-placeholder">
              <div className="goal-progress-item">
                <div className="goal-progress-header">
                  <Target size={16} />
                  <span>Check Goals Page</span>
                </div>
              </div>
              <Link to="/goals" className="block w-full">
                <Button variant="outline" className="w-full mt-2">
                  View Goals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* AI Monthly Report */}
        <Card className="monthly-report-card">
          <CardHeader>
            <CardTitle>AI Monthly Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="monthly-report">
              <div className="report-section">
                <h4>📈 Spending Summary</h4>
                <p>
                  You have spent ₹{data?.monthly_total} in {selectedMonthRange.label}.
                  {mostSpentAmount > 0
                    ? ` Your highest spending category is ${mostSpentCategory}.`
                    : " Start tracking to see insights."}
                </p>
              </div>
              <div className="report-section">
                <h4>💡 Recommendations</h4>
                <p>AI-powered suggestions coming soon based on your {mostSpentCategory} spending.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MonthlyInsightsPage
