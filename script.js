let cart = [];

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    drawer.style.right = drawer.style.right === '0px' ? '-380px' : '0px';
}

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
    toggleCartDrawer(); // Automatically slide open cart drawer when item is added
}

function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update top nav badge count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalCount;

    // Render cart drawer items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-text">Your cart is empty</p>';
        cartTotal.innerText = 'Kshs 0';
        return;
    }

    let html = '';
    let totalPrice = 0;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.6rem;">
                <div>
                    <h4 style="margin: 0; font-size: 0.95rem; color: #1f2937;">${item.name}</h4>
                    <span style="font-size: 0.85rem; color: #6b7280;">Kshs ${item.price.toLocaleString()} × ${item.quantity}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: bold; font-size: 0.9rem; display: block; color: #111827; margin-bottom: 4px;">Kshs ${itemTotal.toLocaleString()}</span>
                    <button onclick="removeFromCart('${item.name}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Remove</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = html;
    cartTotal.innerText = `Kshs ${totalPrice.toLocaleString()}`;
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    // Show the M-PESA checkout modal
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert("Checkout modal element missing from HTML.");
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitMpesaPayment() {
    let phoneInput = document.getElementById('mpesa-phone').value.trim();
    
    // Format phone number to 2547XXXXXXXX format
    if (phoneInput.startsWith('0')) {
        phoneInput = '254' + phoneInput.slice(1);
    } else if (phoneInput.startsWith('+254')) {
        phoneInput = phoneInput.slice(1);
    }

    if (!phoneInput || phoneInput.length !== 12) {
        alert("Please enter a valid Safaricom phone number (e.g., 0712345678).");
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const payload = {
        phone: phoneInput,
        amount: totalAmount,
        account_reference: "Dalmiq Comm"
    };

    try {
        alert("Sending STK push request... Check your phone.");
        closeCheckoutModal();
        
        const response = await fetch('stk_push.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok && (!data.ResponseCode || data.ResponseCode === "0")) {
            alert("STK Push sent successfully! Please enter your M-PESA PIN to complete payment.");
            cart = [];
            updateCartUI();
            toggleCartDrawer();
        } else {
            alert("Payment initiation failed: " + (data.errorMessage || data.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Could not connect to payment server. Make sure your local PHP server is running.");
    }
}

function toggleMenu() {
    const nav = document.querySelector('header nav');
    const isOpen = nav.classList.toggle('open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', isOpen);
}

// Close the menu after tapping a link
document.querySelectorAll('.nav-links a').forEach(link =>
    link.addEventListener('click', () =>
        document.querySelector('header nav').classList.remove('open'))
);