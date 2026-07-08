import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import AdminPanel from './components/AdminPanel';
import Notification from './components/Notification';
import AuthModal from './components/AuthModal';
import UserOrdersPage from './components/UserOrdersPage';
import UserProfilePage from './components/UserProfilePage';
import { INITIAL_PRODUCTS } from './data/products';
import { supabase } from './supabase';
import { SlidersHorizontal, RefreshCw, Search } from 'lucide-react';

function App() {
  // --- States ---
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('minimal_shop_orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (e) {
      console.warn("Failed to load orders from localStorage:", e);
      return [];
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('minimal_shop_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.warn("Failed to load cart from localStorage:", e);
      return [];
    }
  });
  
  // Categories and User Profiles Dynamic States
  const [categories, setCategories] = useState([
    { id: 1, name: 'Nam' },
    { id: 2, name: 'Nữ' },
    { id: 3, name: 'Phụ kiện' }
  ]);
  const [profiles, setProfiles] = useState([]);

  // User Authentication State
  const [user, setUser] = useState(null);
  
  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');
  
  // Custom Sidebar Filters
  const [filterPrice, setFilterPrice] = useState('all');
  const [filterSizes, setFilterSizes] = useState([]);
  const [filterColors, setFilterColors] = useState([]);

  // Views & UI States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeView, setActiveView] = useState('shop'); // 'shop', 'checkout', 'my-orders'
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Notifications Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // --- Supabase Effects ---
  
  // Helper: Auto-ensure user has a profile in public.profiles table
  const ensureUserProfile = async (authUser) => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.log("Profile missing in public.profiles. Auto-creating row...");
        const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Khách Hàng';
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: userName
          });
        if (insertErr) throw insertErr;
        // Refresh profiles state if we are currently in admin view
        if (isAdminMode) {
          fetchProfiles();
        }
      }
    } catch (err) {
      console.warn("Could not check or auto-create profile row in public.profiles table:", err);
    }
  };

  // 1. Fetch current auth session on mount & subscribe to changes
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('minimal_shop_session', JSON.stringify(session.user));
        await ensureUserProfile(session.user);
      } else {
        const localSess = localStorage.getItem('minimal_shop_session');
        if (localSess) {
          try {
            const parsedUser = JSON.parse(localSess);
            setUser(parsedUser);
            await ensureUserProfile(parsedUser);
          } catch (e) {
            localStorage.removeItem('minimal_shop_session');
          }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('minimal_shop_session', JSON.stringify(session.user));
        await ensureUserProfile(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('minimal_shop_session');
      }
    });

    return () => subscription.unsubscribe();
  }, [isAdminMode]);

  // 2. Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 3. Fetch orders and profiles when Admin panel is active
  useEffect(() => {
    if (isAdminMode) {
      fetchAllOrders();
      fetchProfiles();
    }
  }, [isAdminMode]);

  // Security check: Force exit Admin Mode if current user is not admin
  useEffect(() => {
    if (!user || user.email !== 'admin@gmail.com') {
      setIsAdminMode(false);
    }
  }, [user]);

  // Sync scroll lock when modal or drawer is open
  useEffect(() => {
    const isAnyModalOpen = selectedProduct || isCartOpen || isAuthModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct, isCartOpen, isAuthModalOpen]);

  // Sync cart to localStorage whenever it changes to persist across page reloads
  useEffect(() => {
    try {
      localStorage.setItem('minimal_shop_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  // Sync user profile name from database/local storage to keep user state in sync
  useEffect(() => {
    if (!user) return;
    
    const syncProfileName = async () => {
      let localProfileName = '';
      try {
        const saved = localStorage.getItem(`minimal_profile_${user.id}`);
        if (saved) {
          const profile = JSON.parse(saved);
          localProfileName = profile.full_name;
        }
      } catch (e) {}

      if (localProfileName && user.user_metadata?.full_name !== localProfileName) {
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            user_metadata: {
              ...prev.user_metadata,
              full_name: localProfileName
            }
          };
        });
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!error && data?.full_name && user.user_metadata?.full_name !== data.full_name) {
          setUser(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                full_name: data.full_name
              }
            };
            localStorage.setItem('minimal_shop_session', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {}
    };

    syncProfileName();
  }, [user?.id]);

  // Sync orders to localStorage whenever it changes to persist across page reloads
  useEffect(() => {
    try {
      localStorage.setItem('minimal_shop_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn("Failed to save orders to localStorage:", e);
    }
  }, [orders]);

  // --- Helper: Trigger Toast Alert ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // --- Database Fetch Operations ---
  
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        console.log("Supabase products table is empty. Seeding initial products...");
        // Auto-seed table if empty and schema exists
        const productsWithoutId = INITIAL_PRODUCTS.map(({ id, ...p }) => p);
        const { error: seedError } = await supabase.from('products').insert(productsWithoutId);
        
        if (!seedError) {
          const { data: seededData } = await supabase.from('products').select('*').order('id', { ascending: true });
          if (seededData) setProducts(seededData);
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      }
    } catch (err) {
      console.warn("Supabase products query failed. Using local mock database. Error details:", err);
      setProducts(INITIAL_PRODUCTS);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database schema values to state structure if needed
      const mappedOrders = (data || []).map(o => ({
        id: o.id,
        customer: {
          fullName: o.customer_name,
          phone: o.customer_phone,
          email: o.customer_email,
          address: o.customer_address,
          notes: o.customer_notes,
          paymentMethod: o.payment_method
        },
        items: o.items,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shipping_fee),
        total: Number(o.total),
        date: new Date(o.created_at).toLocaleString('vi-VN'),
        status: o.status
      }));

      setOrders(mappedOrders);
    } catch (err) {
      console.warn("Failed to fetch orders from Supabase. Displaying local mock orders.", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        console.log("Categories table empty. Seeding defaults...");
        const defaultCats = [{ name: 'Nam' }, { name: 'Nữ' }, { name: 'Phụ kiện' }];
        const { error: seedError } = await supabase.from('categories').insert(defaultCats);
        if (!seedError) {
          const { data: seededData } = await supabase.from('categories').select('*').order('id', { ascending: true });
          if (seededData) setCategories(seededData);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch categories from Supabase, using defaults:", err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.warn("Failed to fetch profiles from Supabase:", err);
    }
  };

  const handleAddCategory = async (catName) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: catName })
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setCategories([...categories, data[0]]);
      } else {
        setCategories([...categories, { id: Date.now(), name: catName }]);
      }
      showToast(`Đã thêm danh mục "${catName}" thành công.`);
    } catch (err) {
      console.error("Failed to add category to Supabase:", err);
      setCategories([...categories, { id: Date.now(), name: catName }]);
      showToast(`Đã thêm danh mục "${catName}" (Lưu cục bộ).`);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== catId));
      showToast(`Đã xóa danh mục "${catName}".`);
    } catch (err) {
      console.error("Failed to delete category from Supabase:", err);
      setCategories(categories.filter(c => c.id !== catId));
      showToast(`Đã xóa danh mục "${catName}" (Cục bộ).`);
    }
  };

  const handleDeleteUserAccount = async (userId) => {
    try {
      // 1. Delete profile row in database
      const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileErr) throw profileErr;

      // 2. Delete user's orders from database
      const { error: ordersErr } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', userId);
      if (ordersErr) console.warn("Failed to delete related orders for deleted user:", ordersErr);

      setProfiles(profiles.filter(p => p.id !== userId));
      // also filter orders in state
      setOrders(orders.filter(o => o.user_id !== userId));
      showToast('Đã xóa thông tin tài khoản người dùng thành công.');
    } catch (err) {
      console.error("Failed to delete user profile from Supabase:", err);
      setProfiles(profiles.filter(p => p.id !== userId));
      showToast('Đã xóa tài khoản khỏi danh sách (Cục bộ).');
    }
  };

  const handleDeleteSelfAccount = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của mình? Mọi lịch sử đơn hàng và thông tin hồ sơ của bạn sẽ bị xóa sạch khỏi database."
    );
    if (!confirmDelete) return;

    try {
      const userId = user.id;

      // 1. Delete profiles table row
      const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileErr) throw profileErr;

      // 2. Delete related orders
      await supabase.from('orders').delete().eq('user_id', userId);

      // 3. Log out and clear session
      await supabase.auth.signOut();
      
      setUser(null);
      localStorage.removeItem('minimal_shop_session');
      setCart([]);
      setActiveView('shop');
      showToast('Tài khoản của bạn đã được xóa thành công.', 'info');
    } catch (err) {
      console.error("Error deleting self account:", err);
      // Fallback local cleanup if DB operation fails
      setUser(null);
      localStorage.removeItem('minimal_shop_session');
      setCart([]);
      setActiveView('shop');
      showToast('Đã đăng xuất & dọn dẹp bộ nhớ (Tài khoản đã xóa).', 'info');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.filter(o => o.id !== orderId));
      showToast(`Đã xóa đơn hàng #${orderId} khỏi database.`);
    } catch (err) {
      console.error("Failed to delete order from Supabase:", err);
      setOrders(orders.filter(o => o.id !== orderId));
      showToast(`Đã xóa đơn hàng #${orderId} (Cục bộ).`);
    }
  };

  // --- Authentication Handlers ---
  
  const handleAuthSuccess = (authUser, welcomeMessage) => {
    setUser(authUser);
    localStorage.setItem('minimal_shop_session', JSON.stringify(authUser));
    showToast(welcomeMessage);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      localStorage.removeItem('minimal_shop_session');
      showToast('Đăng xuất thành công!', 'info');
      setActiveView('shop'); // Return to shop if logout from checkout
    } catch (error) {
      setUser(null);
      localStorage.removeItem('minimal_shop_session');
      showToast('Đăng xuất thành công!', 'info');
      setActiveView('shop');
    }
  };

  // --- Cart Operations ---
  
  const handleAddToCart = (product, size, color, quantity = 1) => {
    if (product.inStock <= 0) {
      showToast('Sản phẩm đã hết hàng', 'info');
      return;
    }

    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.size === size &&
        item.color.name === color.name
    );

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > product.inStock) {
        showToast(`Không thể thêm. Vượt quá số lượng có sẵn (${product.inStock} sp)`, 'info');
        return;
      }
      
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
      showToast(`Đã cập nhật số lượng ${product.name} trong giỏ hàng!`);
    } else {
      if (quantity > product.inStock) {
        showToast(`Không thể thêm. Chỉ còn ${product.inStock} sản phẩm.`, 'info');
        return;
      }
      
      const newItem = {
        id: `${product.id}-${size}-${color.name}-${Date.now()}`,
        product,
        size,
        color,
        quantity,
      };
      setCart([...cart, newItem]);
      showToast(`Đã thêm ${product.name} vào giỏ hàng!`);
    }
  };

  const handleUpdateCartQuantity = (cartItemId, newQty) => {
    const itemIndex = cart.findIndex((item) => item.id === cartItemId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    if (newQty > item.product.inStock) {
      showToast(`Rất tiếc, chỉ còn ${item.product.inStock} sản phẩm trong kho.`, 'info');
      return;
    }

    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }

    const newCart = [...cart];
    newCart[itemIndex].quantity = newQty;
    setCart(newCart);
  };

  const handleRemoveCartItem = (cartItemId) => {
    const item = cart.find((i) => i.id === cartItemId);
    setCart(cart.filter((i) => i.id !== cartItemId));
    if (item) {
      showToast(`Đã xóa ${item.product.name} khỏi giỏ hàng.`, 'info');
    }
  };

  // --- Checkout Operations ---
  
  const handleCheckoutTrigger = () => {
    setIsCartOpen(false);
    if (cart.length === 0) {
      showToast('Giỏ hàng của bạn đang trống.', 'error');
      return;
    }
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Vui lòng đăng nhập để tiến hành thanh toán.', 'info');
    } else {
      setActiveView('checkout');
    }
  };

  const handleSubmitOrder = async (orderData) => {
    try {
      // 1. Insert order to Supabase Table
      const { error } = await supabase
        .from('orders')
        .insert({
          id: orderData.id,
          customer_name: orderData.customer.fullName,
          customer_phone: orderData.customer.phone,
          customer_email: orderData.customer.email || null,
          customer_address: orderData.customer.address,
          customer_notes: orderData.customer.notes || null,
          payment_method: orderData.customer.paymentMethod,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping_fee: orderData.shippingFee,
          total: orderData.total,
          status: orderData.status,
          user_id: user?.id || null // Link with authenticated user
        });

      if (error) throw error;

      setOrders(prev => [orderData, ...prev]);

      // 2. Update stock of products in Supabase Database
      for (const item of orderData.items) {
        const newStock = Math.max(0, item.product.inStock - item.quantity);
        await supabase
          .from('products')
          .update({ inStock: newStock })
          .eq('id', item.product.id);
      }

      showToast('Đặt hàng thành công! Đơn hàng đã ghi nhận.');
      fetchProducts(); // Refresh products in shop catalog
    } catch (err) {
      console.warn("Failed to submit order to Supabase. Saving locally in memory.", err);
      // Fallback local memory save
      setOrders([orderData, ...orders]);
      const updatedProducts = products.map((product) => {
        const cartItemsForProduct = orderData.items.filter((item) => item.product.id === product.id);
        if (cartItemsForProduct.length > 0) {
          const totalPurchasedQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
          return {
            ...product,
            inStock: Math.max(0, product.inStock - totalPurchasedQty),
          };
        }
        return product;
      });
      setProducts(updatedProducts);
      showToast('Đặt hàng thành công (Lưu trữ cục bộ).');
    }
  };

  // --- Admin Panel Operations ---
  
  const handleAddProduct = async (newProductObj) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProductObj.name,
          price: newProductObj.price,
          category: newProductObj.category,
          description: newProductObj.description,
          images: newProductObj.images,
          sizes: newProductObj.sizes,
          colors: newProductObj.colors,
          inStock: newProductObj.inStock
        })
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setProducts([data[0], ...products]);
      } else {
        setProducts([newProductObj, ...products]);
      }
      showToast(`Đã thêm sản phẩm "${newProductObj.name}" thành công.`);
    } catch (err) {
      console.warn("Failed to add product to Supabase. Adding locally.", err);
      setProducts([newProductObj, ...products]);
      showToast(`Đã thêm sản phẩm "${newProductObj.name}" (Lưu cục bộ).`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter((p) => p.id !== productId));
      showToast('Xóa sản phẩm khỏi database thành công.');
    } catch (err) {
      console.warn("Failed to delete product from Supabase. Removing locally.", err);
      setProducts(products.filter((p) => p.id !== productId));
      showToast('Đã xóa sản phẩm (Cục bộ).');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Đã cập nhật trạng thái đơn hàng sang "${newStatus}"`);
    } catch (err) {
      console.warn("Failed to update status on Supabase. Updating locally.", err);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  // --- Reset All Filters ---
  const handleClearFilters = () => {
    setFilterPrice('all');
    setFilterSizes([]);
    setFilterColors([]);
    setSearchQuery('');
  };

  // Toggle filter arrays
  const toggleSizeFilter = (size) => {
    if (filterSizes.includes(size)) {
      setFilterSizes(filterSizes.filter(s => s !== size));
    } else {
      setFilterSizes([...filterSizes, size]);
    }
  };

  const toggleColorFilter = (colorName) => {
    if (filterColors.includes(colorName)) {
      setFilterColors(filterColors.filter(c => c !== colorName));
    } else {
      setFilterColors([...filterColors, colorName]);
    }
  };

  // --- Filter and Sort Logic ---
  const allUniqueSizes = Array.from(new Set(products.flatMap(p => p.sizes)));
  const allUniqueColors = Array.from(
    new Map(products.flatMap(p => p.colors).map(c => [c.name, c])).values()
  );

  const filteredProducts = products.filter((product) => {
    if (activeCategory !== 'Tất cả' && product.category !== activeCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(query);
      const matchDesc = product.description.toLowerCase().includes(query);
      const matchCat = product.category.toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    if (filterPrice !== 'all') {
      if (filterPrice === 'under-500k' && product.price >= 500000) return false;
      if (filterPrice === '500k-1000k' && (product.price < 500000 || product.price > 1000000)) return false;
      if (filterPrice === 'over-1000k' && product.price <= 1000000) return false;
    }

    if (filterSizes.length > 0) {
      const hasSize = product.sizes.some(size => filterSizes.includes(size));
      if (!hasSize) return false;
    }

    if (filterColors.length > 0) {
      const hasColor = product.colors.some(color => filterColors.includes(color.name));
      if (!hasColor) return false;
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price-low') {
      return a.price - b.price;
    }
    if (sortOption === 'price-high') {
      return b.price - a.price;
    }
    if (sortOption === 'newest') {
      return b.id - a.id;
    }
    return 0;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      {/* 1. Sticky Navigation Header */}
      <Header
        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
          setActiveCategory(cat);
          setActiveView('shop');
        }}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onMyOrdersClick={() => setActiveView('my-orders')}
        onProfileClick={() => setActiveView('profile')}
        categories={categories}
        onDeleteAccountClick={handleDeleteSelfAccount}
      />

      <main className="main-content">
        {/* VIEW 1: ADMIN MODE */}
        {isAdminMode ? (
          <AdminPanel
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            profiles={profiles}
            onDeleteUser={handleDeleteUserAccount}
          />
        ) : activeView === 'checkout' ? (
          /* VIEW 2: CHECKOUT VIEW */
          <Checkout
            cartItems={cart}
            onBackToCart={() => setActiveView('shop')}
            onSubmitOrder={handleSubmitOrder}
            clearCart={() => setCart([])}
          />
        ) : activeView === 'my-orders' ? (
          /* VIEW 2.5: MY ORDERS VIEW */
          <UserOrdersPage
            user={user}
            localOrders={orders}
            onBackToShop={() => setActiveView('shop')}
          />
        ) : activeView === 'profile' ? (
          /* VIEW 2.8: USER PROFILE VIEW */
          <UserProfilePage
            user={user}
            onBackToShop={() => setActiveView('shop')}
            onUpdateProfile={(updatedUser) => setUser(updatedUser)}
          />
        ) : (
          /* VIEW 3: SHOP / CATALOG VIEW */
          <>
            {/* Elegant banner */}
            <div className="category-intro animate-fade-in">
              <h1>
                {activeCategory === 'Tất cả' ? 'Bộ sưu tập tối giản' : `Thời trang ${activeCategory}`}
              </h1>
              <p>
                Thiết kế tinh xảo, chất liệu thượng hạng, lược bỏ chi tiết thừa để hướng tới trải nghiệm thoải mái và tính ứng dụng tối đa.
              </p>
            </div>

            {/* Catalog Layout: Sidebar + Main Grid */}
            <div className="catalog-layout">
              {/* Left Column: Sidebar Filters */}
              <aside className={`catalog-filters ${showMobileFilters ? 'show' : ''}`}>
                {/* Search Filter Section */}
                <div className="filter-section">
                  <h4 className="filter-title">Tìm kiếm</h4>
                  <div className="sidebar-search-bar">
                    <Search size={16} className="sidebar-search-icon" />
                    <input
                      type="text"
                      placeholder="Tìm tên sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="sidebar-search-input"
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h4 className="filter-title">Bộ lọc giá</h4>
                  <div className="filter-list">
                    <button
                      className={`filter-btn ${filterPrice === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterPrice('all')}
                    >
                      Tất cả
                    </button>
                    <button
                      className={`filter-btn ${filterPrice === 'under-500k' ? 'active' : ''}`}
                      onClick={() => setFilterPrice('under-500k')}
                    >
                      Dưới 500.000 đ
                    </button>
                    <button
                      className={`filter-btn ${filterPrice === '500k-1000k' ? 'active' : ''}`}
                      onClick={() => setFilterPrice('500k-1000k')}
                    >
                      500.000 đ - 1.000.000 đ
                    </button>
                    <button
                      className={`filter-btn ${filterPrice === 'over-1000k' ? 'active' : ''}`}
                      onClick={() => setFilterPrice('over-1000k')}
                    >
                      Trên 1.000.000 đ
                    </button>
                  </div>
                </div>

                {allUniqueSizes.length > 0 && (
                  <div className="filter-section">
                    <h4 className="filter-title">Kích cỡ (Size)</h4>
                    <div className="filter-sizes-grid">
                      {allUniqueSizes.map((size) => (
                        <button
                          key={size}
                          className={`filter-size-btn ${filterSizes.includes(size) ? 'active' : ''}`}
                          onClick={() => toggleSizeFilter(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {allUniqueColors.length > 0 && (
                  <div className="filter-section">
                    <h4 className="filter-title">Màu sắc</h4>
                    <div className="filter-color-dots">
                      {allUniqueColors.map((color) => (
                        <button
                          key={color.name}
                          className={`filter-color-btn ${filterColors.includes(color.name) ? 'active' : ''}`}
                          style={{ backgroundColor: color.hex }}
                          onClick={() => toggleColorFilter(color.name)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(filterPrice !== 'all' || filterSizes.length > 0 || filterColors.length > 0 || searchQuery) && (
                  <button className="clear-filters-btn" onClick={handleClearFilters}>
                    <RefreshCw size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </aside>

              {/* Right Column: Catalog Grid */}
              <div className="catalog-main">
                <div className="catalog-toolbar">
                  <span className="product-count">
                    Hiển thị <strong>{sortedProducts.length}</strong> sản phẩm
                  </span>

                  <div className="toolbar-controls">
                    {/* Toggle Filters Button for Mobile */}
                    <button
                      className={`mobile-filter-toggle-btn ${showMobileFilters ? 'active' : ''}`}
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      title="Bộ lọc sản phẩm"
                    >
                      <SlidersHorizontal size={14} />
                      <span>
                        Bộ lọc
                        {(filterPrice !== 'all' || filterSizes.length > 0 || filterColors.length > 0) && (
                          <span className="filter-active-dot" />
                        )}
                      </span>
                    </button>

                    <div className="sort-dropdown-container">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="sort-select"
                      >
                        <option value="default">Sắp xếp mặc định</option>
                        <option value="price-low">Giá: Thấp đến Cao</option>
                        <option value="price-high">Giá: Cao đến Thấp</option>
                        <option value="newest">Mới nhất</option>
                      </select>
                    </div>
                  </div>
                </div>

                {sortedProducts.length === 0 ? (
                  <div className="no-results-state animate-fade-in">
                    <h3>Không tìm thấy sản phẩm nào</h3>
                    <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
                  </div>
                ) : (
                  <div className="products-grid">
                    {sortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onProductClick={setSelectedProduct}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Column 1: Brand Info */}
            <div className="footer-col brand-col">
              <h4 className="footer-logo">STUDIO / MINIMAL</h4>
              <p className="brand-description">
                Thương hiệu thời trang tối giản hướng đến sự tinh tế, bền vững và tính ứng dụng cao. Lược bỏ chi tiết thừa để tôn vinh vẻ đẹp tự nhiên của người mặc.
              </p>
            </div>

            {/* Column 2: Customer Service */}
            <div className="footer-col">
              <h5 className="footer-title">Dịch vụ khách hàng</h5>
              <ul className="footer-links">
                <li><a href="#size-guide" onClick={(e) => e.preventDefault()}>Hướng dẫn chọn size</a></li>
                <li><a href="#shipping" onClick={(e) => e.preventDefault()}>Chính sách giao hàng</a></li>
                <li><a href="#returns" onClick={(e) => e.preventDefault()}>Chính sách đổi trả</a></li>
                <li><a href="#privacy" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a></li>
              </ul>
            </div>

            {/* Column 3: Shop Categories */}
            <div className="footer-col">
              <h5 className="footer-title">Danh mục sản phẩm</h5>
              <ul className="footer-links">
                <li><a href="#shop" onClick={(e) => { e.preventDefault(); setActiveCategory('Tất cả'); setActiveView('shop'); }}>Tất cả sản phẩm</a></li>
                <li><a href="#shop" onClick={(e) => { e.preventDefault(); setActiveCategory('Nam'); setActiveView('shop'); }}>Thời trang Nam</a></li>
                <li><a href="#shop" onClick={(e) => { e.preventDefault(); setActiveCategory('Nữ'); setActiveView('shop'); }}>Thời trang Nữ</a></li>
                <li><a href="#shop" onClick={(e) => { e.preventDefault(); setActiveCategory('Phụ kiện'); setActiveView('shop'); }}>Phụ kiện thời trang</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Socials */}
            <div className="footer-col">
              <h5 className="footer-title">Liên hệ & Kết nối</h5>
              <ul className="footer-contact-list">
                <li><strong>Hotline:</strong> 1900 8080 (9:00 - 22:00)</li>
                <li><strong>Email:</strong> care@minimal.vn</li>
                <li><strong>Địa chỉ:</strong> 136 Hồ Tùng Mậu, Cầu Giấy, Hà Nội</li>
              </ul>
              <div className="footer-social-links">
                <a href="#instagram" className="social-icon-link" onClick={(e) => e.preventDefault()}>Instagram</a>
                <span className="social-divider">•</span>
                <a href="#facebook" className="social-icon-link" onClick={(e) => e.preventDefault()}>Facebook</a>
                <span className="social-divider">•</span>
                <a href="#pinterest" className="social-icon-link" onClick={(e) => e.preventDefault()}>Pinterest</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright-text">© 2026 STUDIO / MINIMAL. All rights reserved.</p>
            <p className="tagline-text">Thiết kế tối giản cho cuộc sống hiện đại.</p>
          </div>
        </div>
      </footer>

      {/* --- Overlay Modals, Drawers & Popups --- */}

      {/* 1. Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 2. Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckoutTrigger}
      />

      {/* 3. Supabase Auth Modal (Login/Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />



      {/* 5. Toast Notifications */}
      <Notification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}

export default App;
