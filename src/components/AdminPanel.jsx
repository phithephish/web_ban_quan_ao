import React, { useState } from 'react';
import { 
  Plus, Trash2, Package, ListOrdered, Users, Tags, AlertCircle, 
  Trash, Eye, RefreshCw, ChevronRight, Search, ShieldAlert 
} from 'lucide-react';

export default function AdminPanel({
  products,
  onAddProduct,
  onDeleteProduct,
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  categories,
  onAddCategory,
  onDeleteCategory,
  profiles,
  onDeleteUser,
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'categories', 'users'

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl1: '',
    imageUrl2: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colorsInput: 'Đen:#18181b, Trắng:#fafafa, Xám:#71717a',
    inStock: 10,
  });

  // Product List Filter State
  const [prodStockFilter, setProdStockFilter] = useState('all'); // 'all', 'out', 'low'
  
  // Set default category when categories load
  React.useEffect(() => {
    if (categories && categories.length > 0 && !newProduct.category) {
      setNewProduct(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  const [formError, setFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleCheckboxSizeChange = (size) => {
    const updatedSizes = newProduct.sizes.includes(size)
      ? newProduct.sizes.filter((s) => s !== size)
      : [...newProduct.sizes, size];
    setNewProduct({ ...newProduct, sizes: updatedSizes });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newProduct.name.trim()) return setFormError('Tên sản phẩm không được trống');
    if (!newProduct.price || isNaN(newProduct.price) || Number(newProduct.price) <= 0) {
      return setFormError('Giá sản phẩm phải là số dương hợp lệ');
    }
    const finalCategory = newProduct.category || (categories[0]?.name || 'Nam');
    if (!newProduct.imageUrl1.trim()) return setFormError('Vui lòng cung cấp ít nhất 1 ảnh sản phẩm');

    // Parse colors
    const parsedColors = [];
    try {
      const parts = newProduct.colorsInput.split(',');
      parts.forEach((part) => {
        const [name, hex] = part.split(':');
        if (name && hex) {
          parsedColors.push({ name: name.trim(), hex: hex.trim() });
        }
      });
      if (parsedColors.length === 0) {
        return setFormError('Màu sắc không hợp lệ (VD: Đen:#000, Trắng:#fff)');
      }
    } catch (e) {
      return setFormError('Định dạng màu sắc sai. VD: Đen:#000, Trắng:#fff');
    }

    const newProdObj = {
      id: Date.now(),
      name: newProduct.name.trim(),
      price: Number(newProduct.price),
      category: finalCategory,
      description: newProduct.description.trim() || 'Mô tả sản phẩm đang cập nhật.',
      images: [
        newProduct.imageUrl1.trim(),
        ...(newProduct.imageUrl2.trim() ? [newProduct.imageUrl2.trim()] : []),
      ],
      sizes: newProduct.sizes,
      colors: parsedColors,
      inStock: Number(newProduct.inStock) || 0,
    };

    onAddProduct(newProdObj);
    
    // Reset form
    setNewProduct({
      name: '',
      price: '',
      category: categories[0]?.name || '',
      description: '',
      imageUrl1: '',
      imageUrl2: '',
      sizes: ['S', 'M', 'L', 'XL'],
      colorsInput: 'Đen:#18181b, Trắng:#fafafa, Xám:#71717a',
      inStock: 10,
    });
    setFormError('');
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    // Check duplication
    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (duplicate) {
      alert('Danh mục này đã tồn tại!');
      return;
    }

    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  // Filter products based on stock selection
  const filteredProducts = products.filter(p => {
    if (prodStockFilter === 'out') return p.inStock === 0;
    if (prodStockFilter === 'low') return p.inStock > 0 && p.inStock <= 5;
    return true;
  });

  return (
    <div className="admin-container animate-fade-in">
      {/* Admin Navigation Sidebar */}
      <div className="admin-sidebar">
        <h3 className="admin-sidebar-title">Quản trị hệ thống</h3>
        
        <button
          className={`sidebar-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ListOrdered size={18} />
          <span>Đơn hàng ({orders.length})</span>
        </button>

        <button
          className={`sidebar-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} />
          <span>Sản phẩm ({products.length})</span>
        </button>

        <button
          className={`sidebar-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tags size={18} />
          <span>Danh mục ({categories.length})</span>
        </button>

        <button
          className={`sidebar-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          <span>Người dùng ({profiles.length})</span>
        </button>
      </div>

      {/* Admin Dashboard main sections */}
      <div className="admin-main-content">
        
        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Danh sách đơn hàng</h2>
            
            {orders.length === 0 ? (
              <div className="admin-empty-state">
                <AlertCircle size={40} className="empty-icon" />
                <p>Chưa có đơn hàng nào trong hệ thống.</p>
              </div>
            ) : (
              <div className="admin-orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="admin-order-card">
                    <div className="order-card-header">
                      <div>
                        <span className="order-badge-id">#{order.id}</span>
                        <span className="order-time">{order.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="order-status-select-container">
                          <label>Trạng thái:</label>
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                            className={`status-select ${
                              order.status === 'Đã giao'
                                ? 'status-delivered'
                                : order.status === 'Đang giao'
                                ? 'status-shipping'
                                : order.status === 'Đã hủy'
                                ? 'status-cancelled'
                                : 'status-pending'
                            }`}
                          >
                            <option value="Chờ xử lý">Chờ xử lý</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Đã giao">Đã giao</option>
                            <option value="Đã hủy">Đã hủy</option>
                          </select>
                        </div>
                        
                        <button
                          className="table-delete-btn"
                          style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
                          onClick={() => {
                            if (window.confirm(`Xóa vĩnh viễn đơn hàng #${order.id}?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="Xóa đơn hàng vĩnh viễn"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="order-card-body-grid">
                      <div className="customer-info-box">
                        <h4>Khách hàng</h4>
                        <p>Tên: <strong>{order.customer.fullName}</strong></p>
                        <p>SĐT: <strong>{order.customer.phone}</strong></p>
                        <p>Email: {order.customer.email || 'Không cung cấp'}</p>
                        <p>Địa chỉ: <strong>{order.customer.address}</strong></p>
                        {order.customer.notes && <p className="notes">Ghi chú: {order.customer.notes}</p>}
                      </div>

                      <div className="order-items-box">
                        <h4>Sản phẩm ({order.items.length})</h4>
                        <ul>
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              <span>{item.quantity}x {item.product.name}</span>
                              <span className="meta">(Size {item.size} - {item.color.name})</span>
                            </li>
                          ))}
                        </ul>
                        <div className="price-summary">
                          <p>Tạm tính: {order.subtotal.toLocaleString('vi-VN')} đ</p>
                          <p>Phí ship: {order.shippingFee.toLocaleString('vi-VN')} đ</p>
                          <p className="total">Tổng cộng: <strong>{order.total.toLocaleString('vi-VN')} đ</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Danh sách sản phẩm</h2>
            
            {/* Form Add Product */}
            <form onSubmit={handleProductSubmit} className="admin-product-form">
              <h3>Thêm sản phẩm mới</h3>
              {formError && <p className="form-error-msg">{formError}</p>}
              
              <div className="form-grid-2">
                <div className="form-input-group">
                  <label>Tên sản phẩm *</label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    placeholder="VD: Áo Blazer Linen"
                    required
                  />
                </div>
                <div className="form-grid-sub2">
                  <div className="form-input-group">
                    <label>Giá bán (đ) *</label>
                    <input
                      type="number"
                      name="price"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      placeholder="VD: 450000"
                      required
                    />
                  </div>
                  <div className="form-input-group">
                    <label>Danh mục *</label>
                    <select name="category" value={newProduct.category} onChange={handleInputChange}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-input-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả sản phẩm, chất liệu, size guide..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-grid-2">
                <div className="form-input-group">
                  <label>Đường dẫn hình ảnh 1 *</label>
                  <input
                    type="url"
                    name="imageUrl1"
                    value={newProduct.imageUrl1}
                    onChange={handleInputChange}
                    placeholder="Đường dẫn link ảnh"
                    required
                  />
                </div>
                <div className="form-input-group">
                  <label>Đường dẫn hình ảnh 2 (Không bắt buộc)</label>
                  <input
                    type="url"
                    name="imageUrl2"
                    value={newProduct.imageUrl2}
                    onChange={handleInputChange}
                    placeholder="Đường dẫn link ảnh phụ"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-input-group">
                  <label>Kích thước sẵn có</label>
                  <div className="checkbox-group">
                    {['S', 'M', 'L', 'XL', '39', '40', '41', '42'].map((size) => (
                      <label key={size} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.sizes.includes(size)}
                          onChange={() => handleCheckboxSizeChange(size)}
                        />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-grid-sub2">
                  <div className="form-input-group">
                    <label>Số lượng trong kho</label>
                    <input
                      type="number"
                      name="inStock"
                      value={newProduct.inStock}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-input-group">
                <label>Màu sắc (Định dạng: TênMàu:MãHex, cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  name="colorsInput"
                  value={newProduct.colorsInput}
                  onChange={handleInputChange}
                  placeholder="VD: Đen:#18181b, Trắng:#fafafa, Xám:#71717a"
                />
              </div>

              <button type="submit" className="admin-submit-btn">
                <Plus size={16} />
                <span>Đăng bán sản phẩm</span>
              </button>
            </form>

            <hr className="divider margin-y-lg" />

            {/* List Products Header Toolbar */}
            <div className="admin-toolbar-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Danh sách sản phẩm ({products.length})</h3>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bộ lọc kho:</span>
                <select 
                  value={prodStockFilter} 
                  onChange={(e) => setProdStockFilter(e.target.value)}
                  className="sort-select"
                  style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="all">Tất cả sản phẩm</option>
                  <option value="out">Đã hết hàng (0)</option>
                  <option value="low">Sắp hết hàng (1-5)</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="admin-products-table-wrapper">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Giá</th>
                    <th>Danh mục</th>
                    <th>Màu sắc</th>
                    <th>Sizes</th>
                    <th>Kho</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <img src={p.images[0]} alt={p.name} className="table-img" />
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.price.toLocaleString('vi-VN')} đ</td>
                      <td><span className="table-cat">{p.category}</span></td>
                      <td>
                        <div className="table-colors">
                          {p.colors?.map(c => (
                            <span key={c.name} className="color-indicator" style={{ backgroundColor: c.hex }} title={c.name}></span>
                          ))}
                        </div>
                      </td>
                      <td>{p.sizes?.join(', ')}</td>
                      <td>
                        <span className={`stock-text ${p.inStock === 0 ? 'text-danger' : p.inStock <= 5 ? 'text-warning' : ''}`} style={{ fontWeight: 600 }}>
                          {p.inStock}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-delete-btn"
                          onClick={() => {
                            if (window.confirm(`Xóa vĩnh viễn sản phẩm "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlignment: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Không có sản phẩm nào khớp bộ lọc kho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORY MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Quản lý danh mục</h2>
            
            <div className="admin-grid-2" style={{ alignItems: 'flex-start' }}>
              {/* Form Add Category */}
              <form onSubmit={handleCategorySubmit} className="admin-product-form" style={{ margin: 0 }}>
                <h3>Thêm danh mục mới</h3>
                <div className="form-input-group" style={{ marginBottom: '1rem' }}>
                  <label>Tên danh mục *</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="VD: Đồ Thể Thao, Đồ Ngủ..."
                    required
                  />
                </div>
                <button type="submit" className="admin-submit-btn" style={{ margin: 0 }}>
                  <Plus size={16} />
                  <span>Lưu danh mục</span>
                </button>
              </form>

              {/* Category Table */}
              <div className="admin-products-table-wrapper" style={{ margin: 0 }}>
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên danh mục</th>
                      <th>Ngày tạo</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, index) => (
                      <tr key={c.id || index}>
                        <td><strong>{c.id || index + 1}</strong></td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : 'Mặc định'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="table-delete-btn"
                            onClick={() => {
                              if (window.confirm(`Xóa danh mục "${c.name}"? Các sản phẩm thuộc danh mục này có thể cần phân loại lại.`)) {
                                onDeleteCategory(c.id, c.name);
                              }
                            }}
                            title="Xóa danh mục"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Quản lý người dùng</h2>
            
            <div className="alert-banner-warning" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#b45309' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Lưu ý bảo mật về Xóa tài khoản:</strong>
                <span style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Nút "Xóa tài khoản" tại trang quản trị sẽ xóa thông tin hồ sơ của người dùng khỏi bảng database `profiles`. Trong môi trường thực tế, việc xóa triệt để tài khoản đăng nhập (Auth Record) cần được xử lý thông qua Service Role API trên Supabase Backend hoặc Supabase CLI để tránh rò rỉ dữ liệu.
                </span>
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="admin-empty-state">
                <Users size={40} className="empty-icon" />
                <p>Chưa có thông tin hồ sơ người dùng nào được tạo trên database.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  (Tài khoản người dùng được tự động thêm vào danh sách sau khi đăng ký thành công trên web).
                </p>
              </div>
            ) : (
              <div className="admin-products-table-wrapper">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Ảnh đại diện</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Ngày đăng ký</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((user) => {
                      const joinedDate = new Date(user.created_at).toLocaleDateString('vi-VN');
                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="user-avatar-circle" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </td>
                          <td><strong>{user.full_name}</strong></td>
                          <td>{user.email}</td>
                          <td>{joinedDate}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="table-delete-btn"
                              style={{ color: 'var(--danger-color)', padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #fee2e2', borderRadius: '4px', backgroundColor: '#fff5f5' }}
                              onClick={() => {
                                if (window.confirm(`Xóa vĩnh viễn tài khoản hồ sơ của "${user.full_name}" khỏi database?`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                              title="Xóa tài khoản khỏi database"
                            >
                              <span>Xóa tài khoản</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
