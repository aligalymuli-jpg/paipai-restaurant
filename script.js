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

// --- ФУНКЦИЯ СНЕГА ---
function initSnow() {
    const container = document.createElement('div');
    container.id = 'snow-container';
    document.body.appendChild(container);

    setInterval(() => {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = Math.random() * 4 + 2 + 'px';
        flake.style.width = size;
        flake.style.height = size;
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animation = `fall ${Math.random() * 4 + 4}s linear forwards`;
        container.appendChild(flake);
        setTimeout(() => flake.remove(), 7000);
    }, 300);
}

database.ref('products').on('value', (snapshot) => {
    const data = snapshot.val();
    products = data ? Object.keys(data).map(key => ({...data[key], id: key })) : [];
    renderMenu('all');
    updateUI();
});

function renderMenu(category = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';
    const filtered = category === 'all' ? products : products.filter(p => p.cat === category);
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p.img}" onerror="this.src='https://via.placeholder.com/400x300?text=Pai+Pai+Food'">
                <div style="padding: 15px;">
                    <h3 style="margin-bottom: 10px; font-size: 1.1rem; color:white;">${p.name}</h3>
                    <div class="price">${p.price} ₸</div>
                    <button class="btn-primary" onclick="addToCart('${p.id}')" style="width:100%;">В корзину</button>
                </div>
            </div>`;
    });
}

function filterMenu(cat) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if (window.event) window.event.target.classList.add('active');
    renderMenu(cat);
}

function addToCart(id) {
    const p = products.find(i => i.id === id);
    const inCart = cart.find(i => i.id === id);
    if (inCart) inCart.qty++;
    else cart.push({...p, qty: 1 });
    saveCart();
    const btn = event.target;
    btn.innerText = "Добавлено! ✓";
    setTimeout(() => btn.innerText = "В корзину", 1000);
}

function saveCart() {
    localStorage.setItem('pai_pai_cart', JSON.stringify(cart));
    updateUI();
}

function updateUI() {
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = cart.reduce((s, i) => s + i.qty, 0);
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('total-price');
    const footer = document.getElementById('cart-footer');
    if (!list) return;
    list.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.5; color:white; padding:20px;">Корзина пуста ❄️</p>';
        if (footer) footer.style.display = 'none';
    } else {
        if (footer) footer.style.display = 'block';
        cart.forEach(i => {
            total += i.price * i.qty;
            list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; color:white;">
                <span>${i.name} x${i.qty}</span>
                <span>${i.price * i.qty} ₸</span>
            </div>`;
        });
        if (totalDisplay) totalDisplay.innerText = total;
    }
}

function sendToWhatsapp() {
    const name = document.getElementById('client-name').value;
    if (!name) return alert("Введите ваше имя!");
    let text = `*Новый заказ Pai Pai*\n👤 Имя: ${name}\n`;
    cart.forEach(i => text += `• ${i.name} (${i.qty} шт.) — ${i.price * i.qty} ₸\n`);
    text += `💰 *ИТОГО: ${document.getElementById('total-price').innerText} ₸*`;
    window.open(`https://wa.me/77052363788?text=${encodeURIComponent(text)}`);
}

// Запускаем снег при загрузке
window.onload = initSnow;