// ================================================
// 🔐 كلمة السر
// ================================================
const ADMIN_PASSWORD = "admin123";

// ================================================
// 🌐 إعدادات Supabase
// ================================================
const SUPABASE_URL = 'https://xlujehjoricmsufcmkyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y2WMvN6Cdxs84tC7ZVqNrA_phvEJpdb';

// تهيئة عميل Supabase بشكل آمن
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('❌ تنبيه: مكتبة Supabase لم يتم تحميلها في ملف HTML!', error);
}

// ================================================
// 📧 إعدادات EmailJS
// ================================================
const EMAILJS_PUBLIC_KEY = "mOOnLVPcEPY9R6mY3";     
const EMAILJS_SERVICE_ID = "service_bo95msl";    
const EMAILJS_TEMPLATE_ID = "template_cl5kubq";  
const ADMIN_EMAIL = "ammarabusnaineh38@gmail.com";       

// تهيئة EmailJS بشكل آمن
try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
} catch (error) {
    console.error('❌ تنبيه: مكتبة EmailJS لم يتم تحميلها في ملف HTML!', error);
}

// ================================================
// 🔐 دالة تسجيل الدخول
// ================================================
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
        order_date: orderData.timestamp || orderData.date,
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
// 📦 إدارة المنتجات (متصلة بقاعدة البيانات)
// ================================================
let products = [];

async function loadProductsData() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        if (data) {
            products = data;
        }
        updateProductsStats();
        renderProductsList();
    } catch (error) {
        console.error('❌ فشل تحميل المنتجات:', error);
    }
}

function updateProductsStats() {
    const totalSpan = document.getElementById('totalProducts');
    if (totalSpan) totalSpan.innerText = products.length;
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

async function toggleStock(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const newStockStatus = !product.inStock;
        product.inStock = newStockStatus;
        renderProductsList();
        
        try {
            const { error } = await supabase
                .from('products')
                .update({ inStock: newStockStatus })
                .eq('id', productId);
                
            if (error) throw error;
        } catch (error) {
            console.error('❌ فشل تحديث المخزون:', error);
            product.inStock = !newStockStatus;
            renderProductsList();
        }
    }
}

async function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
                
            if (error) throw error;
            
            products = products.filter(p => p.id !== productId);
            renderProductsList();
            updateProductsStats();
        } catch (error) {
            console.error('❌ فشل الحذف:', error);
            alert('حدث خطأ أثناء محاولة حذف المنتج من السيرفر.');
        }
    }
}

async function addNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const oldPrice = parseInt(document.getElementById('newOldPrice').value);
    const price = parseInt(document.getElementById('newPrice').value);
    const image = document.getElementById('newImageUrl').value.trim();
    const description = document.getElementById('newDescription').value.trim();
    
    if (!name || !price) {
        alert('الرجاء تعبئة اسم المنتج والسعر');
        return;
    }
    
    const newProduct = {
        id: Date.now(),
        name: name,
        oldPrice: oldPrice || price + 100,
        price: price,
        image: image || 'https://via.placeholder.com/200',
        description: description || 'وصف المنتج',
        inStock: true,
        hasVip: true
    };
    
    try {
        const { error } = await supabase
            .from('products')
            .insert([newProduct]);
            
        if (error) throw error;
        
        products.push(newProduct);
        renderProductsList();
        updateProductsStats();
        
        document.getElementById('newProductName').value = '';
        document.getElementById('newOldPrice').value = '';
        document.getElementById('newPrice').value = '';
        document.getElementById('newImageUrl').value = '';
        document.getElementById('newDescription').value = '';
        
        alert('✅ تم إضافة المنتج بنجاح!');
        showTab('products');
        
    } catch (error) {
        console.error('❌ فشل الإضافة:', error);
        alert('حدث خطأ أثناء محاولة إضافة المنتج للسيرفر.');
    }
}

// ================================================
// 📋 إدارة الطلبات (متصلة بقاعدة البيانات)
// ================================================
let orders = [];
let lastOrderCount = 0;

async function loadOrdersData() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (data) {
            orders = data;
        }
        
        updateOrdersStats();
        renderOrdersList();
        checkForNewOrders();
        
    } catch (error) {
        console.error('❌ فشل تحميل الطلبات:', error);
    }
}

function updateOrdersStats() {
    const totalSpan = document.getElementById('totalOrders');
    const pendingSpan = document.getElementById('pendingOrders');
    if (totalSpan) totalSpan.innerText = orders.length;
    if (pendingSpan) {
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        pendingSpan.innerText = pendingCount;
    }
}

function checkForNewOrders() {
    const currentCount = orders.length;
    if (currentCount > lastOrderCount && lastOrderCount !== 0) {
        const newOrder = orders[0];
        if (newOrder && newOrder.status === 'pending') {
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
                <td>${order.timestamp || order.date || '-'}</td>
                <td>${order.name}</td>
                <td dir="ltr" style="text-align:right;">${order.mobile}</td>
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
        
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);
                
            if (error) throw error;
            
            order.status = newStatus;
            renderOrdersList();
            updateOrdersStats();
            
            if (oldStatus === 'pending' && newStatus !== 'pending') {
                await sendEmailNotification(order, newStatus);
                alert(`✅ تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} الطلب وإرسال إشعار إلى البريد الإلكتروني`);
            }
            
        } catch (error) {
            console.error('❌ فشل تحديث حالة الطلب:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب.');
        }
    }
}

async function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);
                
            if (error) throw error;
            
            orders = orders.filter(o => o.id !== orderId);
            renderOrdersList();
            updateOrdersStats();
            
        } catch (error) {
            console.error('❌ فشل حذف الطلب:', error);
            alert('حدث خطأ أثناء محاولة حذف الطلب.');
        }
    }
}

// ================================================
// 🔄 علامات التبويب والتحديث التلقائي
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

setInterval(() => {
    if (document.getElementById('adminPanel') && document.getElementById('adminPanel').style.display === 'block') {
        loadOrdersData();
    }
}, 10000);
