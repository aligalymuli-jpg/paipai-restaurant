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

// 1. ЗАГРУЗКА ИЗ FIREBASE
database.ref('products').on('value', (snapshot) => {
    const data = snapshot.val();
    products = data ? Object.keys(data).map(key => ({...data[key], id: key })) : [];

    if (document.getElementById('menu-container')) renderMenu('all');
    if (document.getElementById('cart-content')) renderCart();
    updateUI();
});

// 2. ОТРИСОВКА МЕНЮ
window.renderMenu = function(category = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';
    const filtered = category === 'all' ? products : products.filter(p => p.cat === category);

    filtered.forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-price">${p.price} ₸</div>
                    <button class="btn-sm" onclick="addToCart('${p.id}')">В корзину</button>
                </div>
            </div>`;
    });
};

window.filterMenu = function(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (event) event.target.classList.add('active');
    renderMenu(cat);
};

// 3. ЛОГИКА КОРЗИНЫ
window.addToCart = function(id) {
    const p = products.find(i => i.id === id);
    if (!p) return;
    const itemInCart = cart.find(i => i.id === id);
    if (itemInCart) {
        itemInCart.qty++;
    } else {
        cart.push({ id: p.id, name: p.name, price: parseInt(p.price), img: p.img, qty: 1 });
    }
    saveCart();
    updateUI();
    alert(`✅ ${p.name} в корзине!`);
};

window.renderCart = function() {
    const container = document.getElementById('cart-content');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.6;"><h3>Корзина пуста 🎄</h3></div>`;
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}">
                <div style="flex-grow:1;">
                    <h4 style="font-size:0.9rem; margin:0;">${item.name}</h4>
                    <p style="color:#c48c5d; font-weight:bold; margin:3px 0;">${item.price} ₸</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    <span style="font-size:0.9rem;">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>`;
    });

    const totalEl = document.getElementById('total-price');
    if (totalEl) totalEl.innerText = `Итого: ${total} ₸`;
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
    if (count) count.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
};

// 4. ОТПРАВКА
window.sendOrder = function() {
    if (cart.length === 0) return;
    let text = "🎄 *Новый заказ из Pai Pai!* \n\n";
    let total = 0;
    cart.forEach(item => {
        text += `▪️ ${item.name} (x${item.qty}) — ${item.price * item.qty} ₸\n`;
        total += item.price * item.qty;
    });
    text += `\n💰 *ИТОГО: ${total} ₸*`;
    window.location.href = `https://wa.me/77052363788?text=${encodeURIComponent(text)}`;
};

// 5. СНЕГ
function initSnow() {
    setInterval(() => {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = Math.random() * 4 + 2 + 'px';
        flake.style.cssText = `width:${size}; height:${size}; left:${Math.random()*100}vw; position:fixed; top:-10px; background:white; border-radius:50%; pointer-events:none; z-index:9999; animation:fall ${Math.random()*5+5}s linear forwards;`;
        document.body.appendChild(flake);
        setTimeout(() => flake.remove(), 7000);
    }, 450);
}
document.addEventListener('DOMContentLoaded', initSnow);