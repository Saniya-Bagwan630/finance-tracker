import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  Coffee,
  ShoppingBag,
  Car,
  Film,
  Utensils,
  Heart,
  GraduationCap,
  FileText,
  Package,
  Plus
} from 'lucide-react'
import { Card } from '../../components/common/Card'
import { Input, Select } from '../../components/common/Input'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { expensesAPI, incomeAPI } from '../../services/api'
import './ExpensePages.css'

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

const filterOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
]

function ExpenseHistoryPage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, categoryFilter])

  /* Combined fetch logic */
  const fetchExpenses = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [expRes, incRes] = await Promise.all([
        expensesAPI.list().catch(() => ({ expenses: [] })),
        incomeAPI.list().catch(() => ({ incomes: [] }))
      ])

      const expList = (expRes.expenses || expRes || []).map(e => ({ ...e, type: 'expense' }));
      const incList = (incRes.incomes || []).map(i => ({ ...i, type: 'income', category: 'Income', source: i.source }));

      const combined = [...expList, ...incList].sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(combined)
    } catch (err) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const filterExpenses = () => {
    let filtered = [...expenses]

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter || (categoryFilter === 'income' && item.type === 'income'))
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.category?.toLowerCase().includes(term) ||
        item.source?.toLowerCase().includes(term)
      )
    }

    setFilteredExpenses(filtered)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatAmount = (amount, type) => {
    const val = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
    return type === 'income' ? `+ ${val}` : `- ${val}`
  }

  const getCategoryIcon = (category) => {
    const IconComponent = categoryIcons[category] || Package
    return <IconComponent size={18} />
  }

  return (
    <div className="expense-page animate-fade-in">
      <div className="expense-page-header">
        <div>
          <h2>Expense History</h2>
          <p>View and manage all your past expenses</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/expenses/add')}>
          Add Expense
        </Button>
      </div>

      <Card className="expense-history-card">
        <div className="history-filters">
          <div className="search-filter">
            <Input
              placeholder="Search expenses..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Select
              options={filterOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="form-error" style={{ margin: '1rem' }}>{error}</div>}

        <div className="expense-table-container">
          {isLoading ? (
            <div className="loading-state">
              <p>Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="No expenses found"
              description={expenses.length === 0
                ? "Start tracking your spending by adding your first expense."
                : "No expenses match your current filters."
              }
              action={
                expenses.length === 0 && (
                  <Button variant="primary" size="sm" onClick={() => navigate('/expenses/add')}>
                    Add Expense
                  </Button>
                )
              }
            />
          ) : (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Mode of Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense._id || index}>
                    <td>
                      <div className="expense-category-cell">
                        <div className={`expense-icon ${expense.type === 'income' ? 'bg-green-100 text-green-600' : ''}`}>
                          {expense.type === 'income' ? <Plus size={18} /> : getCategoryIcon(expense.category)}
                        </div>
                        <span className="category-name">
                          {expense.type === 'income' ? expense.source : (expense.category?.charAt(0).toUpperCase() + expense.category?.slice(1))}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(expense.date)}</td>
                    <td>
                      <span className="source-badge">
                        {expense.type === 'income' ? (expense.paymentMethod || 'Bonus') : (expense.source || 'manual')}
                      </span>
                    </td>
                    <td className={`amount-cell ${expense.type === 'income' ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                      {formatAmount(expense.amount, expense.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredExpenses.length > 0 && (
          <div className="table-footer">
            <span className="table-info">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ExpenseHistoryPage
