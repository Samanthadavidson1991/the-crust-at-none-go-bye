// Mobile Debug Script for Checkout
console.log('=== MOBILE DEBUG START ===');
console.log('User Agent:', navigator.userAgent);
console.log('Screen Size:', screen.width + 'x' + screen.height);
console.log('Window Size:', window.innerWidth + 'x' + window.innerHeight);
console.log('Device Pixel Ratio:', window.devicePixelRatio);
console.log('Touch Support:', 'ontouchstart' in window);

// Check if all CSS files are loaded
const cssFiles = ['style.css', 'checkout-styles.css'];
cssFiles.forEach(file => {
    const link = document.querySelector(`link[href*="${file}"]`);
    console.log(`CSS ${file}:`, link ? 'LOADED' : 'MISSING');
});

// Check if JavaScript is working
console.log('Document Ready State:', document.readyState);
console.log('Elements found:');
console.log('- .checkout-container:', document.querySelector('.checkout-container') ? 'YES' : 'NO');
console.log('- .cash-btn:', document.querySelector('.cash-btn') ? 'YES' : 'NO');
console.log('- .card-btn:', document.querySelector('.card-btn') ? 'YES' : 'NO');
console.log('- .order-summary:', document.querySelector('.order-summary') ? 'YES' : 'NO');

// Check localStorage
console.log('LocalStorage available:', typeof(Storage) !== "undefined");
console.log('Cart data:', localStorage.getItem('cart') || 'EMPTY');
console.log('Checkout cart data:', localStorage.getItem('checkoutCart') || 'EMPTY');

// Check for errors
window.addEventListener('error', function(e) {
    console.error('MOBILE ERROR:', e.message, 'at', e.filename + ':' + e.lineno);
});

console.log('=== MOBILE DEBUG END ===');