import React, { useState } from 'react';
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
  categories,
  onDeleteAccountClick,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleDropdownToggle = () => setShowUserDropdown(!showUserDropdown);

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
          {!isAdminMode && (
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* User Auth Info / Dropdown */}
          {!isAdminMode && (
            <div className="user-auth-section">
              {user ? (
                <div className="user-profile-menu-container">
                  <button 
                    className="user-menu-trigger" 
                    onClick={handleDropdownToggle}
                    title={`Chào, ${userName}`}
                  >
                    <div className="user-avatar-circle">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-menu-name">{userName}</span>
                  </button>
                  
                  {showUserDropdown && (
                    <div className="user-dropdown-menu animate-fade-in">
                      <div className="dropdown-user-info">
                        <strong>{userName}</strong>
                        <span>{user.email}</span>
                      </div>
                      <hr className="dropdown-divider" />
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
                      <hr className="dropdown-divider" />
                      <button 
                        className="dropdown-item logout-item" 
                        style={{ color: 'var(--danger-color)' }}
                        onClick={() => {
                          onDeleteAccountClick();
                          setShowUserDropdown(false);
                        }}
                      >
                        <Trash2 size={16} />
                        <span>Xóa tài khoản của tôi</span>
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

          {/* Admin Control settings gear icon - ONLY visible for admin@gmail.com */}
          {user?.email === 'admin@gmail.com' && (
            <button
              className={`admin-toggle-btn ${isAdminMode ? 'active' : ''}`}
              onClick={() => setIsAdminMode(!isAdminMode)}
              title={isAdminMode ? "Về trang cửa hàng" : "Trang quản trị cửa hàng"}
            >
              <Settings size={20} />
            </button>
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
