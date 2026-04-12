import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  IndianRupee, 
  Calendar, 
  FileText,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card'
import { Input, Select, Textarea } from '../../components/common/Input'
import Button from '../../components/common/Button'
import { expensesAPI } from '../../services/api'
import './ExpensePages.css'

const categories = [
  { value: '', label: 'Select a category' },
  { value: 'food', label: '🍔 Food & Dining' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'bills', label: '📄 Bills & Utilities' },
  { value: 'health', label: '💊 Health' },
  { value: 'education', label: '📚 Education' },
  { value: 'other', label: '📦 Other' },
]

const sourceOptions = [
  { value: '', label: 'Select mode of payment' },
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Card', label: 'Card' },
]

function AddExpensePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'manual',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.amount || !formData.category || !formData.date) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      await expensesAPI.add({
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        mode: formData.source || 'manual',
      })
      
      setSuccess('Expense added successfully!')
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'manual',
      })
      
      // Redirect to history after short delay
      setTimeout(() => {
        navigate('/expenses/history')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to add expense. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/expenses/history')
  }

  return (
    <div className="expense-page animate-fade-in">
      <div className="expense-page-header">
        <div>
          <h2>Add New Expense</h2>
          <p>Track your spending by adding expense details</p>
        </div>
      </div>

      <div className="expense-form-container">
        <Card className="expense-form-card">
          <CardContent>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <form className="expense-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <Input
                  label="Amount (₹) *"
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  icon={IndianRupee}
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Category *"
                  name="category"
                  options={categories}
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <Input
                  label="Date *"
                  type="date"
                  name="date"
                  icon={Calendar}
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Mode of Payment"
                  name="mode"
                  options={sourceOptions}
                  value={formData.source}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="quick-tips-card">
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tips-list">
              <div className="tip-item">
                <div className="tip-number">1</div>
                <div className="tip-content">
                  <h4>Be Accurate</h4>
                  <p>Enter the exact amount spent for better tracking.</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-number">2</div>
                <div className="tip-content">
                  <h4>Use Categories</h4>
                  <p>Proper categorization helps track spending patterns.</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-number">3</div>
                <div className="tip-content">
                  <h4>Track Daily</h4>
                  <p>Log expenses daily for accurate monthly summaries.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AddExpensePage