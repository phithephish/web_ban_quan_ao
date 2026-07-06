import React, { useState } from 'react';
import { Plus, Eye } from 'lucide-react';

export default function ProductCard({ product, onProductClick, onAddToCart }) {
  const [hovered, setHovered] = useState(false);
  
  const formattedPrice = product.price.toLocaleString('vi-VN') + ' đ';
  const hasMultipleImages = product.images && product.images.length > 1;
  const displayImage = hovered && hasMultipleImages ? product.images[1] : product.images[0];

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    // Quick add using first color and first size
    const defaultColor = product.colors[0];
    const defaultSize = product.sizes[0];
    onAddToCart(product, defaultSize, defaultColor);
  };

  return (
    <div 
      className="product-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onProductClick(product)}
    >
      <div className="product-image-container">
        <img 
          src={displayImage} 
          alt={product.name} 
          className="product-image"
          loading="lazy"
        />
        <div className="card-overlay">
          <button className="overlay-btn view-btn" onClick={() => onProductClick(product)} title="Xem chi tiết">
            <Eye size={16} />
            <span>Chi tiết</span>
          </button>
          <button className="overlay-btn quick-add-btn" onClick={handleQuickAdd} title="Thêm nhanh vào giỏ hàng">
            <Plus size={16} />
            <span>Thêm nhanh</span>
          </button>
        </div>
        {product.inStock <= 5 && product.inStock > 0 && (
          <span className="stock-tag low-stock">Chỉ còn {product.inStock} sp</span>
        )}
        {product.inStock === 0 && (
          <span className="stock-tag out-of-stock">Hết hàng</span>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <p className="product-price">{formattedPrice}</p>
          <div className="product-sizes-preview">
            {product.sizes.map(size => (
              <span key={size} className="size-preview-chip">{size}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
