import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function UserOrdersPage({ user, localOrders = [], onBackToShop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');

  const tabs = ['Tất cả', 'Chờ xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.warn('Failed to fetch user orders from Supabase. Falling back to local orders:', error);
      // Filter local orders belonging to this user
      const userLocalOrders = localOrders.filter(
        o => o.user_id === user.id || o.customer?.email === user.email
      );
      setOrders(userLocalOrders);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã giao': return 'status-delivered';
      case 'Đang giao': return 'status-shipping';
      case 'Đã hủy': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Tất cả') return true;
    return order.status === activeTab;
  });

  return (
    <div className="orders-page-container animate-fade-in">
      {/* Back to shop navigation header */}
      <div className="checkout-header-nav">
        <button className="back-to-shop-btn" onClick={onBackToShop}>
          <ArrowLeft size={16} />
          <span>Quay lại Cửa hàng</span>
        </button>
        <h2>Lịch sử đơn hàng của tôi</h2>
      </div>

      {/* Tabs Filter Row */}
      <div className="orders-tabs-row">
        {tabs.map(tab => {
          const count = orders.filter(o => tab === 'Tất cả' ? true : o.status === tab).length;
          return (
            <button
              key={tab}
              className={`orders-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab}</span>
              {count > 0 && <span className="tab-count-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Orders List Container */}
      <div className="orders-page-content">
        {loading ? (
          <div className="modal-loading-state">
            <div className="spinner"></div>
            <p>Đang tải lịch sử đơn hàng của bạn...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <Package size={48} className="empty-icon" />
            <p className="empty-title">Không tìm thấy đơn hàng nào</p>
            <p className="empty-subtitle">
              {activeTab === 'Tất cả' 
                ? 'Bạn chưa thực hiện đơn đặt hàng nào.' 
                : `Bạn không có đơn hàng nào ở trạng thái "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="orders-list-cards">
            {filteredOrders.map((order) => {
              const orderDate = new Date(order.created_at || order.date).toLocaleString('vi-VN');
              return (
                <div key={order.id} className="user-order-card">
                  {/* Card Header */}
                  <div className="user-order-header">
                    <div className="id-date">
                      <span className="order-id-label">Mã đơn: #{order.id}</span>
                      <span className="order-date-label">
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        {orderDate}
                      </span>
                    </div>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Card Body: Items List with Product Images */}
                  <div className="user-order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="user-order-item-row">
                        <div className="item-main-info">
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name} 
                            className="order-item-thumb" 
                          />
                          <div className="item-meta-details">
                            <span className="item-name">{item.product.name}</span>
                            <span className="item-specs">
                              Kích thước: {item.size} | Màu sắc: {item.color.name}
                            </span>
                            <span className="item-price-qty">
                              {item.product.price.toLocaleString('vi-VN')} đ x {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="item-subtotal-price">
                          {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Summary and Delivery Info */}
                  <div className="user-order-footer">
                    <div className="delivery-summary-details">
                      <p><strong>Người nhận:</strong> {order.customer_name || order.customer?.fullName} ({order.customer_phone || order.customer?.phone})</p>
                      <p><strong>Địa chỉ:</strong> {order.customer_address || order.customer?.address}</p>
                      {order.customer_notes && <p><strong>Ghi chú:</strong> {order.customer_notes || order.customer?.notes}</p>}
                    </div>
                    
                    <div className="pricing-summary-box">
                      <div className="summary-pricing-row">
                        <span>Tạm tính:</span>
                        <span>{Number(order.subtotal).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="summary-pricing-row">
                        <span>Phí giao hàng:</span>
                        <span>{Number(order.shipping_fee) === 0 ? 'Miễn phí' : `${Number(order.shipping_fee).toLocaleString('vi-VN')} đ`}</span>
                      </div>
                      <div className="summary-pricing-row total-pricing-row">
                        <span>Tổng tiền:</span>
                        <span>{Number(order.total).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
