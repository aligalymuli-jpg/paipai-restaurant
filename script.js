// ... (оставь конфиг Firebase сверху как был) ...

let cart = JSON.parse(localStorage.getItem('pai_pai_cart')) || [];

// Обновление UI счетчика (на главной)
function updateUI() {
    const count = document.getElementById('cart-count');
    if (count) {
        count.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    }
}

// Добавление в корзину
function addToCart(id) {
    // products берется из базы, эта часть у тебя в коде выше
    const p = products.find(i => i.id === id);
    const item = cart.find(i => i.id === id);

    if (item) {
        item.qty++;
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
    alert('Добавлено в корзину!');
}

function saveCart() {
    localStorage.setItem('pai_pai_cart', JSON.stringify(cart));
}

// Отрисовка корзины (для страницы cart.html)
function renderCart() {
    const container = document.getElementById('cart-content');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-msg"><h3>Корзина пуста 🎄</h3><p>Добавьте что-нибудь вкусное!</p></div>`;
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';
    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p style="color:var(--primary)">${item.price} ₸</p>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>`;
    });

    document.getElementById('total-price').innerText = `Итого: ${total} ₸`;
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    renderCart();
    updateUI();
}

// Отправка заказа
function sendOrder() {
    if (cart.length === 0) return;

    let message = "Привет! Мой заказ в Pai Pai: \n\n";
    let total = 0;

    cart.forEach(item => {
        message += `▪️ ${item.name} x${item.qty} = ${item.price * item.qty} ₸\n`;
        total += item.price * item.qty;
    });

    message += `\n💰 ИТОГО: ${total} ₸`;

    const encoded = encodeURIComponent(message);
    window.location.href = `https://wa.me/77052363788?text=${encoded}`;
}

// Снег (функция из прошлого шага)
function initSnow() {
    setInterval(() => {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = Math.random() * 4 + 2 + 'px';
        flake.style.width = size;
        flake.style.height = size;
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animation = `fall ${Math.random() * 5 + 5}s linear forwards`;
        document.body.appendChild(flake);
        setTimeout(() => flake.remove(), 7000);
    }, 400);
}