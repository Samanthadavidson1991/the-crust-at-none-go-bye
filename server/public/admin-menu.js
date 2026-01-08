document.addEventListener('DOMContentLoaded', () => {
    // State
    let sizes = [];
    let toppings = [];

    // Elements
    const addSizeBtn = document.getElementById('add-size-btn');
    const sizesList = document.getElementById('sizes-list');
    const pizzaPreview = document.getElementById('pizza-preview');
    const addPizzaForm = document.getElementById('add-pizza-form');
    const pizzaNameInput = document.getElementById('pizza-name');

    // Toppings UI
    const toppingsSection = document.createElement('div');
    toppingsSection.innerHTML = `
        <label>Toppings (type and press Add):</label><br>
        <div id="toppings-list"></div>
        <input type="text" id="topping-input" placeholder="e.g. Pepperoni">
        <button type="button" id="add-topping-btn">Add Topping</button>
        <br><br>
    `;
    addPizzaForm.insertBefore(toppingsSection, pizzaPreview);

    function renderToppings() {
        const toppingsList = document.getElementById('toppings-list');
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

    document.getElementById('add-topping-btn').onclick = function() {
        const topping = document.getElementById('topping-input').value.trim();
        if (topping && !toppings.includes(topping)) {
            toppings.push(topping);
            document.getElementById('topping-input').value = '';
            renderToppings();
            renderPreview();
        }
    };

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
        <button id="modal-add-btn">Add</button>
        <button id="modal-cancel-btn">Cancel</button>
    `;

    function showModal() {
        modalBg.style.display = 'flex';
        modal.querySelector('#modal-size-input').value = '';
        modal.querySelector('#modal-price-input').value = '';
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
            removeBtn.onclick = () => {
                sizes.splice(idx, 1);
                renderSizes();
                renderPreview();
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
        // Here you would send to backend
        const previewText = sizes.map(obj => `${obj.size} (£${obj.price.toFixed(2)})`).join(', ');
        let toppingsText = toppings.length ? ` | Toppings: ${toppings.join(', ')}` : '';
        alert(`Pizza added: ${pizzaNameInput.value} (${previewText})${toppingsText}`);
        pizzaNameInput.value = '';
        sizes = [];
        toppings = [];
        renderSizes();
        renderToppings();
        renderPreview();
    });

    // Initial render
    renderSizes();
    renderToppings();
    renderPreview();
});
