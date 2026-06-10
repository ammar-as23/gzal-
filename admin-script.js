// ================================================
// 🔐 كلمة السر وإعدادات Supabase
// ================================================
const ADMIN_PASSWORD = "admin123";
const SUPABASE_URL = 'https://xlujehjoricsumfcmkyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y2WMvN6Cdxs84tC7ZVqNrA_phvEJpdb';

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let products = [];
let orders = [];

// ================================================
// 🔐 تسجيل الدخول
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
// 📦 إدارة المنتجات
// ================================================
async function loadProductsData() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('price', { ascending: true }); // الأرخص أولاً
            
        if (error) throw error;
        products = data;
        updateProductsStats();
        renderProductsList();
    } catch (error) {
        console.error('❌ فشل تحميل المنتجات:', error);
        products = [];
        renderProductsList();
    }
}

async function updateProductInSupabase(product) {
    try {
        const { error } = await supabase
            .from('products')
            .update({
                name: product.name,
                "oldPrice": product.oldPrice,
                price: product.price,
                image: product.image,
                description: product.description,
                "inStock": product.inStock,
                "hasVip": product.hasVip
            })
            .eq('id', product.id);
            
        if (error) throw error;
        console.log('✅ تم تحديث المنتج:', product.name);
        return true;
    } catch (error) {
        console.error('❌ فشل تحديث المنتج:', error);
        return false;
    }
}

async function addProductToSupabase(product) {
    try {
        const { error } = await supabase
            .from('products')
            .insert([product]);
            
        if (error) throw error;
        console.log('✅ تم إضافة المنتج:', product.name);
        return true;
    } catch (error) {
        console.error('❌ فشل إضافة المنتج:', error);
        return false;
    }
}

async function deleteProductFromSupabase(productId) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (error) throw error;
        console.log('✅ تم حذف المنتج');
        return true;
    } catch (error) {
        console.error('❌ فشل حذف المنتج:', error);
        return false;
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
        product.inStock = !product.inStock;
        const success = await updateProductInSupabase(product);
        if (success) {
            renderProductsList();
        } else {
            // التراجع عن التغيير إذا فشل
            product.inStock = !product.inStock;
        }
    }
}

async function deleteProduct(productId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    const productName = products.find(p => p.id === productId)?.name;
    const success = await deleteProductFromSupabase(productId);
    
    if (success) {
        products = products.filter(p => p.id !== productId);
        renderProductsList();
        updateProductsStats();
        alert(`✅ تم حذف المنتج "${productName}" بنجاح`);
    } else {
        alert('❌ فشل حذف المنتج');
    }
}

async function addNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const oldPrice = parseInt(document.getElementById('newOldPrice').value);
    const price = parseInt(document.getElementById('newPrice').value);
    const image = document.getElementById('newImageUrl').value.trim();
    const description = document.getElementById('newDescription').value.trim();
    
    if (!name || !price) {
        alert('⚠️ الرجاء تعبئة اسم المنتج والسعر');
        return;
    }
    
    const newId = Date.now();
    const newProduct = {
        id: newId,
        name: name,
        oldPrice: oldPrice || price + 100,
        price: price,
        image: image || 'https://via.placeholder.com/200',
        description: description || 'وصف المنتج',
        inStock: true,
        hasVip: true
    };
    
    const success = await addProductToSupabase(newProduct);
    
    if (success) {
        products.push(newProduct);
        renderProductsList();
        updateProductsStats();
        
        // تفريغ النموذج
        document.getElementById('newProductName').value = '';
        document.getElementById('newOldPrice').value = '';
        document.getElementById('newPrice').value = '';
        document.getElementById('newImageUrl').value = '';
        document.getElementById('newDescription').value = '';
        
        alert(`✅ تم إضافة المنتج "${name}" بنجاح!`);
        showTab('products');
    } else {
        alert('❌ فشل إضافة المنتج');
    }
}

// ================================================
// 📋 إدارة الطلبات
// ================================================
async function loadOrdersData() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('id', { ascending: false });
            
        if (error) throw error;
        orders = data;
        updateOrdersStats();
        renderOrdersList();
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
        order.status = newStatus;
        
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
            
        if (error) {
            console.error('❌ فشل تحديث الحالة:', error);
            alert('حدث خطأ في تحديث الحالة');
            return;
        }
        
        renderOrdersList();
        updateOrdersStats();
        alert(`✅ تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`);
    }
}

async function deleteOrder(orderId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
        
    if (error) {
        console.error('❌ فشل حذف الطلب:', error);
        alert('حدث خطأ في حذف الطلب');
        return;
    }
    
    orders = orders.filter(o => o.id !== orderId);
    renderOrdersList();
    updateOrdersStats();
    alert('✅ تم حذف الطلب بنجاح');
}

// ================================================
// 🔄 علامات التبويب
// ================================================
function showTab(tabName) {
    const productsTab = document.getElementById('productsTab');
    const addProductTab = document.getElementById('addProductTab');
    const ordersTab = document.getElementById('ordersTab');
    
    if (productsTab) productsTab.classList.remove('active');
    if (addProductTab) addProductTab.classList.remove('active');
    if (ordersTab) ordersTab.classList.remove('active');
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'products') {
        if (productsTab) productsTab.classList.add('active');
        document.querySelectorAll('.admin-tab-btn')[0]?.classList.add('active');
        renderProductsList();
    } else if (tabName === 'add-product') {
        if (addProductTab) addProductTab.classList.add('active');
        document.querySelectorAll('.admin-tab-btn')[1]?.classList.add('active');
    } else if (tabName === 'orders') {
        if (ordersTab) ordersTab.classList.add('active');
        document.querySelectorAll('.admin-tab-btn')[2]?.classList.add('active');
        renderOrdersList();
    }
}

function loadAllData() {
    loadProductsData();
    loadOrdersData();
}
