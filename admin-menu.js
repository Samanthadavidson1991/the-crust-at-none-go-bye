document.addEventListener('DOMContentLoaded', () => {
    // State
    let sizes = [];
    let toppings = [];
    let liveMenu = [];

    // Elements for live menu display
    const liveMenuList = document.createElement('div');
    liveMenuList.id = 'live-menu-list';
    liveMenuList.style.margin = '24px 0';
    document.body.insertBefore(liveMenuList, document.body.firstChild.nextSibling);

    // Fetch live menu from backend
    async function fetchLiveMenu() {
        try {
            const res = await fetch('/api/menu');
            if (!res.ok) throw new Error('Failed to fetch menu');
            liveMenu = await res.json();
            renderLiveMenu();
        } catch (err) {
            liveMenuList.innerHTML = `<span style="color:red">Error loading live menu: ${err.message}</span>`;
        }
    }

    function renderLiveMenu() {
        if (!Array.isArray(liveMenu) || liveMenu.length === 0) {
            liveMenuList.innerHTML = '<em>No menu items found.</em>';
            return;
        }
        liveMenuList.innerHTML = '<h2>Live Menu</h2>' + liveMenu.map(item => {
            let sizesText = Array.isArray(item.sizes) ? item.sizes.map(s => `${s.size} (£${s.price.toFixed(2)})`).join(', ') : '';
            let toppingsText = Array.isArray(item.toppings) && item.toppings.length ? `<br><strong>Toppings:</strong> ${item.toppings.join(', ')}` : '';
            return `<div style="margin-bottom:12px"><strong>${item.name}</strong> (${sizesText})${toppingsText}
                <button class="edit-menu-btn" data-id="${item._id}">Edit</button>
                <button class="remove-menu-btn" data-id="${item._id}">Remove</button>
            </div>`;
        }).join('');

        // Attach event listeners for edit and remove
        liveMenuList.querySelectorAll('.edit-menu-btn').forEach(btn => {
            btn.onclick = function() {
                const id = btn.getAttribute('data-id');
                const item = liveMenu.find(i => i._id === id);
                if (!item) return;
                openEditModal(item);
            };
        });
        liveMenuList.querySelectorAll('.remove-menu-btn').forEach(btn => {
            btn.onclick = function() {
                const id = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this menu item?')) {
                    fetch(`/api/menu/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to delete'); });
                            fetchLiveMenu();
                        })
                        .catch(err => alert('Error deleting: ' + err.message));
                }
            };
        });
    }
    // Edit modal logic
    function openEditModal(item) {
        modalBg.style.display = 'flex';
        modal.querySelector('#modal-size-input').value = '';
        modal.querySelector('#modal-price-input').value = '';
        toppings = Array.isArray(item.toppings) ? [...item.toppings] : [];
        sizes = Array.isArray(item.sizes) ? item.sizes.map(s => ({...s})) : [];
        pizzaNameInput.value = item.name;
        renderToppings();
        renderSizes();
        renderPreview();

        // Change Add button to Save
        const addBtn = modal.querySelector('#modal-add-btn');
        addBtn.textContent = 'Save';
        // Remove previous event listeners
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.onclick = function() {
            // Save changes
            const updated = {
                _id: item._id,
                name: pizzaNameInput.value,
                sizes: sizes,
                toppings: toppings
            };
            fetch('/api/menu', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            })
            .then(res => {
                if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to update'); });
                return res.json();
            })
            .then(() => {
                modalBg.style.display = 'none';
                fetchLiveMenu();
                pizzaNameInput.value = '';
                sizes = [];
                toppings = [];
                renderSizes();
                renderToppings();
                renderPreview();
            })
            .catch(err => alert('Error updating: ' + err.message));
        };
        // Cancel button resets Add button
        const cancelBtn = modal.querySelector('#modal-cancel-btn');
        cancelBtn.onclick = function() {
            modalBg.style.display = 'none';
            // Restore Add button
            const saveBtn = modal.querySelector('#modal-add-btn');
            const origBtn = saveBtn.cloneNode(true);
            origBtn.textContent = 'Add';
            origBtn.onclick = origAddHandler;
            saveBtn.parentNode.replaceChild(origBtn, saveBtn);
        };
    }

    // Save original Add handler for restoring after edit
    const origAddHandler = modal.querySelector('#modal-add-btn').onclick;

    fetchLiveMenu();

    // Elements
    const addSizeBtn = document.getElementById('add-size-btn');
    const sizesList = document.getElementById('sizes-list');
    const pizzaPreview = document.getElementById('pizza-preview');
    const addPizzaForm = document.getElementById('add-pizza-form');
    const pizzaNameInput = document.getElementById('pizza-name');

    // Modal for size/price
    let modalBg = document.createElement('div');
    modalBg.style.position = 'fixed';
    modalBg.style.top = '0';
    modalBg.style.left = '0';
    modalBg.style.width = '100vw';
    modalBg.style.height = '100vh';
    modalBg.style.background = 'rgba(0,0,0,0.5)';
    modalBg.style.border = '2px solid red';
    modalBg.style.display = 'none';
    modalBg.style.justifyContent = 'center';
    modalBg.style.alignItems = 'center';
    modalBg.style.zIndex = '1000';
    document.body.appendChild(modalBg);

    let modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.padding = '24px';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
    modal.style.minWidth = '320px';
    modal.style.border = '3px solid blue';
    modalBg.appendChild(modal);

    modal.innerHTML = `
        <h3>Add Pizza Size</h3>
        <label>Size:</label><br>
        <input type="text" id="modal-size-input" placeholder="e.g. Small, Medium, Large"><br><br>
        <label>Price (£):</label><br>
        <input type="number" id="modal-price-input" placeholder="e.g. 9.99" step="0.01" min="0"><br><br>
        <hr>
        <label>Toppings (type and press Add):</label><br>
        <div id="toppings-list"></div>
        <input type="text" id="topping-input" placeholder="e.g. Pepperoni">
        <button type="button" id="add-topping-btn">Add Topping</button>
        <br><br>
        <button id="modal-add-btn">Add</button>
        <button id="modal-cancel-btn">Cancel</button>
    `;

    function renderToppings() {
        const toppingsList = modal.querySelector('#toppings-list');
        toppingsList.innerHTML = '';
        toppings.forEach((topping, idx) => {
            const span = document.createElement('span');
            span.textContent = topping;
            span.style.marginRight = '8px';
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.style.marginLeft = '4px';
            removeBtn.onclick = () => {
                toppings.splice(idx, 1);
                renderToppings();
                renderPreview();
            };
            span.appendChild(removeBtn);
            toppingsList.appendChild(span);
        });
    }

    modal.querySelector('#add-topping-btn').onclick = function() {
        const topping = modal.querySelector('#topping-input').value.trim();
        if (topping && !toppings.includes(topping)) {
            toppings.push(topping);
            modal.querySelector('#topping-input').value = '';
            renderToppings();
            renderPreview();
        }
    };

    function showModal() {
        modalBg.style.display = 'flex';
        modal.querySelector('#modal-size-input').value = '';
        modal.querySelector('#modal-price-input').value = '';
        toppings = [];
        renderToppings();
    }
    function hideModal() {
        modalBg.style.display = 'none';
    }

    addSizeBtn.addEventListener('click', showModal);
    modal.querySelector('#modal-cancel-btn').onclick = hideModal;
    modal.querySelector('#modal-add-btn').onclick = function() {
        const size = modal.querySelector('#modal-size-input').value.trim();
        const price = modal.querySelector('#modal-price-input').value.trim();
        if (!size || !price || isNaN(price)) {
            alert('Please enter both size and price.');
            return;
        }
        if (sizes.some(s => s.size === size)) {
            alert('This size already exists.');
            return;
        }
        sizes.push({ size, price: parseFloat(price) });
        renderSizes();
        renderPreview();
        hideModal();
    };

    function renderSizes() {
        sizesList.innerHTML = '';
        sizes.forEach((obj, idx) => {
            const div = document.createElement('div');
            div.textContent = `${obj.size} (£${obj.price.toFixed(2)})`;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = async () => {
                sizes.splice(idx, 1);
                renderSizes();
                renderPreview();
                // If editing an existing menu item and all sizes are removed, delete the item
                if (window.editingMenuItemId && sizes.length === 0) {
                    if (confirm('All sizes removed. Delete this menu item?')) {
                        await fetch(`/api/menu/${window.editingMenuItemId}`, { method: 'DELETE' });
                        modalBg.style.display = 'none';
                        fetchLiveMenu();
                        pizzaNameInput.value = '';
                        sizes.length = 0;
                        toppings.length = 0;
                        renderSizes();
                        renderToppings();
                        renderPreview();
                        window.editingMenuItemId = null;
                    }
                }
            };
            div.appendChild(removeBtn);
            sizesList.appendChild(div);
        });
    }

    function renderPreview() {
        const previewText = sizes.map(obj => `${obj.size} (£${obj.price.toFixed(2)})`).join(', ');
        let toppingsText = toppings.length ? `<br><strong>Toppings:</strong> ${toppings.join(', ')}` : '';
        pizzaPreview.innerHTML = `<strong>Preview:</strong> ${pizzaNameInput.value} (${previewText})${toppingsText}`;
    }

    pizzaNameInput.addEventListener('input', renderPreview);

    addPizzaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!pizzaNameInput.value || sizes.length === 0) {
            alert('Please enter a pizza name and at least one size.');
            return;
        }
        // Send new pizza to backend
        const newPizza = {
            name: pizzaNameInput.value,
            sizes: sizes,
            toppings: toppings
        };
        fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPizza)
        })
        .then(res => {
            if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to add pizza'); });
            return res.json();
        })
        .then(data => {
            alert('Pizza added to live menu!');
            fetchLiveMenu();
            pizzaNameInput.value = '';
            sizes = [];
            toppings = [];
            renderSizes();
            renderToppings();
            renderPreview();
        })
        .catch(err => {
            alert('Error adding pizza: ' + err.message);
        });
    });

    // Initial render
    renderSizes();
    renderToppings();
    renderPreview();
});
