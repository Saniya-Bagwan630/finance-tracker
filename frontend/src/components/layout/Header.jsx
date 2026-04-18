import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from './BrandLogo';
import './Header.css';

function Header({ title, onMenuClick }) {
  const { logout, isAuthenticated, user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="header-title-group">
          <BrandLogo compact />
          <div className="header-copy">
            <h1 className="page-title">{title}</h1>
            {isAuthenticated && <p className="page-greeting">Welcome back, {firstName}</p>}
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="header-right">
          <div className="header-user-pill">
            <span className="header-user-pill__avatar">{firstName.charAt(0).toUpperCase()}</span>
            <span className="header-user-pill__name">{user?.name || 'User'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
