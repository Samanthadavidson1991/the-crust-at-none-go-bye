// Streamlined Checkout JavaScript

class StreamlinedCheckout {
    constructor() {
        this.cart = [];
        this.deliveryFee = 3.50;
        this.minDate = new Date();
        this.timeSlots = [];
        this.isProcessing = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing streamlined checkout...');
        
        // Load cart and setup
        await this.loadCart();
        this.displayCart();
        this.setupEventListeners();
        this.generateTimeSlots();
        this.setMinDate();
        this.updateTotals();
        
        console.log('Checkout initialized successfully');
    }

    async loadCart() {
        try {
            // First try to load from checkoutCart (set by menu.js checkout function)
            let cartData = localStorage.getItem('checkoutCart');
            if (!cartData) {
                // Fallback to regular cart
                cartData = localStorage.getItem('cart');
            }
            
            if (cartData) {
                this.cart = JSON.parse(cartData);
                console.log('Cart loaded:', this.cart);
                
                // Clear checkoutCart to prevent stale data
                localStorage.removeItem('checkoutCart');
            } else {
                console.warn('No cart data found');
                this.cart = [];
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    displayCart() {
        const cartContainer = document.getElementById('cart-items');
        if (!cartContainer) return;

        if (this.cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <a href="menu.html" class="add-more-btn">Browse Menu</a>
                </div>
            `;
            return;
        }

        let cartHTML = '';
        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            cartHTML += `
                <div class="cart-item-display" data-index="${index}">
                    <div class="item-info">
                        <h4 class="item-name">${item.name}</h4>
                        <div class="item-details">
                            <span class="item-quantity">Qty: ${item.quantity}</span>
                            ${item.size ? `<span class="item-size">Size: ${item.size}</span>` : ''}
                            ${item.extras && item.extras.length > 0 ? 
                                `<span class="item-extras">Extras: ${item.extras.join(', ')}</span>` : ''}
                        </div>
                    </div>
                    <div class="item-price">£${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });

        cartContainer.innerHTML = cartHTML;
    }

    setupEventListeners() {
        // Form validation
        const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Payment buttons
        const cashBtn = document.getElementById('pay-with-cash');
        const cardBtn = document.getElementById('pay-with-card');
        const backBtn = document.getElementById('back-to-menu');

        if (cashBtn) {
            cashBtn.addEventListener('click', () => this.processOrder('cash'));
        }

        if (cardBtn && !cardBtn.disabled) {
            cardBtn.addEventListener('click', () => this.processOrder('card'));
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => window.location.href = 'menu.html');
        }

        // Date change handler
        const dateInput = document.getElementById('order-date');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.updateTimeSlots());
        }

        // Form submission
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }

        // Delivery validation
        this.setupDeliveryValidation();
    }

    setMinDate() {
        const dateInput = document.getElementById('order-date');
        if (dateInput) {
            // Set minimum date to today (allow same-day orders)
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            dateInput.min = todayStr;
            dateInput.value = todayStr;
            this.updateTimeSlots();
        }
    }

    generateTimeSlots() {
        this.timeSlots = [
            { value: '17:00-17:30', text: '5:00 PM - 5:30 PM' },
            { value: '17:30-18:00', text: '5:30 PM - 6:00 PM' },
            { value: '18:00-18:30', text: '6:00 PM - 6:30 PM' },
            { value: '18:30-19:00', text: '6:30 PM - 7:00 PM' },
            { value: '19:00-19:30', text: '7:00 PM - 7:30 PM' },
            { value: '19:30-20:00', text: '7:30 PM - 8:00 PM' },
            { value: '20:00-20:30', text: '8:00 PM - 8:30 PM' },
            { value: '20:30-21:00', text: '8:30 PM - 9:00 PM' },
            { value: '21:00-21:30', text: '9:00 PM - 9:30 PM' }
        ];
    }

    updateTimeSlots() {
        const timeSlotSelect = document.getElementById('order-time-slot');
        if (!timeSlotSelect) return;

        // Clear existing options except the first one
        timeSlotSelect.innerHTML = '<option value="">Select your preferred time...</option>';

        // Add available time slots
        this.timeSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.value;
            option.textContent = slot.text;
            timeSlotSelect.appendChild(option);
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        if (value && field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        if (value && field.type === 'tel') {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value) || value.length < 10) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (value && field.id === 'customer-postcode') {
            const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
            if (!postcodeRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid UK postcode';
            }
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    showFieldError(field, isValid, message) {
        const errorElement = field.parentNode.querySelector('.error-message');
        
        if (isValid) {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        } else {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    validateForm() {
        const requiredFields = document.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    updateTotals() {
        const subtotal = this.calculateSubtotal();
        const total = subtotal + this.deliveryFee;

        // Update display elements
        const subtotalElement = document.getElementById('cart-subtotal');
        const totalElements = document.querySelectorAll('#cart-total, #final-total');

        if (subtotalElement) {
            subtotalElement.textContent = `£${subtotal.toFixed(2)}`;
        }

        totalElements.forEach(element => {
            if (element) {
                element.textContent = `£${total.toFixed(2)}`;
            }
        });
    }

    calculateSubtotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    async processOrder(paymentMethod) {
        if (this.isProcessing) return;

        console.log('Processing order with payment method:', paymentMethod);

        // Validate form
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields correctly', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        this.isProcessing = true;
        this.showLoading(true);

        try {
            const orderData = this.collectOrderData(paymentMethod);
            const response = await this.submitOrder(orderData);
            
            if (response.success || response.orderId) {
                this.handleOrderSuccess(response);
            } else {
                this.handleOrderError(response.error || 'Order submission failed');
            }
        } catch (error) {
            console.error('Order processing error:', error);
            this.handleOrderError('Failed to process order. Please try again.');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    collectOrderData(paymentMethod) {
        const formData = new FormData(document.getElementById('checkout-form'));
        const orderData = {};

        // Collect form data
        for (let [key, value] of formData.entries()) {
            orderData[key] = value;
        }

        // Add order details
        orderData.orderType = 'delivery'; // This checkout is delivery-only
        orderData.paymentMethod = paymentMethod;
        orderData.cart = this.cart; // Use 'cart' to match admin dashboard expectations
        orderData.items = this.cart; // Keep 'items' for backward compatibility
        orderData.subtotal = this.calculateSubtotal();
        orderData.deliveryFee = this.deliveryFee;
        orderData.total = orderData.subtotal + orderData.deliveryFee;
        orderData.timestamp = new Date().toISOString();
        orderData.orderNumber = this.generateOrderNumber();

        console.log('Order data collected:', orderData);
        return orderData;
    }

    generateOrderNumber() {
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(-2) + 
                       String(date.getMonth() + 1).padStart(2, '0') + 
                       String(date.getDate()).padStart(2, '0');
        const timeStr = String(date.getHours()).padStart(2, '0') + 
                       String(date.getMinutes()).padStart(2, '0');
        const randomStr = Math.random().toString(36).substr(2, 3).toUpperCase();
        
        return `ORD${dateStr}${timeStr}${randomStr}`;
    }

    async submitOrder(orderData) {
        console.log('Submitting order to server...');
        
        const response = await fetch('https://thecrustatngb.co.uk/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    handleOrderSuccess(response) {
        console.log('Order submitted successfully:', response);
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Show success message
        this.showNotification('Order submitted successfully! Thank you for your order.', 'success');
        
        // Redirect or show confirmation
        setTimeout(() => {
            this.showOrderConfirmation(response);
        }, 2000);
    }

    handleOrderError(error) {
        console.error('Order submission error:', error);
        this.showNotification(error || 'Failed to submit order. Please try again.', 'error');
    }

    showOrderConfirmation(orderData) {
        const container = document.querySelector('.checkout-container');
        if (container) {
            container.innerHTML = `
                <div class="order-confirmation">
                    <div class="confirmation-header">
                        <div class="success-icon">✅</div>
                        <h2>Order Confirmed!</h2>
                        <p>Thank you for your order. We've received it and will start preparing your delicious pizzas shortly.</p>
                    </div>
                    
                    <div class="order-summary-confirmation">
                        <h3>Order Details</h3>
                        <p><strong>Order Number:</strong> ${orderData.orderNumber || 'N/A'}</p>
                        <p><strong>Total:</strong> £${orderData.total ? orderData.total.toFixed(2) : 'N/A'}</p>
                        <p><strong>Estimated Delivery:</strong> ${orderData.estimatedTime || '45-60 minutes'}</p>
                    </div>
                    
                    <div class="confirmation-actions">
                        <button onclick="window.location.href='menu.html'" class="primary-btn">
                            Order Again
                        </button>
                        <button onclick="window.location.href='index.html'" class="secondary-btn">
                            Back to Home
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type} show`;

        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    setupDeliveryValidation() {
        const postcodeInput = document.getElementById('customer-postcode');
        const checkDeliveryBtn = document.getElementById('check-delivery-btn');
        const deliveryStatus = document.getElementById('delivery-status');

        if (!postcodeInput || !checkDeliveryBtn || !deliveryStatus) {
            console.warn('Delivery validation elements not found');
            return;
        }

        // Auto-format postcode as user types
        postcodeInput.addEventListener('input', (e) => {
            const formatted = this.formatPostcodeInput(e.target.value);
            if (formatted !== e.target.value) {
                e.target.value = formatted;
            }
            
            // Hide previous status when typing
            deliveryStatus.classList.remove('show');
            this.updatePaymentSection(null);
        });

        // Check delivery on button click
        checkDeliveryBtn.addEventListener('click', () => {
            this.validateDeliveryPostcode();
        });

        // Also check on Enter key in postcode field
        postcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.validateDeliveryPostcode();
            }
        });
    }

    formatPostcodeInput(value) {
        // Remove spaces and make uppercase
        let clean = value.replace(/\s+/g, '').toUpperCase();
        
        // Add space before last 3 characters if length > 3
        if (clean.length > 3) {
            clean = clean.slice(0, -3) + ' ' + clean.slice(-3);
        }
        
        return clean;
    }

    async validateDeliveryPostcode() {
        const postcodeInput = document.getElementById('customer-postcode');
        const checkDeliveryBtn = document.getElementById('check-delivery-btn');
        
        const postcode = postcodeInput.value.trim();
        
        if (!postcode) {
            this.showDeliveryStatus('Please enter a postcode', 'invalid');
            return;
        }

        // Show checking state
        checkDeliveryBtn.classList.add('checking');
        checkDeliveryBtn.disabled = true;
        checkDeliveryBtn.textContent = 'Checking';
        
        this.showDeliveryStatus('Checking delivery area...', 'checking');

        try {
            // Wait for delivery validator to be ready
            if (!window.deliveryValidator || !window.deliveryValidator.baseCoords) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const result = await window.deliveryValidator.validateDeliveryPostcode(postcode);
            
            if (result.valid) {
                const distanceBadge = result.distance ? 
                    ` <span class="distance-badge">${result.distance} miles</span>` : '';
                this.showDeliveryStatus(result.message + distanceBadge, 'valid');
                this.updatePaymentSection(true);
            } else {
                this.showDeliveryStatus(result.message, 'invalid');
                this.updatePaymentSection(false);
            }

        } catch (error) {
            console.error('Delivery validation error:', error);
            this.showDeliveryStatus('Unable to check delivery area. Please try again.', 'invalid');
            this.updatePaymentSection(false);
        } finally {
            // Reset button
            checkDeliveryBtn.classList.remove('checking');
            checkDeliveryBtn.disabled = false;
            checkDeliveryBtn.textContent = 'Check Delivery';
        }
    }

    showDeliveryStatus(message, type) {
        const deliveryStatus = document.getElementById('delivery-status');
        if (!deliveryStatus) return;

        deliveryStatus.innerHTML = message;
        deliveryStatus.className = `delivery-status show ${type}`;
    }

    updatePaymentSection(isValid) {
        const paymentSection = document.querySelector('.payment-section');
        if (!paymentSection) return;

        if (isValid === null) {
            // Reset state
            paymentSection.classList.remove('delivery-invalid');
        } else if (isValid) {
            paymentSection.classList.remove('delivery-invalid');
        } else {
            paymentSection.classList.add('delivery-invalid');
        }
    }
}

// Notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 300px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(350px);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .notification.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .notification.info {
        background: #cce7ff;
        color: #0056b3;
        border: 1px solid #b3d7ff;
    }

    .order-confirmation {
        padding: 3rem 2rem;
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
    }

    .confirmation-header .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .confirmation-header h2 {
        color: #28a745;
        margin-bottom: 1rem;
    }

    .order-summary-confirmation {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin: 2rem 0;
        text-align: left;
    }

    .confirmation-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }

    .primary-btn, .secondary-btn {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s ease;
    }

    .primary-btn {
        background: #d32f2f;
        color: white;
    }

    .primary-btn:hover {
        background: #b71c1c;
    }

    .secondary-btn {
        background: #6c757d;
        color: white;
    }

    .secondary-btn:hover {
        background: #5a6268;
    }

    @media (max-width: 768px) {
        .confirmation-actions {
            flex-direction: column;
        }
        
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
    }
`;

// Add styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing streamlined checkout...');
    new StreamlinedCheckout();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamlinedCheckout;
}