// ================================================
// 📦 إدارة المنتجات (نسخة محسنة)
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

// تحديث منتج موجود (مثل تغيير حالة التوفر)
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

// إضافة منتج جديد
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

// حذف منتج
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
            // تحديث المتجر أيضاً (اختياري)
            // await loadProductsData();
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
    
    const newId = Date.now(); // استخدام timestamp كمعرف فريد
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
