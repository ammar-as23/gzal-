// ================================================
// 🌐 إعدادات Supabase
// ================================================

const SUPABASE_URL = 'https://xlujehjoricmsufcmkyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y2WMvN6Cdxs84tC7ZVqNrA_phvEJpdb';

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================================
// 🔐 كلمة السر
// ================================================
const ADMIN_PASSWORD = "admin123";

// ================================================
// 📧 إعدادات EmailJS (غيّر هذه القيم بعد التسجيل في EmailJS)
// ================================================
// 🔴 قم بالتسجيل في https://www.emailjs.com ثم ضع القيم التالية:
const EMAILJS_PUBLIC_KEY = "mOOnLVPcEPY9R6mY3";     // 🔴 غير هذا
const EMAILJS_SERVICE_ID = "service_bo95msl";    // 🔴 غير هذا
const EMAILJS_TEMPLATE_ID = "template_cl5kubq";  // 🔴 غير هذا
const ADMIN_EMAIL = "ammarabusnaineh38@gmail.com";       // 🔴 بريدك أنت
// تحميل EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

function checkLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadAllData();
    } else {
        alert('❌ كلمة السر غير صحيحة!');
    }
}

// ================================================
// 📧 إرسال إشعار إيميل
// ================================================
async function sendEmailNotification(orderData, action) {
    const templateParams = {
        to_email: ADMIN_EMAIL,
        customer_name: orderData.name,
        customer_mobile: orderData.mobile,
        customer_city: orderData.city,
        order_items: orderData.items,
        order_total: orderData.total,
        order_notes: orderData.notes || 'لا توجد ملاحظات',
        order_date: orderData.date,
        action: action,
        site_url: window.location.origin
    };
    
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.log('✅ تم إرسال الإشعار بنجاح');
    } catch (error) {
        console.error('❌ فشل إرسال الإشعار:', error);
    }
}

// ================================================
// 📦 إدارة المنتجات
// ================================================
let products = [];

function loadProductsData() {
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
        saveProducts();
    }
    updateProductsStats();
    renderProductsList();
}

function saveProducts() {
    //localStorage.setItem('store_products', JSON.stringify(products));

    async function saveProducts() {
        // 1. نُبقي على الحفظ المحلي كإجراء احتياطي ولتسريع تحميل الواجهة
        localStorage.setItem('store_products', JSON.stringify(products));
    
        // 2. الحفظ والتحديث في قاعدة بيانات Supabase
        try {
            const { data, error } = await supabase
                .from('products')
                .upsert(products); // تقوم بالإضافة (Insert) أو التحديث (Update) بناءً على الـ id
    
            if (error) {
                throw error;
            }
    
            console.log('✅ تم حفظ/تحديث المنتجات في قاعدة البيانات بنجاح');
            
        } catch (error) {
            console.error('❌ حدث خطأ أثناء الحفظ في قاعدة البيانات:', error);
            alert('حدث خطأ أثناء حفظ التعديلات في السيرفر، يرجى المحاولة مرة أخرى.');
        }
    }
}

function updateProductsStats() {
    document.getElementById('totalProducts').innerText = products.length;
}

function renderProductsList() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;">📭 لا توجد منتجات</div>';
        return;
    }
    
    let html = '';
    products.forEach(p => {
        html += `
            <div class="product-card-admin">
                <div style="display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                    <img src="${p.image}" style="width:60px;height:60px;object-fit:contain;background:#f1f5f9;border-radius:12px;" onerror="this.src='https://via.placeholder.com/60'">
                    <div>
                        <strong style="font-size:16px;">${p.name}</strong>
                        <div style="font-size:12px;color:#64748b;">${p.price} ريال <span style="text-decoration:line-through;color:#94a3b8;">${p.oldPrice} ريال</span></div>
                    </div>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <span class="status-badge ${p.inStock ? 'status-available' : 'status-out'}">${p.inStock ? '● متوفر' : '● نفد من المخزون'}</span>
                    <button class="btn-success" onclick="toggleStock(${p.id})">${p.inStock ? '🔴 تعيين نفد' : '🟢 تعيين متوفر'}</button>
                    <button class="btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleStock(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.inStock = !product.inStock;
        saveProducts();
        renderProductsList();
    }
}

function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        renderProductsList();
        updateProductsStats();
    }
}

function addNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const oldPrice = parseInt(document.getElementById('newOldPrice').value);
    const price = parseInt(document.getElementById('newPrice').value);
    const image = document.getElementById('newImageUrl').value.trim();
    const description = document.getElementById('newDescription').value.trim();
    
    if (!name || !price) {
        alert('الرجاء تعبئة اسم المنتج والسعر');
        return;
    }
    
    const newId = Date.now();
    products.push({
        id: newId,
        name: name,
        oldPrice: oldPrice || price + 100,
        price: price,
        image: image || 'https://via.placeholder.com/200',
        description: description || 'وصف المنتج',
        inStock: true,
        hasVip: true
    });
    
    saveProducts();
    renderProductsList();
    updateProductsStats();
    
    document.getElementById('newProductName').value = '';
    document.getElementById('newOldPrice').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newImageUrl').value = '';
    document.getElementById('newDescription').value = '';
    
    alert('✅ تم إضافة المنتج بنجاح!');
    showTab('products');
}

// ================================================
// 📋 إدارة الطلبات
// ================================================
let orders = [];

function loadOrdersData() {
    const stored = localStorage.getItem('admin_orders');
    if (stored) {
        orders = JSON.parse(stored);
    } else {
        orders = [];
        saveOrders();
    }
    updateOrdersStats();
    renderOrdersList();
    
    // التحقق من الطلبات الجديدة وإرسال إشعار
    checkForNewOrders();
}

function saveOrders() {
    localStorage.setItem('admin_orders', JSON.stringify(orders));
}

function updateOrdersStats() {
    document.getElementById('totalOrders').innerText = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    document.getElementById('pendingOrders').innerText = pendingCount;
}

// تتبع الطلبات الجديدة
let lastOrderCount = 0;

function checkForNewOrders() {
    const currentCount = orders.length;
    if (currentCount > lastOrderCount) {
        const newOrder = orders[0];
        if (newOrder.status === 'pending') {
            sendEmailNotification(newOrder, 'new_order');
        }
    }
    lastOrderCount = currentCount;
}

function renderOrdersList() {
    const tbody = document.getElementById('ordersList');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;">📭 لا توجد طلبات بعد</td></tr>';
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        let statusClass = '';
        let statusText = '';
        if (order.status === 'pending') { statusClass = 'status-pending'; statusText = '⏳ قيد المراجعة'; }
        else if (order.status === 'approved') { statusClass = 'status-approved'; statusText = '✅ تم القبول'; }
        else if (order.status === 'rejected') { statusClass = 'status-rejected'; statusText = '❌ مرفوض'; }
        
        html += `
            <tr>
                <td>${order.date}</td>
                <td>${order.name}</td>
                <td>${order.mobile}</td>
                <td>${order.city}</td>
                <td style="max-width:200px;word-break:break-word;">${order.items}</td>
                <td>${order.total} ريال</td>
                <td style="max-width:150px;word-break:break-word;">${order.notes || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        ${order.status === 'pending' ? `
                            <button class="btn-success" onclick="updateOrderStatus(${order.id}, 'approved')"><i class="fas fa-check"></i> قبول</button>
                            <button class="btn-danger" onclick="updateOrderStatus(${order.id}, 'rejected')"><i class="fas fa-times"></i> رفض</button>
                        ` : ''}
                        <button class="btn-warning" onclick="deleteOrder(${order.id})"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

async function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const oldStatus = order.status;
        order.status = newStatus;
        saveOrders();
        renderOrdersList();
        updateOrdersStats();
        
        if (oldStatus === 'pending' && newStatus !== 'pending') {
            await sendEmailNotification(order, newStatus);
            alert(`✅ تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} الطلب وإرسال إشعار إلى البريد الإلكتروني`);
        }
    }
}

function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        orders = orders.filter(o => o.id !== orderId);
        saveOrders();
        renderOrdersList();
        updateOrdersStats();
    }
}

// ================================================
// 🔄 علامات التبويب
// ================================================
function showTab(tabName) {
    document.getElementById('productsTab').classList.remove('active');
    document.getElementById('addProductTab').classList.remove('active');
    document.getElementById('ordersTab').classList.remove('active');
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'products') {
        document.getElementById('productsTab').classList.add('active');
        document.querySelector('.admin-tab-btn:first-child').classList.add('active');
        renderProductsList();
    } else if (tabName === 'add-product') {
        document.getElementById('addProductTab').classList.add('active');
        document.querySelector('.admin-tab-btn:nth-child(2)').classList.add('active');
    } else if (tabName === 'orders') {
        document.getElementById('ordersTab').classList.add('active');
        document.querySelector('.admin-tab-btn:nth-child(3)').classList.add('active');
        renderOrdersList();
    }
}

function loadAllData() {
    loadProductsData();
    loadOrdersData();
}

// تحديث الطلبات كل 5 ثوانٍ
setInterval(() => {
    if (document.getElementById('adminPanel').style.display === 'block') {
        loadOrdersData();
    }
}, 5000);
