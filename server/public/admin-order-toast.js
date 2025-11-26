// Shared admin notification script for new orders
(function() {
  let lastOrderIds = [];
  let polling = false;
  function showOrderToast(order) {
    // Remove any existing toast
    const old = document.getElementById('order-toast');
    if (old) old.remove();
    // Create toast
    const toast = document.createElement('div');
    toast.id = 'order-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '32px';
    toast.style.right = '32px';
    toast.style.background = '#fffbe6';
    toast.style.border = '2px solid #b9472e';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
    toast.style.padding = '20px 28px 20px 20px';
    toast.style.zIndex = 9999;
    toast.style.fontFamily = 'Quicksand, Arial, sans-serif';
    toast.style.fontSize = '1.1em';
    toast.innerHTML = `
      <b style='color:#b9472e'>New Order!</b><br>
      <b>Slot:</b> ${order.timeSlot || ''}<br>
      <b>Name:</b> ${order.name || ''}<br>
      <b>Items:</b> ${order.items && order.items.length ? order.items.map(i => `${i.quantity||1}×${i.name}`).join(', ') : 'None'}<br>
      <a href="orders.html" style="color:#b9472e;text-decoration:underline;font-weight:bold;">View Orders</a>
      <div style="margin-top:10px">
        <button id="order-toast-accept" style="background:#4caf50;color:#fff;border:none;padding:6px 16px;border-radius:6px;margin-right:8px;cursor:pointer;font-weight:bold;">Accept</button>
        <button id="order-toast-decline" style="background:#b9472e;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:bold;">Decline</button>
      </div>
      <span id="order-toast-close" style="position:absolute;top:6px;right:12px;cursor:pointer;font-size:1.2em;">&times;</span>
    `;
    document.body.appendChild(toast);
    document.getElementById('order-toast-close').onclick = () => toast.remove();
    document.getElementById('order-toast-accept').onclick = async () => {
      try {
        await fetch(`https://admin.thecrustatngb.co.uk/api/orders/${order._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Accepted' }),
          credentials: 'include'
        });
      } catch {}
      toast.remove();
    };
    document.getElementById('order-toast-decline').onclick = async () => {
      try {
        await fetch(`https://admin.thecrustatngb.co.uk/api/orders/${order._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Declined' }),
          credentials: 'include'
        });
      } catch {}
      toast.remove();
    };
    // Removed auto-close timeout so admin can always accept/decline
  }
  async function pollOrders() {
    if (polling) return;
    polling = true;
    try {
      const res = await fetch('https://admin.thecrustatngb.co.uk/api/orders', { credentials: 'include' });
      if (!res.ok) return;
      const orders = await res.json();
      const ids = Array.isArray(orders) ? orders.map(o => o._id) : [];
      if (lastOrderIds.length && ids.length > lastOrderIds.length) {
        // Find the new order(s)
        const newOrders = orders.filter(o => !lastOrderIds.includes(o._id));
        if (newOrders.length) showOrderToast(newOrders[0]);
      }
      lastOrderIds = ids;
    } catch {}
    polling = false;
  }
  setInterval(pollOrders, 8000);
  document.addEventListener('DOMContentLoaded', pollOrders);
})();
