const firebaseConfig = {
    apiKey: "AIzaSyDU7Q6LOha4gIBz6HoHyx3Nx7LwWi4dSls",
    authDomain: "ali1-717e6.firebaseapp.com",
    databaseURL: "https://ali1-717e6-default-rtdb.firebaseio.com",
    projectId: "ali1-717e6",
    storageBucket: "ali1-717e6.firebasestorage.app",
    messagingSenderId: "293002535182",
    appId: "1:293002535182:web:ac9be8c8ab5610e2e8375f"
};

// Инициализация
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let products = [];
let cart = [];

// 1. СЛУШАЕМ БАЗУ ДАННЫХ
database.ref('products').on('value', (snapshot) => {
    const data = snapshot.val();
    console.log("Данные из базы получены:", data);
    products = data ? Object.keys(data).map(key => ({...data[key], id: key })) : [];
    renderMenu('all');
});

// 2. ГЛАВНАЯ ФУНКЦИЯ ОТРИСОВКИ
function renderMenu(category = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';

    const filtered = category === 'all' ?
        products :
        products.filter(p => p.cat === category);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.5; padding:20px; color:white;">
            В категории "${category}" пока нет блюд...
        </p>`;
        return;
    }

    filtered.forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p.img}" onerror="this.src='https://via.placeholder.com/400x300?text=Pai+Pai+Food'">
                <div style="padding: 15px;">
                    <h3 style="margin-bottom: 10px; font-size: 1.1rem; color:white;">${p.name}</h3>
                    <div class="price" style="color: #c48c5d; font-weight: 800; margin-bottom: 15px;">${p.price} ₸</div>
                    <button class="btn-primary" onclick="addToCart('${p.id}')" style="width:100%; cursor: pointer; background:#c48c5d; border:none; padding:10px; border-radius:10px; color:white;">В корзину</button>
                </div>
            </div>`;
    });
}

// 3. ФУНКЦИЯ ФИЛЬТРАЦИИ
function filterMenu(cat) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    renderMenu(cat);
}

// 4. КОРЗИНА
function addToCart(id) {
    const p = products.find(i => i.id === id);
    if (!p) return;

    const inCart = cart.find(i => i.id === id);
    if (inCart) {
        inCart.qty++;
    } else {
        cart.push({...p, qty: 1 });
    }
    updateUI();
}

function updateUI() {
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = cart.reduce((s, i) => s + i.qty, 0);

    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.5; color:white;">Корзина пуста</p>';
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
    list.innerHTML = '';
    let total = 0;

    cart.forEach(i => {
        total += i.price * i.qty;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:5px; border-bottom: 1px solid rgba(255,255,255,0.1); color:white;">
                <span>${i.name} x${i.qty}</span>
                <span style="font-weight:bold;">${i.price * i.qty} ₸</span>
            </div>`;
    });

    const totalDisplay = document.getElementById('total-price');
    if (totalDisplay) totalDisplay.innerText = total;
}

function sendToWhatsapp() {
    const name = document.getElementById('client-name').value;
    if (!name) return alert("Введите ваше имя для заказа!");

    let text = `*Новый заказ Pai Pai*\n`;
    text += `👤 Имя: ${name}\n`;
    text += `--------------------------\n`;
    text += cart.map(i => `• ${i.name} (${i.qty} шт.) — ${i.price * i.qty} ₸`).join('\n');
    text += `\n--------------------------\n`;
    text += `💰 *ИТОГО: ${document.getElementById('total-price').innerText} ₸*`;

    window.open(`https://wa.me/77052363788?text=${encodeURIComponent(text)}`);
}