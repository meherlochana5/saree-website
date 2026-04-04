function updateNavbar() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null; // Safety check for null
    const profileLink = document.getElementById("profileLink");
    const navRight = document.querySelector(".nav-right");

    if (isAdmin && navRight) {
        navRight.innerHTML = `
            <a href="index.html">Home</a>
            <a href="admin.html" style="color: #f59e0b; font-weight: bold;">🛠 Admin Panel</a>
            <a href="#" onclick="adminLogout()">Logout</a>
        `;
    } else if (user && user.name && profileLink) {
        // gets the first name. Remove .split(" ") if you want the full name.
        profileLink.innerText = "Hi, " + user.name;
        profileLink.href = "profile.html";
    }
}

// Add this logout function to script.js as well
function adminLogout() {
    localStorage.removeItem("adminLoggedIn");
    alert("Admin Logged Out");
    window.location.href = "index.html";
}
// 2. ❤️ LIKE (Guest Check Included)
function likeItem(btn){
    let user = localStorage.getItem("user");
    if (!user) {
        alert("Please login to save your favorites! ❤️");
        window.location.href = "login.html";
        return;
    }

    let card = btn.closest(".card");
    let name = card.querySelector(".pname").innerText;
    let price = card.querySelector(".pprice").innerText;
    let image = card.querySelector("img").src;

    let likes = JSON.parse(localStorage.getItem("likes")) || [];
    let exists = likes.some(p => p.name === name);

    if(exists){
        alert("Already Liked ❤️");
    } else {
        likes.push({ name, price, image });
        localStorage.setItem("likes", JSON.stringify(likes));
        alert("Added to Likes ❤️");
    }
}

// 3. 🛒 ADD TO CART (Guest Check Included)
function addCart(btn) {
    let user = localStorage.getItem("user");
    if (!user) {
        alert("Please login to start shopping! 🛍️");
        window.location.href = "login.html";
        return;
    }

    let card = btn.closest(".card");
    let name = card.querySelector(".pname").innerText.trim();
    let priceText = card.querySelector(".pprice").innerText;
    let price = parseInt(priceText.replace(/₹/g, "").trim());
    let image = card.querySelector("img").src;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existing = cart.find(p => p.name === name);

    if (existing) {
        alert("Already in Cart 🛒");
        return;
    }

    cart.push({ name, price, image, qty: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to Cart 🛒");
}

// 5. 🔍 FILTER PRODUCTS
function filterProducts(){
    let value = document.getElementById("priceFilter").value;
    let cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        let priceText = card.querySelector(".pprice").innerText;
        let price = parseInt(priceText.replace("₹",""));

        if(value === "all") card.style.display = "block";
        else if(value === "1500" && price <= 1500) card.style.display = "block";
        else if(value === "2000" && price <= 2000) card.style.display = "block";
        else if(value === "3000" && price > 3000) card.style.display = "block";
        else card.style.display = "none";
    });
}

// 6. 🏠 SEARCH
function searchSarees() {
    let filter = document.getElementById("searchInput").value.toLowerCase();
    let cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        let name = card.querySelector(".pname").innerText.toLowerCase();
        card.style.display = name.includes(filter) ? "block" : "none";
    });
}

// 7. 🛍️ CHECKOUT ALL
function checkoutAll() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let pending = JSON.parse(localStorage.getItem("pending")) || [];
    let user = JSON.parse(localStorage.getItem("user")) || {};

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    cart.forEach(item => {
        item.qty = item.qty || 1;
        item.customerName = user.name || "Guest";
        item.phone = user.phone || "N/A";
        item.address = user.address || ""; 
        
        pending.push({...item});
    });

    localStorage.removeItem("cart");
    localStorage.setItem("pending", JSON.stringify(pending));

    alert("All items moved to checkout! ✅");
    window.location.href = "profile.html";
}

// 8. 🏁 FINAL ORDER (With Compulsory Name & Phone Check)
async function finalOrder(i) {
    let pending = JSON.parse(localStorage.getItem("pending")) || [];
    let user = JSON.parse(localStorage.getItem("user")) || {};
    let item = pending[i];
    
    // Get delivery details from the inputs
    let finalName = document.getElementById("name" + i).value.trim();
    let finalPhone = document.getElementById("phone" + i).value.trim();
    let finalAddress = document.getElementById("addr" + i).value.trim();

    if (!finalName || !finalPhone || !finalAddress) {
        alert("Please fill all delivery details! 👤📞📍");
        return;
    }

    const orderData = {
        userEmail: user.email,
        userName: finalName,
        userPhone: finalPhone,
        address: finalAddress,
        items: [item],
        total: (item.price * (item.qty || 1)),
        status: "Pending" 
    };

    try {
        const response = await fetch('http://127.0.0.1:3000/place-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // Remove from PENDING only. DO NOT save to "orders" localStorage.
            pending.splice(i, 1);
            localStorage.setItem("pending", JSON.stringify(pending));

            alert("✅ Order Sent to Admin!");
            loadPending(); 
            loadOrders(); // This now fetches live data from the server
        }
    } catch (err) {
        alert("Server Error: Make sure Node.js is running.");
    }
}
// 9. ➕/➖ PENDING QUANTITY
function incPending(i){
    let pending = JSON.parse(localStorage.getItem("pending"));
    pending[i].qty++;
    localStorage.setItem("pending", JSON.stringify(pending));
    loadPending(); 
}

function decPending(i){
    let pending = JSON.parse(localStorage.getItem("pending"));
    if(pending[i].qty > 1) pending[i].qty--;
    localStorage.setItem("pending", JSON.stringify(pending));
    loadPending();
}

function removePending(i){
    let pending = JSON.parse(localStorage.getItem("pending"));
    pending.splice(i, 1);
    localStorage.setItem("pending", JSON.stringify(pending));
    loadPending();
}

// 10. 🏠 PROFILE UPDATES
function updateAddress() {
    let user = JSON.parse(localStorage.getItem("user"));
    let newAddr = document.getElementById("newAddress").value;
    if(!newAddr) return;
    user.address = newAddr;
    localStorage.setItem("user", JSON.stringify(user));
    alert("Address Updated!");
    location.reload();
}

function updatePhone() {
    let user = JSON.parse(localStorage.getItem("user"));
    let newPh = document.getElementById("newPhone").value;
    if(!newPh) return;
    user.phone = newPh;
    localStorage.setItem("user", JSON.stringify(user));
    alert("Phone Updated!");
    location.reload();
}

// 11. LOAD PENDING
function loadPending() {
    let pending = JSON.parse(localStorage.getItem("pending")) || [];
    let list = document.getElementById("pendingList");
    if (!list) return;

    if (pending.length === 0) {
        list.innerHTML = "<p style='padding:20px;'>No pending orders.</p>";
        return;
    }

    list.innerHTML = "";
    pending.forEach((item, i) => {
        let unitPrice = parseInt(item.price.toString().replace(/₹/g, "").trim());
        let qty = item.qty || 1;
        let totalAmount = unitPrice * qty;

        list.innerHTML += `
        <div class="card">
            <img src="${item.image}">
            <h3 class="pname">${item.name}</h3>
            <div class="qty-controls" style="display:flex; justify-content:center; align-items:center; gap:10px; margin:10px 0;">
                <button onclick="decPending(${i})" style="background:#ff9800; color:white; border:none; width:30px; height:30px; border-radius:5px;">-</button>
                <span style="font-weight:bold;">${qty}</span>
                <button onclick="incPending(${i})" style="background:#ff9800; color:white; border:none; width:30px; height:30px; border-radius:5px;">+</button>
            </div>
            <p style="font-weight:bold; color:#ff9800;">Total: ₹${totalAmount}</p>
            
            <input type="text" id="name${i}" placeholder="Delivery Name" value="${item.customerName || ''}" style="margin-top:5px; width:90%; padding:5px; border-radius:4px; border:1px solid #ccc;">
            <input type="text" id="phone${i}" placeholder="Delivery Phone" value="${item.phone || ''}" style="margin-top:5px; width:90%; padding:5px; border-radius:4px; border:1px solid #ccc;">
            <input type="text" id="addr${i}" placeholder="Delivery Address" value="${item.address || ''}" style="margin-top:5px; width:90%; padding:5px; border-radius:4px; border:1px solid #ccc;">
            
            <div style="display: flex; gap: 10px; margin-top: 10px; padding: 0 10px 10px;">
                <button onclick="removePending(${i})" style="width: 45px; height: 45px; background: #ffebee; border: 1px solid red; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center;">❌</button>
                <button onclick="finalOrder(${i})" style="flex-grow: 1; height: 45px; background: #ff9800; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Place Final Order</button>
            </div>
        </div>`;
    });
}

// 12. LOAD ORDERS (History)
// 12. LOAD ORDERS (History - Updated for Live Status)
// Inside the orders.reverse().forEach((order) => { ... loop
// 12. LOAD ORDERS (History - With Date and Cancel Option)
async function loadOrders() {
    let user = JSON.parse(localStorage.getItem("user"));
    let list = document.getElementById("orderList");
    
    if (!list) return;

    if (!user || !user.email) {
        list.innerHTML = "<p style='padding:20px;'>Please login to view your orders.</p>";
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:3000/my-orders/${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error("Server error");

        const allOrders = await res.json();

        // 1. FILTER: Hide cancelled or rejected orders completely
        const orders = allOrders.filter(o => o.status !== "Cancelled" && o.status !== "Rejected");

        if (!orders || orders.length === 0) {
            list.innerHTML = "<p style='padding:20px;'>No active orders yet.</p>";
            return;        }

        list.innerHTML = "";
        orders.reverse().forEach((order) => {
            let statusColor = "#ff9800"; 
            if (order.status === "Confirmed") statusColor = "#28a745"; 
            if (order.status === "Reached") statusColor = "#007bff"; 

            const orderDate = order.date ? new Date(order.date).toLocaleDateString() : "Date not available";

            // 2. IMAGE LOGIC: Pull image from the items array
            let itemImage = (order.items && order.items[0] && order.items[0].image) 
                            ? order.items[0].image 
                            : "https://via.placeholder.com/80x100?text=Saree";

            let itemNames = order.items && order.items.length > 0 
                ? order.items.map(i => i.name).join(", ") 
                : "Product Details";

            // 3. BUILD CARD: Including Image, Order Info, and Person Details
            list.innerHTML += `
            <div class="card" style="border-left: 8px solid ${statusColor}; text-align: left; padding: 15px; margin: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: flex; gap: 15px; align-items: flex-start;">
                
                <img src="${itemImage}" style="width: 80px; height: 110px; object-fit: cover; border-radius: 5px; border: 1px solid #eee; flex-shrink: 0;">

                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: ${statusColor}; font-size: 1.1rem;">${order.status}</h3>
                    
                    <p style="margin: 2px 0; font-size: 0.85rem;"><b>Date:</b> ${orderDate}</p>
                    <p style="margin: 2px 0; font-size: 0.85rem;"><b>Items:</b> ${itemNames}</p>
                    
                    <hr style="border:0; border-top: 1px solid #f1f1f1; margin: 8px 0;">
                    
                    <p style="margin: 2px 0; font-size: 0.85rem;"><b>Deliver To:</b> ${order.userName || 'User'}</p>
                    <p style="margin: 2px 0; font-size: 0.85rem;"><b>Phone:</b> ${order.userPhone || 'N/A'}</p>
                    <p style="margin: 2px 0; font-size: 0.85rem; color: #555;"><b>Address:</b> ${order.address || 'N/A'}</p>
                    
                    <p style="margin: 8px 0 0 0; font-weight: bold; color: #333;">Total: ₹${order.total || 0}</p>

                    ${order.status === 'Pending' ? `
                        <button onclick="cancelLiveOrder('${order._id}')" 
                                style="margin-top:10px; background:white; color:red; border:1px solid red; padding:4px 10px; cursor:pointer; border-radius:4px; font-weight:bold; font-size: 0.75rem;">
                            Cancel Order
                        </button>
                    ` : ""}

                    ${order.status === "Reached" 
                        ? "<p style='color: #007bff; font-weight: bold; margin-top: 8px; font-size: 0.85rem;'>🎉 Order Delivered!</p>" 
                        : ""}
                </div>
            </div>`;
        });
    } catch (err) {
        list.innerHTML = "<p style='padding:20px; color:red;'>Cannot connect to server. Is Node.js running? 🚀</p>";
    }
}
// ALSO ADD THIS FUNCTION TO THE BOTTOM OF script.js
async function cancelLiveOrder(id) {
    if (confirm("Are you sure you want to cancel this order? 🛑")) {
        try {
            const res = await fetch(`http://127.0.0.1:3000/admin/update-status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: id, status: 'Cancelled' })
            });
            if (res.ok) {
                alert("Order Cancelled Successfully ✅");
                loadOrders(); // Refresh the list
            }
        } catch (err) {
            console.error("Cancel failed:", err);
        }
    }
}
// 13. CANCEL ORDER


// 14. ORDER ALL
async function orderAll() {
    let pending = JSON.parse(localStorage.getItem("pending")) || [];
    let user = JSON.parse(localStorage.getItem("user")) || {};
    let globalAddr = document.getElementById("globalAddress").value;

    if (pending.length === 0) return;
    if (!globalAddr) { alert("Please enter a global address!"); return; }

    // Loop through and send each item to the database
    for (let i = 0; i < pending.length; i++) {
        let orderData = {
            userEmail: user.email,
            userName: document.getElementById("name" + i).value.trim() || user.name,
            userPhone: document.getElementById("phone" + i).value.trim() || user.phone,
            address: globalAddr,
            items: [pending[i]],
            total: (pending[i].price * (pending[i].qty || 1)),
            status: "Pending"
        };

        await fetch('http://127.0.0.1:3000/place-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData)
        });
    }

    localStorage.setItem("pending", JSON.stringify([])); 
    alert("✅ All orders sent to Admin!");
    loadPending(); 
    loadOrders(); 
}
// 15. LOAD CART (Initial function for cart.html)
function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let list = document.getElementById("cartList");
    if (!list) return;

    list.innerHTML = "";
    cart.forEach((item, i) => {
        list.innerHTML += `
        <div class="card">
            <img src="${item.image}">
            <h3 class="pname">${item.name}</h3>
            <p>₹${item.price}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px; padding: 0 10px 10px;">
                <button onclick="removeFromCart(${i})" style="width: 45px; height: 45px; background: #ffebee; color: red; border: 1px solid red; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">✕</button>
                <button onclick="placeOrder(${i})" style="flex-grow: 1; height: 45px; background: #ff9800; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Order Now</button>
            </div>
        </div>`;
    });
}

function removeFromCart(i) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    cart.splice(i, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

function placeOrder(i) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let pending = JSON.parse(localStorage.getItem("pending")) || [];
    let user = JSON.parse(localStorage.getItem("user")) || {};

    if (cart.length === 0) return;

    let item = cart[i];
    item.customerName = user.name || "Guest";
    item.phone = user.phone || "N/A";
    item.address = user.address || "";

    let existingPending = pending.find(p => p.name === item.name);

    if (existingPending) {
        existingPending.qty = (existingPending.qty || 0) + (item.qty || 1);
    } else {
        item.qty = item.qty || 1;
        pending.push(item);
    }

    cart.splice(i, 1);

    localStorage.setItem("pending", JSON.stringify(pending));
    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Item moved to Pending Orders! ✅");
    window.location.href = "profile.html";
}
async function cancelLiveOrder(id) {
    if (confirm("Are you sure you want to cancel this order? 🛑")) {
        try {
            // This sends a request to your server to change the status to 'Cancelled'
            const res = await fetch(`http://127.0.0.1:3000/admin/update-status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: id, status: 'Cancelled' })
            });
            if (res.ok) {
                alert("Order Cancelled Successfully ✅");
                loadOrders(); // Refresh the list to show it's gone or updated
            }
        } catch (err) {
            console.error("Cancel failed:", err);
        }
    }
}
// Update this function inside your admin.html script or script.js
async function loadAdminData() {
    try {
        // 1. Fetch Orders and Products from your Node.js server
        const resOrders = await fetch('http://127.0.0.1:3000/admin/orders');
        const resProducts = await fetch('http://127.0.0.1:3000/get-products');
        
        const orders = await resOrders.json();
        const products = await resProducts.json();

        // 2. Calculate Stats
        const totalOrders = orders.length;
        const totalProducts = products.length;
        
        // Calculate total revenue from 'Confirmed' or 'Reached' orders
        const revenue = orders
            .filter(order => order.status === "Confirmed" || order.status === "Reached")
            .reduce((sum, order) => sum + (order.total || 0), 0);

        // 3. Update the "Loading stats..." div
        const statsDisplay = document.getElementById("statsDisplay");
        statsDisplay.innerHTML = `
            <div style="flex: 1; text-align: center;">
                <h3 style="margin: 0; color: #ff9800;">${totalOrders}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Total Orders</p>
            </div>
            <div style="flex: 1; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee;">
                <h3 style="margin: 0; color: #28a745;">₹${revenue}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Revenue</p>
            </div>
            <div style="flex: 1; text-align: center;">
                <h3 style="margin: 0; color: #0f172a;">${totalProducts}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Products</p>
            </div>
        `;

        // Continue with loading the rest of your admin lists...
        renderAdminOrders(orders);
        renderAdminProducts(products);

    } catch (error) {
        console.error("Error loading admin stats:", error);
        document.getElementById("statsDisplay").innerHTML = "<p>Error loading dashboard stats.</p>";
    }
}
// script.js

async function loadAdminStats() {
    const statsDisplay = document.getElementById("statsDisplay");
    try {
        const [userRes, orderRes, productRes] = await Promise.all([
            fetch('http://127.0.0.1:3000/admin/stats/users-count'),
            fetch('http://127.0.0.1:3000/admin/stats/order-status-counts'),
            fetch('http://127.0.0.1:3000/get-products')
        ]);

        const userData = await userRes.json();
        const orderData = await orderRes.json();
        const products = await productRes.json();

        statsDisplay.innerHTML = `
            <div style="flex: 1; text-align: center;">
                <h3 style="margin: 0; color: #0f172a;">${userData.totalUsers}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Users</p>
            </div>
            <div style="flex: 1; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee;">
                <h3 style="margin: 0; color: #28a745;">${orderData.delivered}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Delivered</p>
            </div>
            <div style="flex: 1; text-align: center; border-right: 1px solid #eee;">
                <h3 style="margin: 0; color: #ff9800;">${orderData.pending}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Pending</p>
            </div>
            <div style="flex: 1; text-align: center;">
                <h3 style="margin: 0; color: #0f172a;">${products.length}</h3>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">Products</p>
            </div>
        `;
    } catch (error) {
        statsDisplay.innerHTML = "<p style='color:red;'>Error connecting to server</p>";
    }
}