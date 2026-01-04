const firebaseConfig = {
    apiKey: "AIzaSyDU7Q6LOha4gIBz6HoHyx3Nx7LwWi4dSls",
    authDomain: "ali1-717e6.firebaseapp.com",
    databaseURL: "https://ali1-717e6-default-rtdb.firebaseio.com",
    projectId: "ali1-717e6",
    storageBucket: "ali1-717e6.firebasestorage.app",
    messagingSenderId: "293002535182",
    appId: "1:293002535182:web:ac9be8c8ab5610e2e8375f"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let products = [];
let cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

async function loadData() {
    try {
        const snapshot = await database.ref('products').once('value');
        const data = snapshot.val();
        products = data ? Object.keys(data).map(key => ({...data[key], id: key })) : [];

        // Синхронизируем корзину при загрузке
        cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

        if (document.getElementById('cart-content')) {
            renderCart();
        }

        updateUI();
        hidePreloader();
        checkWorkStatus();
        startHeavyAssets();
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        hidePreloader();
    }
}

function hidePreloader() {
    const loader = document.getElementById('preloader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 600);
    }
}

function startHeavyAssets() {
    const video = document.getElementById('bg-video');
    if (video) video.load();
    initSnow();
}

window.showCategories = function() {
    const catScreen = document.getElementById('categories-screen');
    const menuScreen = document.getElementById('menu-screen');
    if (catScreen) catScreen.style.display = 'flex';
    if (menuScreen) menuScreen.style.display = 'none';
};

window.filterCat = function(cat, btn) {
    const catScreen = document.getElementById('categories-screen');
    const menuScreen = document.getElementById('menu-screen');
    const title = btn.querySelector('span').innerText;

    if (catScreen) catScreen.style.display = 'none';
    if (menuScreen) menuScreen.style.display = 'block';

    document.getElementById('current-category-title').innerText = title;

    const searchInput = document.getElementById('menu-search');
    if (searchInput) searchInput.value = '';

    renderMenu(cat);
    window.scrollTo({ top: document.getElementById('menu-section').offsetTop - 20, behavior: 'smooth' });
};

window.renderMenu = function(category = 'all', filteredData = null) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';
    const dataToRender = filteredData ? filteredData : (category === 'all' ? products : products.filter(p => p.category === category || p.cat === category));

    if (dataToRender.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 50px;">В этой категории пока пусто...</p>`;
        return;
    }

    let menuHTML = '';
    dataToRender.forEach(p => {
        const countTag = p.count ? `<div class="p-tag-count">${p.count}</div>` : '';
        let badgeHTML = '';
        if (p.badge === 'hit') badgeHTML = `<div class="product-badge badge-hit">ХИТ 🔥</div>`;
        else if (p.badge === 'new') badgeHTML = `<div class="product-badge badge-new">НОВИНКА ✨</div>`;

        menuHTML += `
            <div class="product-card" onclick="openDetails('${p.id}')">
                <div class="img-wrapper">
                    <img src="${p.img}" loading="lazy" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Pai+Pai'">
                    ${countTag}
                    ${badgeHTML} 
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-price">${p.price} ₸</div>
                    <button class="btn-sm" onclick="event.stopPropagation(); addToCart('${p.id}', this)">
                        <i class="fas fa-plus"></i> В КОРЗИНУ
                    </button>
                </div>
            </div>`;
    });
    container.innerHTML = menuHTML;
};

window.openDetails = function(id) {
    const p = products.find(i => i.id === id);
    if (!p) return;

    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalName').innerText = p.name;
    document.getElementById('modalDesc').innerText = p.desc || "Традиционный рецепт Pai Pai.";
    document.getElementById('modalCount').innerText = p.count ? "🍴 " + p.count : "";
    document.getElementById('modalPrice').innerText = p.price + " ₸";

    const upsellContainer = document.getElementById('upsell-container');
    upsellContainer.innerHTML = '';
    const extraItems = products.filter(item => (item.category === 'sauce' || item.cat === 'sauce') && item.id !== id).slice(0, 3);

    if (extraItems.length > 0) {
        let upsellHTML = `<p class="upsell-title" style="margin-top:15px; font-size:0.9rem; color:#c48c5d;">С этим часто берут:</p><div class="upsell-list" style="display:flex; gap:10px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">`;
        extraItems.forEach(item => {
            upsellHTML += `
                <div class="upsell-item" onclick="addToCart('${item.id}')" style="min-width:80px; text-align:center; background:rgba(255,255,255,0.05); padding:8px; border-radius:10px; border:1px solid rgba(196,140,93,0.2);">
                    <img src="${item.img}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
                    <div style="font-size:0.7rem; margin-top:5px; line-height:1;">${item.name}</div>
                    <small style="color:#c48c5d;">+${item.price} ₸</small>
                </div>`;
        });
        upsellHTML += `</div>`;
        upsellContainer.innerHTML = upsellHTML;
    }

    const addBtn = document.getElementById('modalAddBtn');
    addBtn.onclick = () => {
        addToCart(id);
        document.getElementById('productModal').style.display = 'none';
    };
    document.getElementById('productModal').style.display = 'flex';
};

// --- ДОБАВЛЕНИЕ (СИНХРОННОЕ) ---
window.addToCart = function(id, btnElement = null) {
    // ШАГ 1: Перед добавлением подтягиваем актуальную корзину из памяти
    cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

    const p = products.find(i => i.id === id);
    if (!p) return;

    const item = cart.find(i => i.id === id);
    if (item) item.qty++;
    else cart.push({ id: p.id, name: p.name, price: parseInt(p.price), img: p.img, qty: 1 });

    saveCart();
    updateUI();

    // Если модалка корзины открыта — обновляем её контент
    if (document.getElementById('cart-content')) {
        renderCart();
    }

    if (btnElement) {
        const oldText = btnElement.innerHTML;
        btnElement.innerHTML = "<i class='fas fa-check'></i> ДОБАВЛЕНО";
        btnElement.style.background = "#2ecc71";
        setTimeout(() => {
            btnElement.innerHTML = oldText;
            btnElement.style.background = "";
        }, 800);
    }
};

// --- ОБНОВЛЕННЫЙ КРАСИВЫЙ ЗАКАЗ (НОВОГОДНИЙ ВАЙБ) ---
window.confirmAndSendOrder = function() {
    // Свежие данные из корзины
    cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

    if (cart.length === 0) {
        alert("Братан, корзина пуста!");
        return;
    }

    const address = document.getElementById('order-address').value;
    const persons = document.getElementById('order-persons').value || '1';

    if (!address) {
        alert("Укажите адрес!");
        return;
    }

    // Формируем текст. Используем только те эмодзи, которые понимает WhatsApp Web и Mobile одинаково.
    let text = "🎄 *НОВЫЙ ЗАКАЗ PAI PAI* 🎄\n";
    text += "==========================\n";
    text += "❄️ *СОСТАВ ЗАКАЗА:* ❄️\n\n";

    cart.forEach((item, index) => {
        // Убрал сложные символы веток, оставил точку - это самый надежный вариант
        text += `${index + 1}. *${item.name}*\n`;
        text += `   • ${item.qty} шт. x ${item.price} = ${item.price * item.qty} тг\n`;
    });

    let total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    text += "\n==========================\n";
    text += `✅ *ИТОГО К ОПЛАТЕ: ${total} тг*\n`;
    text += "==========================\n\n";
    text += `📍 *АДРЕС:* ${address}\n`;
    text += `🍴 *ПРИБОРЫ:* ${persons} чел.\n\n`;
    text += "⛄ _Ждем ваш заказ!_ ✨";

    const phone = "77052363788";

    // ВАЖНЫЙ МОМЕНТ: используем современный способ формирования ссылки
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
};
window.renderCart = function() {
    const container = document.getElementById('cart-content');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    // ВАЖНО: берем свежак из памяти
    cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:80px 20px; opacity:0.5;"><p>Корзина пуста</p></div>`;
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
    container.style.maxHeight = 'none';
    container.style.overflowY = 'visible';

    container.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="cart-item" style="display: flex; align-items: center; background: rgba(255,255,255,0.05); margin-bottom: 10px; padding: 10px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); gap: 12px;">
                <img src="${item.img}" style="width: 55px; height: 55px; border-radius: 10px; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <h4 style="font-size: 0.9rem; margin: 0;">${item.name}</h4>
                    <p style="color: #c48c5d; font-size: 0.85rem; font-weight: bold; margin-top: 3px;">${item.price} ₸</p>
                </div>
                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 3px; gap: 10px;">
                    <button onclick="changeQty(${index}, -1)" style="width: 28px; height: 28px; border: none; background: #c48c5d; color: white; border-radius: 8px;">-</button>
                    <span style="font-size: 0.95rem; font-weight: bold;">${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)" style="width: 28px; height: 28px; border: none; background: #c48c5d; color: white; border-radius: 8px;">+</button>
                </div>
            </div>`;
    });

    const totalElem = document.getElementById('total-price');
    if (totalElem) totalElem.innerText = `Итого: ${total} ₸`;
};

window.searchMenu = function() {
    const query = document.getElementById('menu-search').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderMenu(null, filtered);
};

function checkWorkStatus() {
    const badge = document.getElementById('work-status-badge');
    if (!badge) return;
    const hours = new Date(new Date().getTime() + (5 * 3600000)).getUTCHours();
    if (hours >= 8 && hours < 22) badge.innerHTML = `<span style="color: #2ecc71;"><i class="fas fa-circle"></i> МЫ ОТКРЫТЫ</span>`;
    else badge.innerHTML = `<span style="color: #e74c3c;"><i class="fas fa-clock"></i> СЕЙЧАС ЗАКРЫТО</span>`;
}

window.changeQty = (index, delta) => {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
    updateUI();
};

window.saveCart = () => localStorage.setItem('pai_pai_cart', JSON.stringify(cart));

window.updateUI = () => {
    // ВАЖНО: обновляем локальную переменную перед подсчетом
    cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];
    const count = document.getElementById('cart-count');
    if (count) {
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        count.innerText = total;
        count.style.display = total > 0 ? 'flex' : 'none';
    }
};

window.closeModal = (e) => { if (e.target.id === 'productModal') document.getElementById('productModal').style.display = 'none'; };
window.sendOrder = () => { document.getElementById('orderModal').style.display = 'flex'; };

function initSnow() {
    setInterval(() => {
        const flake = document.createElement('div');
        const size = Math.random() * 4 + 2 + 'px';
        flake.style.cssText = `width:${size}; height:${size}; left:${Math.random()*100}vw; position:fixed; top:-10px; background:white; border-radius:50%; pointer-events:none; z-index:9999; opacity:${Math.random() * 0.7}; animation:fall ${Math.random()*5+5}s linear forwards;`;
        document.body.appendChild(flake);
        setTimeout(() => flake.remove(), 7000);
    }, 450);
}

document.addEventListener('DOMContentLoaded', loadData);