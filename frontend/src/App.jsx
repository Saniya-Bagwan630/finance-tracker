import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Layout Components
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import OnboardingPage from './pages/auth/OnboardingPage'

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage'

// Expense Pages
import AddExpensePage from './pages/expenses/AddExpensePage'
import AddIncomePage from './pages/income/AddIncomePage'
import ExpenseHistoryPage from './pages/expenses/ExpenseHistoryPage'
import CategoryAnalyticsPage from './pages/expenses/CategoryAnalyticsPage'
import BudgetComparisonPage from './pages/expenses/BudgetComparisonPage'

// Goals Pages
import GoalsListPage from './pages/goals/GoalsListPage'
import GoalDetailPage from './pages/goals/GoalDetailPage'
import SavingsChecklistPage from './pages/goals/SavingsChecklistPage'

// Insights Pages
import WeeklySummaryPage from './pages/insights/WeeklySummaryPage'
import MonthlyInsightsPage from './pages/insights/MonthlyInsightsPage'

// Chat Page
import ChatPage from './pages/ChatPage'

// Floating Chatbot Component
// Floating Chatbot Component
import FloatingChatbot from './components/chat/FloatingChatbot'
import { ChatProvider } from './components/chat/ChatContext'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          {/* Auth Routes - No sidebar, no protection */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Protected Routes - With sidebar */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Expense Routes */}
            <Route path="/expenses/add" element={<AddExpensePage />} />
            <Route path="/income/add" element={<AddIncomePage />} />
            <Route path="/expenses/history" element={<ExpenseHistoryPage />} />
            <Route path="/expenses/analytics" element={<CategoryAnalyticsPage />} />
            <Route path="/expenses/budgets" element={<BudgetComparisonPage />} />

            {/* Goals Routes */}
            <Route path="/goals" element={<GoalsListPage />} />
            <Route path="/goals/:id" element={<GoalDetailPage />} />
            <Route path="/goals/checklist" element={<SavingsChecklistPage />} />

            {/* Insights Routes */}
            <Route path="/insights/weekly" element={<WeeklySummaryPage />} />
            <Route path="/insights/monthly" element={<MonthlyInsightsPage />} />

            {/* Chat Route */}
            <Route path="/chat" element={<ChatPage />} />
          </Route>
        </Routes>

        {/* Floating Chatbot - Shows on all pages except auth and full chat */}
        <FloatingChatbot />
      </ChatProvider>
    </AuthProvider>
  )
}

export default App