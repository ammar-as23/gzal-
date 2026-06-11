// ================================================
// 🌐 إعدادات Supabase (نفس إعدادات الأدمن)
// ================================================
const SUPABASE_URL = 'https://xlujehjoricmsufcmkyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y2WMvN6Cdxs84tC7ZVqNrA_phvEJpdb';

// قمنا بتغيير الاسم إلى supabaseDb لتجنب أي تعارض مع المكتبة
const supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ================================================
// 📦 إدارة المنتجات
// ================================================
let products = [];
let cart = [];

// جلب المنتجات من قاعدة البيانات
async function loadProducts() {
    if (!supabaseDb) {
        console.error('❌ Supabase not initialized');
        fallbackLoadProducts();
        renderStoreProducts();
        return;
    }
    
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

// منتجات احتياطية في حال فشل الاتصال
function fallbackLoadProducts() {
    const stored = localStorage.getItem('store_products');
    if (stored) {
        products = JSON.parse(stored);
    } else {
        products = [
            { id: 1, name: "Gazal 5050 Super", oldPrice: 399, price: 199, image: "https://i.postimg.cc/9QQ2PFrd/photo-2026-06-09-14-24-06.jpg", description: "الجهاز الأكثر مبيعاً والأرخص! دقة 4K.", inStock: true, hasVip: true },
            { id: 2, name: "Gazal 3030 Forever Super", oldPrice: 450, price: 330, image: "https://i.postimg.cc/66PCxyNR/photo-2026-06-09-14-23-36.jpg", description: "فائق السرعة، 2GB رام، 16GB فلاش.", inStock: true, hasVip: true },
            { id: 3, name: "Gazal Linux Turbo 4K 5G", oldPrice: 599, price: 499, image: "https://i.postimg.cc/m2cNP7Sk/photo-2026-06-09-14-23-23.jpg", description: "لينكس، 5G، دقة 4K فائقة.", inStock: true, hasVip: true },
            { id: 4, name: "Gazal 8080 Super", oldPrice: 499, price: 399, image: "https://i.postimg.cc/SQnD90SQ/Whats-App-Image-2026-06-09-at-11-44-17-PM-(1).jpg", description: "فائق الأداء، أحدث إصدار.", inStock: true, hasVip: true }
        ];
    }
}

// عرض المنتجات في المتجر
function renderStoreProducts() {
    const container = document.getElementById('storeProductsGrid');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;">📭 جاري تحميل المنتجات...</div>';
        return;
    }
    
    let html = '';
    products.forEach(p => {
        const outOfStockClass = !p.inStock ? 'out-of-stock' : '';
        const outOfStockBadge = !p.inStock ? '<div class="out-of-stock-badge">❌ نفد من المخزون</div>' : '';
        html += `
            <div class="product-card ${outOfStockClass}">
                ${outOfStockBadge}
                <div class="product-image">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'">
                </div>
                <div class="product-title">${p.name}</div>
                <div class="description-box">
                    <i class="fas fa-microchip"></i> ${p.description}
                </div>
                <div class="old-price">${p.oldPrice} ريال</div>
                <div class="price">${p.price} <span>ريال</span></div>
                <div class="vip-option">
                    <div class="vip-title"><i class="fas fa-crown"></i> باقة VIP الذهبية</div>
                    <ul class="vip-features">
                        <li>📡 فتح القنوات المشفرة على النايل سات والعرب سات</li>
                        <li>⚽ فتح bein sport max الناقلة لكأس العالم</li>
                        <li>🚀 لا يحتاج إنترنت سريع ولا يوجد أي تأخير أو تقطيع</li>
                        <li>🎬 مشاهدة المباريات بجودة 4K</li>
                    </ul>
                    <div class="vip-price">+ 100 ريال</div>
                    <div class="checkbox-container">
                        <label><i class="fas fa-gem"></i> إضافة باقة VIP</label>
                        <input type="checkbox" class="vip${p.id}" onchange="updateDevicePriceInCart(${p.id})">
                    </div>
                </div>
                <div class="free-delivery"><i class="fas fa-truck-fast"></i> توصيل مجاني</div>
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
    if (!product || !product.inStock) {
        alert('⚠️ هذا المنتج غير متوفر حالياً');
        return;
    }
    
    const checkbox = document.querySelector(`.vip${productId}`);
    const hasVip = checkbox ? checkbox.checked : false;
    const finalPrice = basePrice + (hasVip ? 100 : 0);
    
    const existingItem = cart.find(item => item.id === productId && item.hasVip === hasVip);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.price = finalPrice * existingItem.quantity;
    } else {
        cart.push({ 
            id: productId, 
            name: name, 
            unitPrice: finalPrice,
            price: finalPrice, 
            quantity: 1,
            hasVip: hasVip 
        });
    }
    renderCart();
}

function removeFromCart(productId, hasVip) {
    const index = cart.findIndex(item => item.id === productId && item.hasVip === hasVip);
    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
            cart[index].price = cart[index].unitPrice * cart[index].quantity;
        } else {
            cart.splice(index, 1);
        }
    }
    renderCart();
}

function removeAllFromCart(productId, hasVip) {
    cart = cart.filter(item => !(item.id === productId && item.hasVip === hasVip));
    renderCart();
}

function updateDevicePriceInCart(productId) {
    const checkbox = document.querySelector(`.vip${productId}`);
    if (!checkbox) return;
    
    const hasVip = checkbox.checked;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const unitPrice = product.price + (hasVip ? 100 : 0);
    
    cart.forEach(item => {
        if (item.id === productId) {
            const oldHasVip = item.hasVip;
            if (oldHasVip !== hasVip) {
                item.hasVip = hasVip;
                item.unitPrice = unitPrice;
                item.price = unitPrice * item.quantity;
            }
        }
    });
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');
    const totalSpan = document.querySelector('#cartTotal span');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-basket-shopping"></i> السلة فارغة. أضف أجهزة من الأعلى</div>';
        if (totalSpan) totalSpan.innerText = '0';
        return;
    }
    
    let total = 0;
    let html = '';
    cart.forEach(item => {
        total += item.price;
        const vipBadge = item.hasVip ? ' + باقة VIP 👑' : '';
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}${vipBadge}</div>
                    <div class="cart-item-price">
                        ${item.unitPrice} ريال × ${item.quantity} = <strong>${item.price} ريال</strong>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="remove-item" onclick="removeFromCart(${item.id}, ${item.hasVip})" style="background:#fef3c7;">
                        <i class="fas fa-minus"></i> إنقاص
                    </button>
                    <button class="remove-item" onclick="removeAllFromCart(${item.id}, ${item.hasVip})">
                        <i class="fas fa-trash"></i> حذف الكل
                    </button>
                </div>
            </div>
        `;
    });
    cartContainer.innerHTML = html;
    if (totalSpan) totalSpan.innerText = total;
}

// ================================================
// 💾 حفظ الطلب في Supabase
// ================================================
async function saveOrder(orderData) {
    if (!supabaseDb) {
        console.error('❌ Supabase not initialized');
        return false;
    }
    
    const newOrder = {
        timestamp: new Date().toLocaleString('ar-SA'),
        name: orderData.name,
        mobile: orderData.mobile,
        city: orderData.city,
        items: orderData.items,
        total: orderData.total,
        notes: orderData.notes || '',
        status: 'pending'
    };
    
    try {
        const { error } = await supabaseDb
            .from('orders')
            .insert([newOrder]);
            
        if (error) throw error;
        console.log('✅ تم حفظ الطلب في Supabase');
        return true;
    } catch (error) {
        console.error('❌ فشل حفظ الطلب:', error);
        return false;
    }
}

// ================================================
// 📝 معالجة نموذج الطلب
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    renderCart();
    
    const orderForm = document.getElementById('orderFormElement');
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('⚠️ الرجاء إضافة جهاز واحد على الأقل إلى السلة');
                return;
            }
            
            const fullName = document.getElementById('fullName').value;
            const mobile = document.getElementById('mobile').value;
            const city = document.getElementById('city').value;
            const notes = document.getElementById('notes').value;
            
            if (!fullName || !mobile || !city) {
                alert('⚠️ الرجاء تعبئة جميع الحقول المطلوبة');
                return;
            }
            
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            const itemsText = cart.map(item => `${item.name}${item.hasVip ? ' +VIP' : ''} (${item.unitPrice} ريال) × ${item.quantity}`).join(' | ');
            
            const orderData = {
                name: fullName,
                mobile: mobile,
                city: city,
                items: itemsText,
                total: total,
                notes: notes
            };
            
            const success = await saveOrder(orderData);
            
            if (success) {
                const successMsg = document.getElementById('successMessage');
                if (successMsg) {
                    successMsg.style.display = 'block';
                    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
                }
                
                document.getElementById('orderFormElement').reset();
                cart = [];
                renderCart();
                
                alert('✅ تم استلام طلبك بنجاح! سنتواصل معك قريباً.');
            } else {
                alert('❌ حدث خطأ في إرسال الطلب. الرجاء المحاولة مرة أخرى.');
            }
        });
    }
});
