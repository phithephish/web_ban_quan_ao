import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Copy, Check, Lock, Truck, RotateCcw } from 'lucide-react';

export default function Checkout({ cartItems, onBackToCart, onSubmitOrder, clearCart }) {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    paymentMethod: 'cod', // 'cod' or 'qr'
  });

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (orderSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderSuccess]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const validateSingleField = (name, value) => {
    switch (name) {
      case 'lastName':
        if (!value.trim()) return 'Vui lòng nhập Họ';
        if (value.trim().length < 2) return 'Họ phải từ 2 ký tự trở lên';
        if (/[0-9!@#$%^&*(),.?":{}|<>]/g.test(value)) return 'Họ chỉ được chứa chữ cái';
        return '';
      case 'firstName':
        if (!value.trim()) return 'Vui lòng nhập Tên';
        if (value.trim().length < 2) return 'Tên phải từ 2 ký tự trở lên';
        if (/[0-9!@#$%^&*(),.?":{}|<>]/g.test(value)) return 'Tên chỉ được chứa chữ cái';
        return '';
      case 'phone':
        if (!value.trim()) {
          return 'Vui lòng nhập số điện thoại';
        }
        if (!/^0\d{9}$/.test(value.trim())) {
          return 'Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng số 0)';
        }
        return '';
      case 'email':
        if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return 'Email không đúng định dạng (VD: name@domain.com)';
          }
        }
        return '';
      case 'address':
        if (!value.trim()) return 'Vui lòng nhập địa chỉ nhận hàng';
        if (value.trim().length < 8) return 'Địa chỉ nhận hàng phải từ 8 ký tự trở lên';
        if (!value.trim().includes(' ')) return 'Địa chỉ nhận hàng cần ghi rõ ràng (tỉnh/thành phố, quận/huyện, tên đường...)';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      const fieldError = validateSingleField(name, value);
      setErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateSingleField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'notes' && key !== 'paymentMethod') {
        const error = validateSingleField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // Auto-scroll and focus first error input
      const firstErrorKey = Object.keys(formErrors)[0];
      const errorEl = document.getElementById(firstErrorKey);
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorEl.focus();
      }
      return;
    }

    const orderId = 'MIN-' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
      id: orderId,
      customer: {
        ...formData,
        fullName: `${formData.lastName.trim()} ${formData.firstName.trim()}`
      },
      items: cartItems,
      subtotal,
      shippingFee,
      total,
      date: new Date().toLocaleString('vi-VN'),
      status: 'Chờ xử lý',
    };

    onSubmitOrder(orderData);
    setCreatedOrder(orderData);
    setOrderSuccess(true);
    clearCart();
  };

  if (orderSuccess && createdOrder) {
    return (
      <div className="checkout-success-container animate-fade-in">
        <div className="success-card">
          <CheckCircle size={64} className="success-icon" />
          <h2 className="success-title">Đặt hàng thành công!</h2>
          <p className="success-subtitle">
            Cảm ơn bạn đã mua sắm tại <strong>STUDIO / MINIMAL</strong>. Đơn hàng của bạn đang được xử lý.
          </p>

          <div className="order-summary-box">
            <div className="summary-row">
              <span>Mã đơn hàng:</span>
              <strong className="order-id">{createdOrder.id}</strong>
            </div>
            <div className="summary-row">
              <span>Khách hàng:</span>
              <span>{createdOrder.customer.fullName}</span>
            </div>
            <div className="summary-row">
              <span>Số điện thoại:</span>
              <span>{createdOrder.customer.phone}</span>
            </div>
            <div className="summary-row">
              <span>Địa chỉ nhận:</span>
              <span>{createdOrder.customer.address}</span>
            </div>
            <div className="summary-row">
              <span>Hình thức:</span>
              <span>{createdOrder.customer.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản qua QR'}</span>
            </div>
            <hr />
            <div className="summary-row total-row">
              <span>Tổng thanh toán:</span>
              <strong className="order-total">{createdOrder.total.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>

          {createdOrder.customer.paymentMethod === 'qr' && (
            <div className="success-qr-instruction">
              <p className="instruction-heading">Thông tin Chuyển khoản QR ngân hàng</p>
              <div className="qr-container">
                {/* Visual Representation of Bank QR */}
                <div className="visual-qr-mock">
                  <div className="qr-border-corner top-left"></div>
                  <div className="qr-border-corner top-right"></div>
                  <div className="qr-border-corner bottom-left"></div>
                  <div className="qr-border-corner bottom-right"></div>
                  <div className="qr-pixel-grid">
                    {/* Simulated visual QR pixels */}
                    <div className="qr-box main-box-1"></div>
                    <div className="qr-box main-box-2"></div>
                    <div className="qr-box main-box-3"></div>
                    <div className="qr-center-logo">MINIMAL</div>
                  </div>
                </div>
                <div className="qr-details">
                  <p>Ngân hàng: <strong>Vietcombank (VCB)</strong></p>
                  <p>Số tài khoản: <strong>1029384756</strong></p>
                  <p>Chủ TK: <strong>MINIMAL STUDIO</strong></p>
                  <div className="qr-memo-box">
                    <span>Nội dung chuyển khoản:</span>
                    <div className="memo-copy">
                      <code>{createdOrder.id}</code>
                      <button 
                        type="button" 
                        onClick={() => handleCopyText(createdOrder.id)}
                        className="copy-btn"
                        title="Copy nội dung"
                      >
                        {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="qr-note">Đơn hàng sẽ được chuyển đi ngay sau khi hệ thống nhận được thanh toán.</p>
            </div>
          )}

          <p className="shipping-estimate-note">
            Thời gian giao hàng dự kiến từ <strong>2-4 ngày làm việc</strong>. Chúng tôi sẽ liên hệ trước khi giao hàng.
          </p>

          <button className="continue-shopping-btn" onClick={onBackToCart}>
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-header-nav">
        <button className="back-to-shop-btn" onClick={onBackToCart}>
          <ArrowLeft size={16} />
          <span>Quay lại giỏ hàng</span>
        </button>
        <h2>Thanh toán đơn hàng</h2>
      </div>

      <div className="checkout-grid">
        {/* Left Side: Checkout Form */}
        <form onSubmit={handleSubmit} className="checkout-form">
          <h3 className="section-title">Thông tin giao hàng</h3>
          
          <div className="form-row-2col">
            <div className="form-input-group">
              <label htmlFor="lastName">Họ *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="VD: Nguyễn"
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="input-error-msg">{errors.lastName}</span>}
            </div>

            <div className="form-input-group">
              <label htmlFor="firstName">Tên *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="VD: Văn A"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="input-error-msg">{errors.firstName}</span>}
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-input-group">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="VD: 0987654321"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
            </div>

            <div className="form-input-group">
              <label htmlFor="email">Email (Không bắt buộc)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="VD: name@domain.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="input-error-msg">{errors.email}</span>}
            </div>
          </div>

          <div className="form-input-group">
            <label htmlFor="address">Địa chỉ nhận hàng *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="input-error-msg">{errors.address}</span>}
          </div>

          <div className="form-input-group">
            <label htmlFor="notes">Ghi chú giao hàng (Không bắt buộc)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="VD: Giao giờ hành chính, gọi trước khi đến..."
              rows="3"
            ></textarea>
          </div>

          <h3 className="section-title margin-top-lg">Phương thức thanh toán</h3>
          <div className="payment-options-group">
            <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={formData.paymentMethod === 'cod'}
                onChange={handleInputChange}
              />
              <div className="option-label-desc">
                <strong>Thanh toán khi nhận hàng (COD)</strong>
                <span>Bạn sẽ thanh toán bằng tiền mặt khi shipper giao hàng tới.</span>
              </div>
            </label>

            <label className={`payment-option ${formData.paymentMethod === 'qr' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="qr"
                checked={formData.paymentMethod === 'qr'}
                onChange={handleInputChange}
              />
              <div className="option-label-desc">
                <strong>Chuyển khoản QR ngân hàng (Xử lý ưu tiên)</strong>
                <span>Chuyển khoản nhanh bằng mã QR ngân hàng quét tự động.</span>
              </div>
            </label>
          </div>

          <button type="submit" className="place-order-btn">
            Xác nhận đặt hàng ({total.toLocaleString('vi-VN')} đ)
          </button>
        </form>

        {/* Right Side: Order Summary */}
        <div className="order-summary-sidebar">
          <h3 className="section-title">Đơn hàng của bạn</h3>
          
          <div className="checkout-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="checkout-item-row">
                <div className="checkout-item-info">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="checkout-item-thumb"
                  />
                  <div className="checkout-item-meta">
                    <span className="checkout-item-name">{item.product.name}</span>
                    <span className="checkout-item-spec">Số lượng: {item.quantity} | Size: {item.size} | Màu: {item.color.name}</span>
                  </div>
                </div>
                <span className="checkout-item-price">
                  {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-pricing-summary">
            <div className="pricing-row">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="pricing-row">
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}</span>
            </div>
            <hr />
            <div className="pricing-row total-row">
              <span>Tổng thanh toán:</span>
              <span>{total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
          
          <div className="checkout-trust-badges">
            <div className="badge-item">
              <Lock size={14} />
              <span>Bảo mật thanh toán SSL</span>
            </div>
            <div className="badge-item">
              <Truck size={14} />
              <span>Giao hàng nhanh chóng toàn quốc</span>
            </div>
            <div className="badge-item">
              <RotateCcw size={14} />
              <span>Đổi trả hàng trong 7 ngày dễ dàng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
