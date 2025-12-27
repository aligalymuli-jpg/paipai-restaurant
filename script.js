function loadProducts() {
    const saved = localStorage.getItem('paipai_db');
    return saved ? JSON.parse(saved) : [];
}

let products = loadProducts();
let cart = [];

function renderMenu(category = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = category === 'all' ? products : products.filter(p => p.cat === category);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5; text-align:center;">В этой категории пока пусто</p>';
    }

    filtered.forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p.img}" onerror="this.src='https://via.placeholder.com/200?text=Pai+Pai'">
                <h4 style="font-size: 0.9rem; height: 35px; overflow: hidden;">${p.name}</h4>
                <div class="price">${p.price} ₸</div>
                <button class="btn-primary" onclick="addToCart(${p.id})" style="width:100%; padding: 8px; font-size: 0.8rem;">В корзину</button>
            </div>
        `;
    });
}

function filterMenu(cat) {
    renderMenu(cat);
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function addToCart(id) {
    const item = products.find(p => p.id === id);
    const inCart = cart.find(p => p.id === id);
    if (inCart) inCart.qty++;
    else cart.push({...item, qty: 1 });
    updateUI();
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');

    if (cart.length === 0) {
        list.innerHTML = '<p style="opacity:0.5">Пусто</p>';
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';
    list.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        list.innerHTML += `<div style="display:flex; justify-content:space-between; font-size: 0.9rem; margin-bottom: 5px;">
            <span>${item.name} x${item.qty}</span>
            <span>${item.price * item.qty} ₸</span>
        </div>`;
    });
    document.getElementById('total-price').innerText = total;
}

function sendToWhatsapp() {
    const name = document.getElementById('client-name').value;
    if (!name) return alert("Введите имя!");
    let text = `👋 Новый заказ: ${name}\n` + cart.map(i => `• ${i.name} x${i.qty}`).join('\n');
    text += `\n💰 Итого: ${document.getElementById('total-price').innerText} ₸`;
    window.open(`https://wa.me/77052363788?text=${encodeURIComponent(text)}`);
}

document.addEventListener('DOMContentLoaded', renderMenu);