# FinanceAI - Personal Finance Platform Frontend

A web-based AI personal finance platform for students and first-time earners. This is the **Day 1 Frontend** implementation containing all page structures and navigation.

## 📁 Folder Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── FloatingChatbot.jsx    # Floating AI chat widget
│   │   │   └── FloatingChatbot.css
│   │   ├── common/
│   │   │   ├── Button.jsx             # Reusable button component
│   │   │   ├── Button.css
│   │   │   ├── Card.jsx               # Card container component
│   │   │   ├── Card.css
│   │   │   ├── EmptyState.jsx         # Empty state placeholder
│   │   │   ├── EmptyState.css
│   │   │   ├── Input.jsx              # Form inputs (Input, Select, Textarea)
│   │   │   ├── Input.css
│   │   │   ├── PlaceholderChart.jsx   # Chart placeholder component
│   │   │   └── PlaceholderChart.css
│   │   └── layout/
│   │       ├── AuthLayout.jsx         # Layout for auth pages
│   │       ├── AuthLayout.css
│   │       ├── Header.jsx             # Top navigation header
│   │       ├── Header.css
│   │       ├── MainLayout.jsx         # Main app layout with sidebar
│   │       ├── MainLayout.css
│   │       ├── Sidebar.jsx            # Navigation sidebar
│   │       └── Sidebar.css
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx          # User login
│   │   │   ├── SignupPage.jsx         # User registration
│   │   │   ├── OnboardingPage.jsx     # User type & income setup
│   │   │   └── AuthPages.css
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx      # Main dashboard
│   │   │   └── DashboardPage.css
│   │   ├── expenses/
│   │   │   ├── AddExpensePage.jsx     # Add new expense form
│   │   │   ├── ExpenseHistoryPage.jsx # View past expenses
│   │   │   ├── CategoryAnalyticsPage.jsx # Category breakdowns
│   │   │   └── ExpensePages.css
│   │   ├── goals/
│   │   │   ├── GoalsListPage.jsx      # List all savings goals
│   │   │   ├── GoalDetailPage.jsx     # Individual goal details
│   │   │   ├── SavingsChecklistPage.jsx # Savings plan/checklist
│   │   │   └── GoalPages.css
│   │   ├── insights/
│   │   │   ├── WeeklySummaryPage.jsx  # Weekly financial summary
│   │   │   ├── MonthlyInsightsPage.jsx # Monthly insights & reports
│   │   │   └── InsightPages.css
│   │   ├── ChatPage.jsx               # Full AI chat interface
│   │   └── ChatPage.css
│   ├── styles/
│   │   └── index.css                  # Global styles & CSS variables
│   ├── App.jsx                        # Main app with routing
│   └── main.jsx                       # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 📄 All Pages Created (Day 1)

### A. Auth & Onboarding
- ✅ `/login` - Login page
- ✅ `/signup` - Signup page  
- ✅ `/onboarding` - Basic onboarding (income range, student/earner selection)

### B. Home Dashboard
- ✅ `/` or `/dashboard` - Dashboard with placeholder cards for:
  - Monthly spend summary
  - Category breakdown
  - Active goals
  - AI alerts/insights

### C. Expense Tracker
- ✅ `/expenses/add` - Add Expense page (form only)
- ✅ `/expenses/history` - Expense History page
- ✅ `/expenses/analytics` - Category Analytics page (empty chart placeholders)

### D. Goals & Savings
- ✅ `/goals` - Goals List page
- ✅ `/goals/:id` - Goal Detail page
- ✅ `/goals/checklist` - Savings Checklist / Plan View page

### E. Chatbot Interface
- ✅ `/chat` - Full chat page
- ✅ Floating chatbot component (UI only, visible on all main pages)

### F. Insights & Reports
- ✅ `/insights/weekly` - Weekly Summary page
- ✅ `/insights/monthly` - Monthly Insights page

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🧱 Component Usage

### Button
```jsx
import Button from './components/common/Button'

<Button variant="primary" size="md" icon={Plus}>
  Add Expense
</Button>
```
Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Card
```jsx
import { Card, CardHeader, CardTitle, CardContent } from './components/common/Card'

<Card variant="elevated">
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input
```jsx
import { Input, Select, Textarea } from './components/common/Input'

<Input label="Email" type="email" placeholder="Enter email" icon={Mail} />
<Select label="Category" options={[{ value: 'food', label: 'Food' }]} />
<Textarea label="Notes" rows={4} />
```

## ⚠️ Day 1 Constraints

As per requirements, this implementation:
- ✅ Has proper routing across all pages
- ✅ Contains page titles and dummy sections/components
- ✅ Has clean component structure
- ❌ No API calls
- ❌ No business logic
- ❌ No hardcoded data (only placeholder text)

## 🛠️ Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Vite** - Build tool
- **Lucide React** - Icon library
- **CSS Variables** - Theming system