import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  PlusCircle,
  History,
  PieChart,
  ListChecks,
  Calendar,
  BarChart3,
  ChevronDown,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from './BrandLogo'
import './Sidebar.css'

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Transactions',
    icon: Receipt,
    children: [
      { label: 'Add Expense', icon: PlusCircle, path: '/expenses/add' },
      { label: 'Add Income', icon: PlusCircle, path: '/income/add' },
      { label: 'History', icon: History, path: '/expenses/history' },
      { label: 'Analytics', icon: PieChart, path: '/expenses/analytics' },
      { label: 'Budgets', icon: Target, path: '/expenses/budgets' },
    ],
  },
  {
    label: 'Goals & Savings',
    icon: Target,
    children: [
      { label: 'My Goals', icon: Target, path: '/goals' },
      { label: 'Savings Plan', icon: ListChecks, path: '/goals/checklist' },
    ],
  },
  {
    label: 'Insights',
    icon: TrendingUp,
    children: [
      { label: 'Weekly Summary', icon: Calendar, path: '/insights/weekly' },
      { label: 'Monthly Insights', icon: BarChart3, path: '/insights/monthly' },
    ],
  },
]

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState(['Transactions', 'Goals & Savings', 'Insights'])

  const toggleExpand = (label) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isParentActive = (children) => children?.some(child => location.pathname === child.path)

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <BrandLogo />
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.label} className="nav-item">
                {item.children ? (
                  <>
                    <button
                      className={`nav-link nav-parent ${isParentActive(item.children) ? 'active' : ''}`}
                      onClick={() => toggleExpand(item.label)}
                    >
                      <item.icon size={20} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={`nav-chevron ${expandedItems.includes(item.label) ? 'expanded' : ''}`}
                      />
                    </button>
                    <ul className={`nav-children ${expandedItems.includes(item.label) ? 'expanded' : ''}`}>
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) => `nav-link nav-child ${isActive ? 'active' : ''}`}
                            onClick={handleNavClick}
                          >
                            <child.icon size={16} className="nav-icon" />
                            <span className="nav-label">{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <item.icon size={20} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-type">{user?.occupation || 'Student'}</span>
              <span className="user-greeting">Glad to see you back.</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
