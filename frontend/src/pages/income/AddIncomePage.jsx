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
import { incomeAPI } from '../../services/api'
import '../expenses/ExpensePages.css'

const sourceOptions = [
    { value: '', label: 'Select source' },
    { value: 'Salary', label: 'Salary' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Bonus', label: 'Bonus' },
    { value: 'Investment', label: 'Investment' },
    { value: 'Gift', label: 'Gift' },
    { value: 'Other', label: 'Other' },
]

function AddIncomePage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        amount: '',
        source: '',
        paymentMethod: 'Account',
        description: '',
        date: new Date().toISOString().split('T')[0],
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
        if (!formData.amount || !formData.date) {
            setError('Please fill in required fields')
            return
        }

        setIsLoading(true)

        try {
            await incomeAPI.add({
                amount: Number(formData.amount),
                source: formData.source || 'Other',
                paymentMethod: formData.paymentMethod,
                description: formData.description,
                date: formData.date
            })

            setSuccess('Income added successfully!')
            setFormData({
                amount: '',
                source: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
            })

            // Redirect to dashboard layout after short delay
            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)
        } catch (err) {
            setError(err.message || 'Failed to add income. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate('/dashboard')
    }

    return (
        <div className="expense-page animate-fade-in">
            <div className="expense-page-header">
                <div>
                    <h2>Add New Income</h2>
                    <p>Record your earnings and inflows</p>
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
                                <Input
                                    label="Source (e.g. Salary, Bonus)"
                                    type="text"
                                    name="source"
                                    placeholder="Source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    list="source-options"
                                />
                                <datalist id="source-options">
                                    {sourceOptions.map(opt => <option key={opt.value} value={opt.value} />)}
                                </datalist>
                            </div>

                            <div className="form-row">
                                <Select
                                    label="Payment Method *"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Account', label: 'Bank Account / UPI' },
                                        { value: 'Cash', label: 'Cash' }
                                    ]}
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
                            </div>

                            <div className="form-row">
                                <Textarea
                                    label="Description (Optional)"
                                    name="description"
                                    placeholder="Add notes about this income..."
                                    icon={FileText}
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <Button variant="outline" type="button" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isLoading ? 'Adding...' : 'Add Income'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default AddIncomePage
