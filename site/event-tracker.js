(() => {
  const sessionId = (function(){
    let id = sessionStorage.getItem('sessionId');
    if (!id) { id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2); sessionStorage.setItem('sessionId', id); }
    return id;
  })();
  const userId = (function(){
    let id = localStorage.getItem('userId');
    if (!id) { id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2); localStorage.setItem('userId', id); }
    return id;
  })();

  function post(url, body) {
    try { fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch(e) {}
  }

  function track(event, data) {
    post('/api/events', {
      userId, sessionId, event,
      data: {
        ...data,
        page: location.pathname,
        referrer: document.referrer,
        ua: navigator.userAgent,
        vw: innerWidth, vh: innerHeight
      },
      timestamp: new Date().toISOString()
    });
  }

  // Page view
  track('page_view', {});

  // Click tracking (lightweight)
  document.addEventListener('click', function(e){
    const t = e.target.closest('a,button');
    if (!t) return;
    const txt = (t.textContent||'').trim().slice(0,80);
    track('click', { tag: t.tagName, text: txt, href: t.href || null, id: t.id || null, class: t.className || null });
  }, { passive: true });

  // Cart API helpers (attach to window)
  window.CartTracker = {
    createOrUpdate(cart) {
      post('/api/cart/track', {
        cartId: cart.cartId,
        userId,
        sessionId,
        status: cart.status || 'active',
        product: cart.product,
        totalPrice: cart.totalPrice,
        userData: cart.userData,
        stepsCompleted: cart.stepsCompleted,
        stepsRemaining: cart.stepsRemaining,
        dropOffPoint: cart.dropOffPoint
      });
      localStorage.setItem('activeCart', JSON.stringify({ ...cart, userId, sessionId }));
    },
    markAbandoned(cartId) {
      const cart = JSON.parse(localStorage.getItem('activeCart')||'null');
      if (cart && (!cartId || cart.cartId === cartId)) {
        this.createOrUpdate({ ...cart, status: 'abandoned', dropOffPoint: 'page_exit' });
      }
    }
  };

  // Mark abandoned on unload
  window.addEventListener('beforeunload', function(){
    window.CartTracker.markAbandoned();
  });
})();


