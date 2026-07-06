import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';

export default function ProductDetail({ product, onClose, onAddToCart }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default values when product opens
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || null);
      setQuantity(1);
      setErrorMsg('');
    }
  }, [product]);

  if (!product) return null;

  const formattedPrice = product.price.toLocaleString('vi-VN') + ' đ';

  const handleDecreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncreaseQty = () => {
    if (quantity < product.inStock) {
      setQuantity(quantity + 1);
    } else {
      setErrorMsg(`Chỉ còn ${product.inStock} sản phẩm trong kho`);
    }
  };

  const handleAddToCartSubmit = (e) => {
    e.preventDefault();
    if (!selectedSize) {
      setErrorMsg('Vui lòng chọn kích thước (Size)');
      return;
    }
    if (!selectedColor) {
      setErrorMsg('Vui lòng chọn màu sắc');
      return;
    }
    if (product.inStock <= 0) {
      setErrorMsg('Sản phẩm đã hết hàng');
      return;
    }
    
    onAddToCart(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  return (
    <div className="modal-backdrop product-detail-backdrop">
      <div className="modal-content animate-fade-in">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={24} />
        </button>
        
        <div className="product-detail-grid">
          {/* Left Column: Image Gallery */}
          <div className="gallery-section">
            <div className="main-image-container">
              <img 
                src={product.images[activeImageIndex]} 
                alt={`${product.name} - ${activeImageIndex + 1}`} 
                className="main-detail-image"
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} alt="thumbnail" className="thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Form */}
          <div className="info-section">
            <span className="info-category">{product.category}</span>
            <h2 className="info-title">{product.name}</h2>
            <p className="info-price">{formattedPrice}</p>
            
            <hr className="divider" />
            
            <p className="info-description">{product.description}</p>
            
            <form onSubmit={handleAddToCartSubmit} className="purchase-form">
              {/* Color Selection */}
              <div className="form-group">
                <label className="form-label">Màu sắc: <strong>{selectedColor?.name}</strong></label>
                <div className="color-options">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`color-dot-btn ${selectedColor?.name === color.name ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => {
                        setSelectedColor(color);
                        setErrorMsg('');
                      }}
                      title={color.name}
                    >
                      {selectedColor?.name === color.name && (
                        <Check size={12} color={color.hex === '#fafafa' ? '#000' : '#fff'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="form-group">
                <label className="form-label">Kích thước (Size): <strong>{selectedSize}</strong></label>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-box-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSize(size);
                        setErrorMsg('');
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Submit */}
              <div className="form-group">
                <label className="form-label">Số lượng:</label>
                <div className="quantity-and-add">
                  <div className="quantity-selector">
                    <button 
                      type="button" 
                      onClick={handleDecreaseQty} 
                      disabled={quantity <= 1 || product.inStock <= 0}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="qty-number">{product.inStock > 0 ? quantity : 0}</span>
                    <button 
                      type="button" 
                      onClick={handleIncreaseQty} 
                      disabled={quantity >= product.inStock || product.inStock <= 0}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  
                  {product.inStock > 0 && (
                    <span className="stock-indicator">Còn lại {product.inStock} sp</span>
                  )}
                </div>
              </div>

              {errorMsg && <p className="error-message">{errorMsg}</p>}

              <button 
                type="submit" 
                className="add-to-cart-btn"
                disabled={product.inStock <= 0}
              >
                <ShoppingBag size={18} />
                <span>{product.inStock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
