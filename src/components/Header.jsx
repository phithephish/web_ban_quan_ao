import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Settings, ArrowLeft, LogIn, LogOut, FileText, User, Trash2 } from 'lucide-react';

export default function Header({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  cartCount,
  onCartClick,
  isAdminMode,
  setIsAdminMode,
  user,
  onLoginClick,
  onLogoutClick,
  onMyOrdersClick,
  onProfileClick,
  categories,
  onDeleteAccountClick,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleDropdownToggle = () => setShowUserDropdown(!showUserDropdown);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Dynamic category list from database
  const categoryNames = ['Tất cả', ...categories.map(c => c.name)];

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo-section">
          {isAdminMode ? (
            <button className="back-btn" onClick={() => setIsAdminMode(false)}>
              <ArrowLeft size={20} />
              <span>Quay lại Shop</span>
            </button>
          ) : (
            <a href="/" className="logo-text" onClick={(e) => { e.preventDefault(); setActiveCategory('Tất cả'); }}>
              <span className="logo-full">STUDIO / MINIMAL</span>
              <span className="logo-short">MINIMAL</span>
            </a>
          )}
        </div>

        {!isAdminMode && (
          <nav className="nav-categories">
            {categoryNames.map((category) => (
              <button
                key={category}
                className={`nav-link ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        )}

        <div className="header-actions">


          {/* User Auth Info / Dropdown */}
          {!isAdminMode && (
            <div className="user-auth-section">
              {user ? (
                <div className="user-profile-menu-container" ref={dropdownRef}>
                  <button 
                    className="user-menu-trigger" 
                    onClick={handleDropdownToggle}
                    title={`Chào, ${userName}`}
                  >
                    <div className="user-avatar-circle">
                      <User size={16} />
                    </div>
                  </button>
                  
                  {showUserDropdown && (
                    <div className="user-dropdown-menu animate-fade-in">
                      <div className="dropdown-user-info">
                        <strong>{userName}</strong>
                        <span>{user.email}</span>
                      </div>
                     <hr className="dropdown-divider" />
                      {user.email === 'admin@gmail.com' && (
                        <button 
                          className="dropdown-item" 
                          onClick={() => {
                            setIsAdminMode(!isAdminMode);
                            setShowUserDropdown(false);
                          }}
                          style={{ fontWeight: '600', color: 'var(--accent-color)' }}
                        >
                          <Settings size={16} />
                          <span>{isAdminMode ? 'Quay lại Cửa hàng' : 'Trang Quản trị'}</span>
                        </button>
                      )}
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          onProfileClick();
                          setShowUserDropdown(false);
                        }}
                      >
                        <User size={16} />
                        <span>Thông tin cá nhân</span>
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          onMyOrdersClick();
                          setShowUserDropdown(false);
                        }}
                      >
                        <FileText size={16} />
                        <span>Đơn hàng của tôi</span>
                      </button>
                      <button 
                        className="dropdown-item logout-item" 
                        onClick={() => {
                          onLogoutClick();
                          setShowUserDropdown(false);
                        }}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="login-btn" onClick={onLoginClick}>
                  <User size={18} />
                  <span className="login-text-btn">Đăng nhập</span>
                </button>
              )}
            </div>
          )}



          {!isAdminMode && (
            <button className="cart-trigger" onClick={onCartClick} aria-label="Giỏ hàng">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
