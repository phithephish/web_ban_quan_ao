import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const formattedSubtotal = subtotal.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Giỏ hàng của bạn</h2>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={22} />
          </button>
        </div>

        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <ShoppingCart size={48} className="empty-icon" />
              <p className="empty-title">Giỏ hàng trống</p>
              <p className="empty-subtitle">Hãy chọn sản phẩm bạn yêu thích để thêm vào giỏ hàng.</p>
              <button className="shop-now-btn" onClick={onClose}>Tiếp tục mua sắm</button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const itemPrice = (item.product.price * item.quantity).toLocaleString('vi-VN') + ' đ';
                return (
                  <div key={item.id} className="cart-item">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="cart-item-image"
                    />
                    <div className="cart-item-details">
                      <div className="cart-item-row-top">
                        <h4 className="cart-item-name">{item.product.name}</h4>
                        <button
                          className="item-remove-btn"
                          onClick={() => onRemoveItem(item.id)}
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <p className="cart-item-meta">
                        Size: <span>{item.size}</span> | Màu: <span>{item.color.name}</span>
                      </p>
                      
                      <div className="cart-item-row-bottom">
                        <div className="qty-adjuster">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="qty-adj-btn"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="qty-adj-val">{item.quantity}</span>
                          <button
                            onClick={() => {
                              if (item.quantity < item.product.inStock) {
                                onUpdateQuantity(item.id, item.quantity + 1);
                              }
                            }}
                            disabled={item.quantity >= item.product.inStock}
                            className="qty-adj-btn"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="cart-item-price">{itemPrice}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="subtotal-row">
              <span>Tổng cộng (tạm tính):</span>
              <span className="subtotal-amount">{formattedSubtotal}</span>
            </div>
            <p className="footer-notice">Miễn phí giao hàng cho đơn hàng trên 500k. Đổi trả trong 7 ngày.</p>
            <button className="checkout-btn" onClick={onCheckout}>
              <span>Đặt hàng thanh toán</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
