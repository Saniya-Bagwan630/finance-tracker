import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.css'

const pageTitles = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/expenses/add': 'Add Expense',
  '/expenses/history': 'Expense History',
  '/expenses/analytics': 'Category Analytics',
  '/goals': 'My Goals',
  '/goals/checklist': 'Savings Plan',
  '/insights/weekly': 'Weekly Summary',
  '/insights/monthly': 'Monthly Insights',
  '/chat': 'AI Assistant',
}

function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const getTitle = () => {
    if (location.pathname.startsWith('/goals/') && location.pathname !== '/goals/checklist') {
      return 'Goal Details'
    }
    return pageTitles[location.pathname] || 'Dashboard'
  }

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header 
          title={getTitle()} 
          onMenuClick={openSidebar} 
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout