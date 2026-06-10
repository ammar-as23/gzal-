// ================================================
// 🌐 إعدادات Supabase
// ================================================
const SUPABASE_URL = 'https://xlujehjoricsumfcmkyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y2WMvN6Cdxs84tC7ZVqNrA_phvEJpdb';

// تهيئة عميل Supabase
let supabaseDb;
try {
    supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('❌ تنبيه: مكتبة Supabase لم يتم تحميلها بشكل صحيح!', error);
}

// ================================================
// 📦 إدارة المنتجات (Products)
// ================================================
let products = [];
let cart = [];

// جلب المنتجات من قاعدة البيانات
async function loadProducts() {
    try {
        const { data, error } = await supabaseDb
            .from('products')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            products = data;
            localStorage.setItem('store_products', JSON.stringify(products));
        } else {
            fallbackLoadProducts();
        }
        renderStoreProducts();
    } catch (error) {
        console.error('❌ فشل تحميل المنتجات:', error);
        fallbackLoadProducts();
        renderStoreProducts();
    }
}

function fallbackLoadProducts() {
    const stored = localStorage.getItem('store_products');
    if (stored) {
        products = JSON.parse(stored);
    } else {
        products = [
            { id: 1, name: "Gazal 5050 Super", oldPrice: 399, price: 199, image: "https://i.postimg.cc/9QQ2PFrd/photo-2026-06-09-14-24-06.jpg", description: "الجهاز الأكثر مبيعاً والأرخص! دقة 4K.", inStock: true, hasVip: true },
            { id: 2, name: "Gazal 3030 Forever Super", oldPrice: 450, price: 330, image: "https://i.postimg.cc/66PCxyNR/photo-2026-06-09-14-23-36.jpg", description: "فائق السرعة، 2GB رام، 16GB فلاش.", inStock: true, hasVip: true }
        ];
    }
}

function renderStoreProducts() {
    const container = document.getElementById('storeProductsGrid');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;grid-column: 1 / -1;">📭 جاري تحميل المنتجات...</div>';
        return;
    }
    
    let html = '';
    products.forEach(p => {
        const outOfStockClass = !p.inStock ? 'out-of-stock' : '';
        const outOfStockBadge = !p.inStock ? '<div class="out-of-stock-badge">❌ نفد من المخزون</div>' : '';
        html += `
            <div class="product-card ${outOfStockClass}">
                ${outOfStockBadge}
                <div class="product-image"><img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'"></div>
                <div class="product-title">${p.name}</div>
                <div class="description-box"><i class="fas fa-microchip"></i> ${p.description}</div>
                <div class="old-price">${p.oldPrice} ريال</div>
                <div class="price">${p.price} <span>ريال</span></div>
                <div class="vip-option">
                    <div class="vip-title"><i class="fas fa-crown"></i> باقة VIP الذهبية</div>
                    <div class="checkbox-container">
                        <label><i class="fas fa-gem"></i> إضافة باقة VIP</label>
                        <input type="checkbox" class="vip${p.id}" onchange="updateDevicePriceInCart(${p.id})">
                    </div>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price})" ${!p.inStock ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i> إضافة إلى السلة
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ================================================
// 🛒 سلة المشتريات
// ================================================
function addToCart(productId, name, basePrice) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;
    
    const checkbox = document.querySelector(`.vip${productId}`);
    const hasVip = checkbox ? checkbox.checked : false;
    const finalPrice = basePrice + (hasVip ? 100 : 0);
    
    const existingItem = cart.find(item => item.id === productId && item.hasVip === hasVip);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.price = finalPrice * existingItem.quantity;
    } else {
        cart.push({ id: productId, name: name, unitPrice: finalPrice, price: finalPrice, quantity: 1, hasVip: hasVip });
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');
    const totalSpan = document.querySelector('#cartTotal span');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">السلة فارغة</div>';
        if (totalSpan) totalSpan.innerText = '0';
        return;
    }
    
    let total = 0;
    let html = '';
    cart.forEach(item => {
        total += item.price;
        html += `<div class="cart-item">${item.name} × ${item.quantity} = ${item.price} ريال</div>`;
    });
    cartContainer.innerHTML = html;
    if (totalSpan) totalSpan.innerText = total;
}

// ================================================
// 📋 إرسال الطلب (بدون ID يدوي)
// ================================================
async function saveOrderToDatabase(orderData) {
    // نرسل البيانات فقط، وقاعدة البيانات ستتولى إنشاء الـ ID تلقائياً
    const newOrder = {
        name: orderData.name,
        mobile: orderData.mobile,
        city: orderData.city,
        items: orderData.items,
        total: orderData.total,
        notes: orderData.notes,
        status: 'pending' 
    };
    
    try {
        const { error } = await supabaseDb
            .from('orders')
            .insert([newOrder]);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        return false;
    }
}

// ================================================
// 📝 معالجة النموذج
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    const orderForm = document.getElementById('orderFormElement');
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const orderData = {
                name: document.getElementById('fullName').value,
                mobile: document.getElementById('mobile').value,
                city: document.getElementById('city').value,
                items: cart.map(i => i.name).join(' | '),
                total: cart.reduce((s, i) => s + i.price, 0),
                notes: document.getElementById('notes').value
            };
            
            const isSuccess = await saveOrderToDatabase(orderData);
            if (isSuccess) {
                alert('✅ تم إرسال الطلب!');
                orderForm.reset();
                cart = [];
                renderCart();
            } else {
                alert('❌ فشل الإرسال.');
            }
        });
    }
});
