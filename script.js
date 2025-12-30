const firebaseConfig = {
    apiKey: "AIzaSyDU7Q6LOha4gIBz6HoHyx3Nx7LwWi4dSls",
    authDomain: "ali1-717e6.firebaseapp.com",
    databaseURL: "https://ali1-717e6-default-rtdb.firebaseio.com",
    projectId: "ali1-717e6",
    storageBucket: "ali1-717e6.firebasestorage.app",
    messagingSenderId: "293002535182",
    appId: "1:293002535182:web:ac9be8c8ab5610e2e8375f"
};

// Инициализация Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let products = [];
let cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

// === ГЛАВНАЯ ФУНКЦИЯ ЗАГРУЗКИ (ОПТИМИЗИРОВАНА) ===
async function loadData() {
    try {
        // Используем once вместо on, чтобы не грузить сеть постоянно
        const snapshot = await database.ref('products').once('value');
        const data = snapshot.val();

        products = data ? Object.keys(data).map(key => ({...data[key], id: key })) : [];

        // Сначала рендерим меню, потом убираем прелоадер
        if (document.getElementById('menu-container')) {
            renderMenu('all');
        }

        if (document.getElementById('cart-content')) {
            renderCart();
        }

        updateUI();
        hidePreloader();

        // Запускаем видео и снег только после загрузки данных
        startHeavyAssets();

    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        hidePreloader(); // Убираем лоадер в любом случае, чтобы сайт не завис
    }
}

function hidePreloader() {
    const loader = document.getElementById('preloader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 600);
    }
}

// Загрузка тяжелых ресурсов (видео) в самом конце
function startHeavyAssets() {
    const video = document.getElementById('bg-video');
    if (video) {
        video.load(); // Начинаем загрузку видео только сейчас
    }
    initSnow();
}

// === РЕНДЕР МЕНЮ ===
window.renderMenu = function(category = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;

    // Очищаем контейнер один раз
    container.innerHTML = '';

    const filtered = category === 'all' ? products : products.filter(p => p.cat === category);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 50px;">В этой категории пока пусто...</p>`;
        return;
    }

    // Собираем весь HTML в одну строку (так быстрее для браузера)
    let menuHTML = '';
    filtered.forEach(p => {
        const countTag = p.count ? `<div class="p-tag-count">${p.count}</div>` : '';

        menuHTML += `
            <div class="product-card" onclick="openDetails('${p.id}')">
                <div class="img-wrapper">
                    <img src="${p.img}" 
                         loading="lazy" 
                         alt="${p.name}"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Pai+Pai'">
                    ${countTag}
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-price">${p.price} ₸</div>
                    <button class="btn-sm" onclick="event.stopPropagation(); addToCart('${p.id}')">
                        <i class="fas fa-plus"></i> В КОРЗИНУ
                    </button>
                </div>
            </div>`;
    });

    container.innerHTML = menuHTML;
};

// === МОДАЛЬНОЕ ОКНО ===
window.openDetails = function(id) {
    const p = products.find(i => i.id === id);
    if (!p) return;

    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalName').innerText = p.name;
    document.getElementById('modalDesc').innerText = p.desc || "Традиционный рецепт Pai Pai из свежих ингредиентов.";
    document.getElementById('modalCount').innerText = p.count ? "🍴 Порция: " + p.count : "";
    document.getElementById('modalPrice').innerText = p.price + " ₸";

    const addBtn = document.getElementById('modalAddBtn');
    addBtn.onclick = () => {
        addToCart(id);
        document.getElementById('productModal').style.display = 'none';
    };

    document.getElementById('productModal').style.display = 'flex';
};

window.closeModal = function(e) {
    if (e.target.id === 'productModal') {
        document.getElementById('productModal').style.display = 'none';
    }
};

// === ФИЛЬТРАЦИЯ ===
window.filterMenu = function(cat) {
    // Убираем активный класс у всех
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));

    // Добавляем активный класс нажатой кнопке
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Плавный скролл к началу меню при смене категории (удобно для клиента)
    window.scrollTo({ top: document.getElementById('menu-section').offsetTop - 100, behavior: 'smooth' });

    renderMenu(cat);
};

// === КОРЗИНА ===
window.addToCart = function(id) {
    const p = products.find(i => i.id === id);
    if (!p) return;

    const itemInCart = cart.find(i => i.id === id);
    if (itemInCart) {
        itemInCart.qty++;
    } else {
        cart.push({
            id: p.id,
            name: p.name,
            price: parseInt(p.price),
            img: p.img,
            qty: 1
        });
    }
    saveCart();
    updateUI();

    // Визуальный отклик кнопки
    if (event && event.target) {
        const btn = event.target.closest('.btn-sm');
        if (btn) {
            const oldText = btn.innerHTML;
            btn.innerHTML = "<i class='fas fa-check'></i> ДОБАВЛЕНО";
            btn.style.background = "#28ad21";
            setTimeout(() => {
                btn.innerHTML = oldText;
                btn.style.background = "";
            }, 800);
        }
    }
};

window.renderCart = function() {
    const container = document.getElementById('cart-content');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:80px 20px; opacity:0.5;">
                <i class="fas fa-shopping-basket" style="font-size:3rem; margin-bottom:15px;"></i>
                <p>Корзина пуста</p>
                <br>
                <a href="index.html" class="btn-sm" style="text-decoration:none; display:inline-block; padding:12px 25px;">В МЕНЮ</a>
            </div>`;
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
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
                    <button onclick="changeQty(${index}, -1)" style="width: 28px; height: 28px; border: none; background: var(--primary); color: white; border-radius: 8px; cursor: pointer;">-</button>
                    <span style="font-size: 0.95rem; font-weight: bold;">${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)" style="width: 28px; height: 28px; border: none; background: var(--primary); color: white; border-radius: 8px; cursor: pointer;">+</button>
                </div>
            </div>`;
    });

    const totalPriceEl = document.getElementById('total-price');
    if (totalPriceEl) totalPriceEl.innerText = `Итого: ${total} ₸`;
};

window.changeQty = function(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
    updateUI();
};

window.saveCart = () => localStorage.setItem('pai_pai_cart', JSON.stringify(cart));

window.updateUI = () => {
    const count = document.getElementById('cart-count');
    if (count) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        count.innerText = totalItems;
        count.style.display = totalItems > 0 ? 'flex' : 'none';
    }
};

window.sendOrder = function() {
    if (cart.length === 0) return;
    let text = "🎄 *НОВЫЙ ЗАКАЗ PAI PAI* \n\n";
    cart.forEach(item => {
        text += `• ${item.name} [x${item.qty}] — ${item.price * item.qty} ₸\n`;
    });
    let total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    text += `\n💰 *ОБЩАЯ СУММА: ${total} ₸*`;
    text += `\n\n_Пожалуйста, подтвердите заказ_`;
    window.location.href = `https://wa.me/77052363788?text=${encodeURIComponent(text)}`;
};

// === ЭФФЕКТ СНЕГА ===
function initSnow() {
    const snowContainer = document.body;
    setInterval(() => {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = Math.random() * 4 + 2 + 'px';
        flake.style.cssText = `
            width:${size}; 
            height:${size}; 
            left:${Math.random()*100}vw; 
            position:fixed; 
            top:-10px; 
            background:white; 
            border-radius:50%; 
            pointer-events:none; 
            z-index:9999; 
            opacity:${Math.random() * 0.7};
            animation:fall ${Math.random()*5+5}s linear forwards;
        `;
        snowContainer.appendChild(flake);
        setTimeout(() => flake.remove(), 7000);
    }, 450);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', loadData);