import { state, setView, setCategory, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart, startOrdering, processTip, completePayment, setPaymentMethod, subscribe, setLanguage, t, resetSession, availableLanguages } from './store.js';
import { submitOrder } from './data.js';

const app = document.querySelector('#app');

// Category icons mapping
const categoryIcons = {
  1: '🥣', // Breakfast
  2: '🥗', // Lunch & Dinner
  3: '🌯', // Handhelds
  4: '🍟', // Sides
  5: '🫕', // Dips
  6: '🥤', // Drinks
};

// Track the previous category to decide if we should reset product scroll
let lastCategoryId = null;

export function renderApp() {
  const root = document.querySelector('#app');
  if (!root) return;

  // 1. Save scroll positions before clearing
  const sidebarEl = root.querySelector('aside');
  const mainEl = root.querySelector('main');
  const savedSidebarScroll = sidebarEl ? sidebarEl.scrollTop : 0;
  const savedMainScroll = mainEl ? mainEl.scrollTop : 0;

  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'container';

  if (state.loading) {
    container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100dvh;font-size:1.5rem;color:var(--color-text-light);">
                Loading menu...
            </div>`;
    app.appendChild(container);
    return;
  }

  switch (state.view) {
    case 'attract':
      container.appendChild(renderAttractScreen());
      break;
    case 'menu':
      container.appendChild(renderMenuScreen());
      break;
    case 'payment':
      container.appendChild(renderPaymentScreen());
      break;
    case 'success':
      container.appendChild(renderSuccessScreen());
      break;
    default:
      container.innerText = 'View not found';
  }

  root.appendChild(container);

  // 2. Restore scroll positions after rendering
  if (state.view === 'menu') {
    const newSidebar = container.querySelector('aside');
    const newMain = container.querySelector('main');

    if (newSidebar) newSidebar.scrollTop = savedSidebarScroll;

    // Only restore main scroll if we are in the SAME category (e.g. just added an item)
    // If we switched categories, we WANT to start at the top
    if (newMain && state.category === lastCategoryId) {
      newMain.scrollTop = savedMainScroll;
    }
  }

  lastCategoryId = state.category;
}

// Track slideshow interval so we can clean it up
let attractInterval = null;

function renderAttractScreen() {
  // Clear any previous interval
  if (attractInterval) {
    clearInterval(attractInterval);
    attractInterval = null;
  }

  // Pick featured products (ones with images)
  const featured = state.products.filter(p => p.image_filename);

  const div = document.createElement('div');
  div.className = 'attract-screen';
  div.style.cssText = `
    flex: 1;
    position: relative;
    overflow: hidden;
    color: white;
    text-align: center;
  `;

  // --- Background image layers for crossfade ---
  const bgA = document.createElement('div');
  bgA.className = 'attract-bg attract-bg-active';
  bgA.id = 'attract-bg-a';

  const bgB = document.createElement('div');
  bgB.className = 'attract-bg';
  bgB.id = 'attract-bg-b';

  div.appendChild(bgA);
  div.appendChild(bgB);

  // --- Dark overlay ---
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.35) 0%,
      rgba(0,0,0,0.2) 40%,
      rgba(0,0,0,0.4) 70%,
      rgba(0,0,0,0.6) 100%
    );
    z-index: 2;
  `;
  div.appendChild(overlay);

  // --- Content ---
  const content = document.createElement('div');
  content.style.cssText = `
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: clamp(24px, 5vmin, 48px);
  `;

  content.innerHTML = `
    <!-- Language Selection -->
    <div class="lang-selector" style="position: absolute; top: clamp(16px, 3vmin, 32px); right: clamp(16px, 3vmin, 32px); display: flex; gap: 15px; z-index: 10;">
      <button class="lang-btn ${state.language === 'en' ? 'active' : ''}" data-lang="en" style="background: none; border: none; cursor: pointer; padding: 5px; border-radius: 5px; transition: all 0.2s;">
        <span style="font-size: 2rem;">🇬🇧</span>
      </button>
      <button class="lang-btn ${state.language === 'nl' ? 'active' : ''}" data-lang="nl" style="background: none; border: none; cursor: pointer; padding: 5px; border-radius: 5px; transition: all 0.2s;">
        <span style="font-size: 2rem;">🇳🇱</span>
      </button>
      <button class="lang-btn ${state.language === 'zh' ? 'active' : ''}" data-lang="zh" style="background: none; border: none; cursor: pointer; padding: 5px; border-radius: 5px; transition: all 0.2s;">
        <span style="font-size: 2rem;">🇨🇳</span>
      </button>
      <button id="more-lang-btn" style="background: rgba(255,255,255,0.1); border: none; cursor: pointer; padding: 5px 12px; border-radius: 50px; color: white; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
        <span style="font-size: 1.5rem;">🌐</span>
        <span style="font-family: var(--font-family-headings); font-size: 0.9rem; letter-spacing: 1px;">MORE</span>
      </button>
    </div>

    <!-- Logo -->
    <div style="padding-top: clamp(16px, 3vmin, 32px);">
      <img src="/images/logo.png" alt="Ham Halek" style="height: clamp(240px, 50vmin, 500px); filter: drop-shadow(2px 2px 10px rgba(0,0,0,0.5));">
    </div>

    <!-- Product info (fades with image) -->
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h2 id="attract-product-name" style="
        font-family: var(--font-family-headings);
        font-size: clamp(1.8rem, 5vmin, 3rem);
        font-weight: 400;
        text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
        margin-bottom: 8px;
        transition: opacity 0.6s ease;
      "></h2>
      <p id="attract-product-desc" style="
        font-family: var(--font-family-body);
        font-size: clamp(0.9rem, 2.5vmin, 1.2rem);
        opacity: 0.85;
        max-width: 500px;
        text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
        transition: opacity 0.6s ease;
      "></p>
    </div>

    <!-- Button + tagline -->
    <div style="display: flex; flex-direction: column; align-items: center; gap: clamp(16px, 3vmin, 32px); padding-bottom: clamp(16px, 3vmin, 32px);">
      <button id="start-btn" class="attract-start-btn">
        ${t('touch_to_start')}
      </button>
      <p style="font-size: clamp(0.7rem, 1.5vmin, 0.85rem); opacity: 0.7; letter-spacing: 2px;">
        100% Plant-Based • Sustainable • Delicious
      </p>
    </div>
  `;

  div.appendChild(content);

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = `
    .attract-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transition: opacity 1.2s ease-in-out;
      z-index: 1;
    }
    .attract-bg-active {
      opacity: 1;
    }
    .attract-start-btn {
      font-family: var(--font-family-headings);
      font-size: clamp(1.4rem, 3.5vmin, 2rem);
      font-weight: 400;
      padding: clamp(18px, 3vmin, 28px) clamp(48px, 8vmin, 80px);
      background-color: var(--color-accent);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      letter-spacing: 2px;
      text-transform: uppercase;
      animation: pulse 2s infinite;
      transition: all 0.2s;
    }
    .attract-start-btn:active {
      background-color: var(--color-accent-hover);
      transform: scale(0.97);
    }
    .lang-btn.active {
      background: rgba(255,255,255,0.2) !important;
      outline: 2px solid var(--color-orange);
    }
    .lang-btn:hover {
      background: rgba(255,255,255,0.1) !important;
    }
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(230, 126, 34, 0.7); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(230, 126, 34, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(230, 126, 34, 0); }
    }
  `;
  div.appendChild(style);

  // --- Slideshow logic ---
  let currentIndex = 0;
  let activeLayer = 'a'; // which bg layer is currently visible

  function showSlide(index) {
    if (featured.length === 0) return;

    const product = featured[index % featured.length];
    const imageUrl = `/images/${product.image_filename}`;

    const nameEl = div.querySelector('#attract-product-name');
    const descEl = div.querySelector('#attract-product-desc');
    const layerA = div.querySelector('#attract-bg-a');
    const layerB = div.querySelector('#attract-bg-b');

    if (!nameEl || !layerA) return; // element was removed (view changed)

    // Fade out text
    nameEl.style.opacity = '0';
    descEl.style.opacity = '0';

    // Crossfade background: set new image on inactive layer, then swap
    const nextLayer = activeLayer === 'a' ? layerB : layerA;
    const currentLayer = activeLayer === 'a' ? layerA : layerB;

    nextLayer.style.backgroundImage = `url('${imageUrl}')`;

    // Small delay to let image start loading, then crossfade
    setTimeout(() => {
      nextLayer.classList.add('attract-bg-active');
      currentLayer.classList.remove('attract-bg-active');
      activeLayer = activeLayer === 'a' ? 'b' : 'a';

      // Fade in text with new product info
      nameEl.textContent = product.name;
      descEl.textContent = product.description || '';
      nameEl.style.opacity = '1';
      descEl.style.opacity = '0.85';
    }, 100);
  }

  // Show first slide immediately
  if (featured.length > 0) {
    const first = featured[0];
    bgA.style.backgroundImage = `url('/images/${first.image_filename}')`;
    bgA.classList.add('attract-bg-active');

    const nameEl = content.querySelector('#attract-product-name');
    const descEl = content.querySelector('#attract-product-desc');
    nameEl.textContent = first.name;
    nameEl.style.opacity = '1';
    descEl.textContent = first.description || '';
    descEl.style.opacity = '0.85';

    currentIndex = 1;
  }

  // Cycle every 5 seconds
  attractInterval = setInterval(() => {
    showSlide(currentIndex);
    currentIndex = (currentIndex + 1) % featured.length;
  }, 5000);

  // Language selection
  div.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      const lang = btn.dataset.lang;
      console.log('Language changed to:', lang);
      setLanguage(lang);
    };
  });

  // More languages
  div.querySelector('#more-lang-btn').onclick = () => renderLanguagePicker();

  // Button
  div.querySelector('#start-btn').onclick = () => {
    if (attractInterval) {
      clearInterval(attractInterval);
      attractInterval = null;
    }
    renderOrderTypeModal();
  };

  return div;
}

function renderLanguagePicker() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '100';

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.maxWidth = '600px';
  content.style.maxHeight = '80vh';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';

  content.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 20px;">${t('select_language')}</h2>
        <div class="lang-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; overflow-y: auto; padding: 10px; flex: 1; text-align: left;">
            ${availableLanguages.map(lang => `
                <button class="lang-picker-btn ${state.language === lang.code ? 'active' : ''}" data-lang="${lang.code}" 
                        style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 10px; background: white; cursor: pointer; transition: all 0.2s;">
                    <span style="font-size: 1.5rem;">${lang.flag}</span>
                    <span style="font-weight: 500; font-size: 0.9rem;">${lang.name}</span>
                </button>
            `).join('')}
        </div>
        <button id="close-lang-picker" class="btn btn-secondary" style="margin-top: 20px; width: 100%;">Close</button>
    `;

  overlay.appendChild(content);
  app.appendChild(overlay);

  overlay.querySelectorAll('.lang-picker-btn').forEach(btn => {
    btn.onclick = () => {
      setLanguage(btn.dataset.lang);
      app.removeChild(overlay);
    };
  });

  overlay.querySelector('#close-lang-picker').onclick = () => {
    app.removeChild(overlay);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) app.removeChild(overlay);
  };
}

function renderOrderTypeModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  content.innerHTML = `
        <h2 style="font-size: 2.2rem; margin-bottom: 20px;">${t('dining_choice')}</h2>
        <p style="font-size: 1.2rem; margin-bottom: 30px;">${t('dining_msg')}</p>
        
        <div class="tip-grid">
            <button id="eat-in" class="btn btn-primary" style="padding: 24px; font-size: 1.2rem; flex-direction: column; gap: 10px;">
                <span style="font-size: 2.5rem;">🍽️</span>
                <span>${t('eat_in')}</span>
            </button>
            <button id="takeaway" class="btn btn-primary" style="padding: 24px; font-size: 1.2rem; flex-direction: column; gap: 10px;">
                <span style="font-size: 2.5rem;">🥡</span>
                <span>${t('takeaway')}</span>
            </button>
        </div>
    `;

  const close = () => {
    if (app.contains(overlay)) app.removeChild(overlay);
  };

  content.querySelector('#eat-in').onclick = () => {
    console.log('Eat-in clicked');
    close();
    startOrdering('eat-in');
  };

  content.querySelector('#takeaway').onclick = () => {
    console.log('Takeaway clicked');
    close();
    startOrdering('takeaway');
  };

  overlay.appendChild(content);
  app.appendChild(overlay);
}

function renderMenuScreen() {
  const layout = document.createElement('div');
  layout.className = 'menu-layout';

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  const logo = document.createElement('div');
  logo.className = 'sidebar-logo';
  logo.innerHTML = '<img src="/images/logo1.png" alt="Ham Halek">';
  logo.addEventListener('click', () => resetSession());
  sidebar.appendChild(logo);

  const catList = document.createElement('div');
  catList.className = 'category-list';

  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    const isActive = state.category === cat.category_id;
    const icon = categoryIcons[cat.category_id] || '🍽️';
    btn.className = `category-btn ${isActive ? 'active' : ''}`;
    btn.innerHTML = `<span class="category-icon">${icon}</span> <span>${cat.name}</span>`;
    btn.addEventListener('click', () => setCategory(cat.category_id));
    catList.appendChild(btn);
  });

  sidebar.appendChild(catList);
  layout.appendChild(sidebar);

  // Main content
  const main = document.createElement('main');
  main.className = 'main-content';

  const grid = document.createElement('div');
  grid.className = 'product-grid';

  const filtered = state.products.filter(p => p.category_id === state.category);

  filtered.forEach(product => {
    const imageUrl = product.image_filename ? `/images/${product.image_filename}` : '';
    const price = parseFloat(product.price);

    const card = document.createElement('div');
    card.className = 'card product-card fade-in';
    card.style.cssText = `display: flex; flex-direction: column; height: 100%; transition: transform 0.2s;`;

    card.innerHTML = `
            <div style="height: 220px; overflow: hidden; border-radius: var(--border-radius-sm); margin-bottom: var(--spacing-sm); background: #f0f0f0;">
                ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
            </div>
            <h3 style="margin-bottom: var(--spacing-xs);">${product.name}</h3>
            <p style="color: var(--color-text-light); font-size: 0.9rem; flex: 1; margin-bottom: var(--spacing-sm);">${product.description || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                <div>
                    <span style="font-weight: 700; font-size: 1.2rem;">€${price.toFixed(2)}</span>
                    ${product.kcal ? `<span style="color: var(--color-text-light); font-size: 0.8rem; margin-left: 8px;">${product.kcal} ${t('kcal')}</span>` : ''}
                </div>
                <button class="add-btn btn btn-primary" style="padding: 8px 16px;">${t('add')}</button>
            </div>
        `;

    card.querySelector('.add-btn').addEventListener('click', () => addToCart(product));
    grid.appendChild(card);
  });

  main.appendChild(grid);

  // Cart bar
  const cartCount = getCartCount();
  if (cartCount > 0) {
    const cartBar = document.createElement('div');
    cartBar.style.cssText = `
            position: absolute;
            bottom: var(--spacing-lg);
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--color-dark-blue);
            color: white;
            padding: var(--spacing-sm) var(--spacing-lg);
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            box-shadow: var(--shadow-lg);
            cursor: pointer;
            width: 90%;
            max-width: 600px;
            justify-content: space-between;
            z-index: 10;
        `;

    cartBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: var(--color-orange); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: var(--font-family-headings); font-size: 0.9rem;">${cartCount}</span>
                <span style="font-family: var(--font-family-headings); text-transform: uppercase; letter-spacing: 1px;">${t('items_in_order')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 400; font-size: 1.3rem; font-family: var(--font-family-headings);">€${getCartTotal().toFixed(2)}</span>
                <span style="font-size: 1.5rem;">→</span>
            </div>
        `;

    cartBar.addEventListener('click', () => renderCartModal());
    main.appendChild(cartBar);
  }

  layout.appendChild(main);
  return layout;
}

function renderCartModal() {
  const overlay = document.createElement('div');
  overlay.id = 'cart-modal';
  overlay.className = 'modal-overlay cart-overlay';

  const panel = document.createElement('div');
  panel.className = 'cart-panel';

  function updateContent() {
    panel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'cart-header';
    header.innerHTML = `<h2>${t('your_order')}</h2><button id="close-cart" style="font-size: 2rem;">&times;</button>`;
    panel.appendChild(header);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'cart-items';

    state.cart.forEach(item => {
      const imageUrl = item.product.image_filename ? `/images/${item.product.image_filename}` : '';
      const price = parseFloat(item.product.price);

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
              ${imageUrl ? `<img src="${imageUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: var(--border-radius-sm);">` : ''}
              <div style="flex: 1; padding-left: 5px;">
                  <div style="font-weight: 600; font-family: var(--font-family-headings); font-size: 1.1rem; color: var(--color-dark-blue);">${item.product.name}</div>
                  <div style="color: var(--color-text-light); font-size: 1rem;">€${price.toFixed(2)} ${t('each')}</div>
              </div>
              <div class="qty-control">
                  <button class="qty-btn minus" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">-</button>
                  <span style="min-width: 30px; text-align: center; font-weight: bold; font-family: var(--font-family-headings);">${item.quantity}</span>
                  <button class="qty-btn plus" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">+</button>
              </div>
          `;
      itemEl.querySelector('.minus').onclick = (e) => { e.stopPropagation(); updateQuantity(item.id, -1); };
      itemEl.querySelector('.plus').onclick = (e) => { e.stopPropagation(); updateQuantity(item.id, 1); };
      itemsContainer.appendChild(itemEl);
    });

    if (state.cart.length === 0) {
      itemsContainer.innerHTML = `<div style="text-align: center; color: var(--color-text-light); margin-top: 50px; font-size: 1.2rem;">${t('empty_cart')}</div>`;
    }

    panel.appendChild(itemsContainer);

    const footer = document.createElement('div');
    footer.style.cssText = 'border-top: 2px solid #eee; padding-top: var(--spacing-md); margin-top: var(--spacing-md);';
    const total = getCartTotal();
    footer.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 1.5rem; font-family: var(--font-family-headings); margin-bottom: var(--spacing-md);">
              <span>${t('total')}</span>
              <span>€${total.toFixed(2)}</span>
          </div>
          <button id="checkout-btn" class="btn btn-primary" style="width: 100%; padding: 20px;" ${state.cart.length === 0 ? 'disabled' : ''}>
              ${state.cart.length === 0 ? t('cart_empty_btn') : t('confirm_order')}
          </button>
      `;
    panel.appendChild(footer);

    const close = () => {
      unsubscribe();
      if (app.contains(overlay)) app.removeChild(overlay);
    };

    panel.querySelector('#close-cart').onclick = close;
    panel.querySelector('#checkout-btn').onclick = () => {
      if (state.cart.length > 0) {
        close();
        renderUpsellModal();
      }
    };
  }

  const unsubscribe = subscribe(() => {
    updateContent();
  });

  updateContent();

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      unsubscribe();
      app.removeChild(overlay);
    }
  };

  overlay.appendChild(panel);
  app.appendChild(overlay);
}

function renderPaymentScreen() {
  const div = document.createElement('div');
  div.className = 'payment-screen';

  const total = getCartTotal().toFixed(2);

  div.innerHTML = `
        <h2 class="payment-total">${t('total')}: €${total}</h2>
        <div id="payment-terminal" class="payment-terminal">
            <span style="font-size: 5rem;">💳</span>
        </div>
        <p id="payment-status" class="payment-status">${t('tap_to_pay')}</p>
        <button id="cancel-pay-btn" class="btn btn-secondary payment-cancel-btn">${t('cancel')}</button>
    `;

  const terminal = div.querySelector('#payment-terminal');
  const status = div.querySelector('#payment-status');
  const cancelBtn = div.querySelector('#cancel-pay-btn');

  const paymentProcess = async () => {
    if (div.dataset.processing) return;
    div.dataset.processing = "true";

    terminal.style.borderColor = 'var(--color-accent)';
    terminal.style.transform = 'scale(0.95)';
    status.textContent = t('processing');
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = "0.5";

    // Try to submit to backend, but always proceed to success
    let pickupNumber = Math.floor(Math.random() * 99) + 1;
    try {
      const result = await submitOrder(state.cart);
      pickupNumber = result.pickup_number;
    } catch (err) {
      console.warn('Backend order submission failed, continuing offline:', err);
    }

    state.orderNumber = pickupNumber;

    terminal.style.transform = 'scale(1)';
    terminal.innerHTML = `<span style="font-size: 4rem; color: var(--color-success);">✓</span>`;
    terminal.style.borderColor = 'var(--color-success)';
    terminal.style.background = '#e8f5e9';
    status.textContent = t('pay_approved');

    setTimeout(() => setView('success'), 1500);
  };

  terminal.addEventListener('click', paymentProcess);
  cancelBtn.addEventListener('click', () => setView('menu'));

  return div;
}

function renderSuccessScreen() {
  const div = document.createElement('div');
  div.className = 'success-screen';

  const msg = state.paymentMethod === 'counter' ? t('proceed_counter') : t('please_receipt');
  const itemsTotal = getCartTotal().toFixed(2);

  div.innerHTML = `
        <div class="success-card animate-up">
            <div class="success-checkmark">✓</div>
            <p style="font-family: var(--font-family-headings); font-size: 1.2rem; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 2px;">${t('order_num')}</p>
            <h1 class="order-number-massive">${state.orderNumber || '00'}</h1>
            
            <div class="receipt-divider"></div>
            
            <div style="text-align: left; margin: 20px 0;">
                <p style="font-size: 1.1rem; color: var(--color-dark-blue); font-weight: 600; margin-bottom: 5px;">${msg}</p>
                <p style="font-size: 0.9rem; color: var(--color-text-light);">${t('ready_shortly')}</p>
            </div>

            <div style="background: rgba(140, 208, 3, 0.05); padding: 15px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; border: 1px dashed var(--color-green);">
                <span style="font-weight: 600; color: var(--color-dark-blue);">${state.orderType === 'eat-in' ? t('eat_in') : t('takeaway')}</span>
                <span style="font-family: var(--font-family-headings); color: var(--color-green); font-size: 1.2rem;">€${itemsTotal}</span>
            </div>
        </div>

        <button id="new-order-btn" class="btn btn-primary animate-up" style="animation-delay: 0.2s; padding: 24px 80px; font-size: 1.5rem; box-shadow: 0 10px 20px rgba(255,117,32,0.2);">
            ${t('finish')}
        </button>
    `;

  div.querySelector('#new-order-btn').addEventListener('click', () => {
    resetSession();
  });

  return div;
}

function renderUpsellModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // Pick a random product NOT in cart
  const cartProductIds = state.cart.map(item => item.product.product_id);
  const available = state.products.filter(p => !cartProductIds.includes(p.product_id));

  // If no products available to upsell, skip to tip
  if (available.length === 0) {
    renderTipModal();
    return;
  }

  const product = available[Math.floor(Math.random() * available.length)];
  const imageUrl = product.image_filename ? `/images/${product.image_filename}` : '';

  const content = document.createElement('div');
  content.className = 'modal-content';

  content.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 10px;">${t('try_this')}</h2>
        <div class="upsell-card">
            ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--border-radius-sm); margin-bottom: 15px;">` : ''}
            <h3 style="font-size: 1.5rem;">${product.name}</h3>
            <p style="color: var(--color-text-light); margin: 10px 0;">€${parseFloat(product.price).toFixed(2)}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="add-upsell" class="btn btn-primary" style="padding: 18px;">${t('add_it')}</button>
            <button id="no-upsell" class="btn" style="color: var(--color-text-light); font-size: 0.9rem;">${t('no_thanks')}</button>
        </div>
    `;

  const close = () => {
    if (app.contains(overlay)) app.removeChild(overlay);
  };

  content.querySelector('#add-upsell').onclick = () => {
    console.log('Upsell added');
    addToCart(product);
    close();
    renderTipModal();
  };

  content.querySelector('#no-upsell').onclick = () => {
    console.log('Upsell skipped');
    close();
    renderTipModal();
  };

  overlay.appendChild(content);
  app.appendChild(overlay);
}

function renderTipModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  content.innerHTML = `
        <h2 style="font-size: 2.2rem; margin-bottom: 20px;">${t('support_team')}</h2>
        <p style="font-size: 1.2rem; line-height: 1.4; opacity: 0.9;">${t('tip_msg')}</p>
        
        <div class="tip-grid">
            <button id="add-tip" class="btn btn-primary" style="padding: 20px; font-size: 1.2rem;">${t('yes_please')}</button>
            <button id="no-tip" class="btn btn-secondary" style="background: #eee; color: #666; padding: 20px;">${t('no_support')}</button>
        </div>
    `;

  const close = () => {
    if (app.contains(overlay)) app.removeChild(overlay);
  };

  content.querySelector('#add-tip').onclick = () => {
    console.log('Tip processed: 0.50');
    close();
    processTip(0.50);
    renderPaymentOptionsModal();
  };

  content.querySelector('#no-tip').onclick = () => {
    console.log('Tip skipped');
    close();
    processTip(0);
    renderPaymentOptionsModal();
  };

  overlay.appendChild(content);
  app.appendChild(overlay);
}

function renderPaymentOptionsModal() {
  console.log('Rendering Payment Options Modal');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  content.innerHTML = `
        <h2 style="font-size: 2.2rem; margin-bottom: 20px;">${t('pay_method')}</h2>
        <p style="font-size: 1.2rem; margin-bottom: 30px;">${t('payment_choice_msg')}</p>
        
        <div class="tip-grid">
            <button id="pay-card" class="btn btn-primary" style="padding: 24px; font-size: 1.1rem; flex-direction: column; gap: 10px;">
                <span style="font-size: 2.5rem;">💳</span>
                <span>${t('pay_card')}</span>
            </button>
            <button id="pay-counter" class="btn btn-primary" style="padding: 24px; font-size: 1.1rem; flex-direction: column; gap: 10px;">
                <span style="font-size: 2.5rem;">🏪</span>
                <span>${t('pay_counter')}</span>
            </button>
        </div>
    `;

  const close = () => {
    if (app.contains(overlay)) app.removeChild(overlay);
  };

  content.querySelector('#pay-card').onclick = () => {
    console.log('Card payment selected');
    close();
    completePayment('card', 'payment');
  };

  content.querySelector('#pay-counter').onclick = async () => {
    console.log('Counter payment selected');
    close();

    // Try backend, but always proceed to success
    let pickupNumber = Math.floor(Math.random() * 99) + 1;
    try {
      const result = await submitOrder(state.cart);
      pickupNumber = result.pickup_number;
    } catch (err) {
      console.warn('Counter order backend failed, continuing offline:', err);
    }
    state.orderNumber = pickupNumber;
    completePayment('counter', 'success');
  };

  overlay.appendChild(content);
  app.appendChild(overlay);
}
