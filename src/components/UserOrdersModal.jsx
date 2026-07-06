import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, Tag } from 'lucide-react';
import { supabase } from '../supabase';

export default function UserOrdersModal({ isOpen, onClose, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserOrders();
    }
  }, [isOpen, user]);

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
      console.error('Error fetching user orders:', error);
      setErrorMsg('Không thể tải lịch sử đơn hàng. Hãy thử lại sau.');
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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="orders-modal-content animate-fade-in">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="orders-modal-header">
          <h2 className="orders-modal-title">Đơn hàng của tôi</h2>
          <p className="orders-modal-subtitle">Xem lịch sử và hành trình đơn hàng đã đặt</p>
        </div>

        <div className="orders-modal-body">
          {loading ? (
            <div className="modal-loading-state">
              <div className="spinner"></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : errorMsg ? (
            <p className="modal-error-message">{errorMsg}</p>
          ) : orders.length === 0 ? (
            <div className="orders-empty-state">
              <Package size={48} className="empty-icon" />
              <p className="empty-title">Bạn chưa đặt đơn hàng nào</p>
              <p className="empty-subtitle">Các đơn hàng bạn đặt sẽ được lưu trữ và hiển thị hành trình tại đây.</p>
            </div>
          ) : (
            <div className="orders-history-list">
              {orders.map((order) => {
                const formattedTotal = Number(order.total).toLocaleString('vi-VN') + ' đ';
                const orderDate = new Date(order.created_at || order.date).toLocaleString('vi-VN');
                return (
                  <div key={order.id} className="user-order-card">
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

                    <div className="user-order-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="user-order-item-row">
                          <div className="item-name-specs">
                            <span className="item-qty">{item.quantity}x</span>
                            <span className="item-name">{item.product.name}</span>
                            <span className="item-specs">({item.size} - {item.color.name})</span>
                          </div>
                          <span className="item-price">
                            {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="user-order-footer">
                      <div className="recipient-info">
                        Địa chỉ: <strong>{order.customer_address}</strong> ({order.customer_name})
                      </div>
                      <div className="order-total-price">
                        Tổng cộng: <strong>{formattedTotal}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
