const modal = document.querySelector('#product-modal');
const detailImage = document.querySelector('#detail-image');
const detailName = document.querySelector('#detail-name');
const detailPrice = document.querySelector('#detail-price');
const detailDescription = document.querySelector('#detail-description');
const imageWrap = document.querySelector('.detail-image-wrap');
const closeButton = document.querySelector('.modal-close');
const productGrid = document.querySelector('.product-grid');
const checkoutButton = document.querySelector('.checkout-button');
const checkoutMessage = document.querySelector('.checkout-message');
const addToBagButton = document.querySelector('.add-to-bag-button');
const bagButton = document.querySelector('.bag');
const bagCount = bagButton?.querySelector('b');
const bagDrawer = document.querySelector('#bag-drawer');
const bagItems = document.querySelector('.bag-items');
const bagEmpty = document.querySelector('.bag-empty');
const bagTotal = document.querySelector('.bag-total strong');
const bagBackdrop = document.querySelector('.bag-backdrop');
const bagClose = document.querySelector('.bag-close');
const zellePanel = document.querySelector('.zelle-panel');
const zelleProductName = document.querySelector('#zelle-product-name');
const shippingQuotePanel = document.querySelector('#shipping-quote');const shippingStreetInput = document.querySelector('#shipping-street');
const shippingCityInput = document.querySelector('#shipping-city');
const shippingStateInput = document.querySelector('#shipping-state');
const shippingZipInput = document.querySelector('#shipping-zip');
const shippingRatesButton = document.querySelector('#get-shipping-rates');
const shippingStatus = document.querySelector('#shipping-status');
const shippingOptions = document.querySelector('#shipping-options');
const menuButton = document.querySelector('.menu');
const siteNav = document.querySelector('#site-nav');
let opener;
let bag = JSON.parse(localStorage.getItem('sakhi-mohini-bag') || '[]');
let catalogue = [];
let selectedShippingQuote = null;

menuButton?.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  menuButton.textContent = isOpen ? '×' : '☰';
});
siteNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open menu');
  if (menuButton) menuButton.textContent = '☰';
}));

const formatPrice = price => `$${Number(price).toLocaleString('en-US')}`;

function addProductCardInteractions(card) {
  card.addEventListener('click', event => { if (!event.target.closest('.heart')) openProduct(card); });
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(card); }
  });
  card.querySelector('.heart').addEventListener('click', event => {
    event.stopPropagation();
    event.currentTarget.textContent = event.currentTarget.textContent === '♡' ? '♥' : '♡';
  });
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${product.name}`);
  card.dataset.description = product.description || '';
  card.dataset.productName = product.name;

  const imageBox = document.createElement('div');
  imageBox.className = 'product-image';
  if (product.label) {
    const label = document.createElement('span');
    label.textContent = product.label;
    imageBox.append(label);
  }
  const heart = document.createElement('button');
  heart.className = 'heart';
  heart.type = 'button';
  heart.setAttribute('aria-label', `Save ${product.name}`);
  heart.textContent = '♡';
  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.alt || product.name;
  image.loading = 'lazy';
  imageBox.append(heart, image);

  const name = document.createElement('h3');
  name.textContent = product.name;
  const price = document.createElement('p');
  price.textContent = formatPrice(product.price);
  const category = document.createElement('p');
  category.className = 'product-type';
  category.textContent = product.category || 'Celebration edit';
  
  
  
  card.append(imageBox, name, price, category);
  addProductCardInteractions(card);
  return card;
}

async function loadCatalog() {
  try {
    const response = await fetch('products.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catalog could not be loaded');
    catalogue = await response.json();
    renderCatalog();
  } catch (error) {
    productGrid.innerHTML = '<p class="catalog-status">The collection is temporarily unavailable. Please refresh the page.</p>';
  }
}

function renderCatalog(category = 'all') {
  const visibleProducts = catalogue.filter(product => product.visible !== false && (category === 'all' || String(product.category || '').toUpperCase() === category));
  productGrid.replaceChildren(...visibleProducts.map(createProductCard));
  if (!visibleProducts.length) productGrid.innerHTML = '<p class="catalog-status">More pieces are arriving soon. Please view all pieces for the full collection.</p>';
}

document.querySelectorAll('[data-category]').forEach(link => link.addEventListener('click', () => {
  renderCatalog(link.dataset.category);
}));

function openProduct(card) {
  const image = card.querySelector('img');
  const name = card.querySelector('h3').textContent;
  detailImage.src = image.src;
  detailImage.alt = image.alt;
  detailName.textContent = name;
  detailPrice.textContent = card.querySelector('p').textContent;
  detailDescription.textContent = card.dataset.description || 'A thoughtfully crafted occasionwear piece, designed for comfort, confidence and celebration.';
  zelleProductName.textContent = name;
  opener = card;
  resetShippingQuotes();
  selectPaymentMethod('stripe');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeButton.focus();
}

function saveBag() {
  localStorage.setItem('sakhi-mohini-bag', JSON.stringify(bag));
  renderBag();
}

function renderBag() {
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  const total = bag.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  if (bagCount) bagCount.textContent = count;
  if (bagItems) {
    bagItems.replaceChildren(...bag.map(item => {
      const row = document.createElement('div');
      row.className = 'bag-item';
      row.innerHTML = `<img src="${item.image}" alt=""><div><h3></h3><p>${formatPrice(item.price)} · Qty ${item.quantity}</p><button type="button" class="bag-item-checkout">Checkout</button></div><button type="button" class="bag-remove" aria-label="Remove ${item.name}">×</button>`;
      row.querySelector('h3').textContent = item.name;
      row.querySelector('.bag-remove').addEventListener('click', () => { bag = bag.filter(entry => entry.name !== item.name); saveBag(); });
      row.querySelector('.bag-item-checkout').addEventListener('click', () => {
        const card = [...productGrid.children].find(entry => entry.dataset.productName === item.name);
        if (!card) return;
        closeBag();
        openProduct(card);
      });
      return row;
    }));
  }
  bagEmpty.hidden = count > 0;
  document.querySelector('.bag-total').hidden = count === 0;
  document.querySelector('.bag-help').hidden = count === 0;
  bagTotal.textContent = formatPrice(total);
}

function openBag() {
  renderBag();
  bagDrawer.classList.add('open');
  bagDrawer.setAttribute('aria-hidden', 'false');
  bagBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  bagClose.focus();
}

function closeBag() {
  bagDrawer.classList.remove('open');
  bagDrawer.setAttribute('aria-hidden', 'true');
  bagBackdrop.hidden = true;
  document.body.style.overflow = modal.classList.contains('open') ? 'hidden' : '';
  bagButton?.focus();
}

function closeProduct() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  imageWrap.classList.remove('zooming');
  detailImage.style.transformOrigin = 'center';
  opener?.focus();
}

closeButton.addEventListener('click', closeProduct);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeProduct(); });

function updateZoom(event) {
  const box = imageWrap.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100));
  const y = Math.max(0, Math.min(100, ((event.clientY - box.top) / box.height) * 100));
  detailImage.style.transformOrigin = `${x}% ${y}%`;
}

imageWrap.addEventListener('pointerdown', event => {
  imageWrap.setPointerCapture(event.pointerId);
  updateZoom(event);
  imageWrap.classList.add('zooming');
});
imageWrap.addEventListener('pointermove', event => { if (imageWrap.classList.contains('zooming')) updateZoom(event); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => imageWrap.addEventListener(type, () => imageWrap.classList.remove('zooming')));

function selectPaymentMethod(payment) {
  document.querySelectorAll('.method').forEach(item => item.classList.remove('selected'));
  document.querySelector(`.method[data-payment="${payment}"]`)?.classList.add('selected');
  const isZelle = payment === 'zelle';
  zellePanel.hidden = !isZelle;
  shippingQuotePanel.hidden = isZelle;
  checkoutButton.hidden = isZelle;
  checkoutMessage.textContent = isZelle
    ? 'Use the QR code in your Zelle-enabled bank app. Payments are verified manually.'
    : '';
}

document.querySelectorAll('.method').forEach(method => method.addEventListener('click', () => {
  selectPaymentMethod(method.dataset.payment);
}));

function resetShippingQuotes() {
  selectedShippingQuote = null;
  shippingZipInput.value = '';
  shippingOptions.replaceChildren();
  shippingStatus.textContent = 'Enter a U.S. ZIP code to compare live USPS and UPS delivery options.';
  checkoutButton.disabled = true;
  checkoutButton.innerHTML = 'Choose delivery first <span>→</span>';
}

function showShippingOptions(rates) {
  shippingOptions.replaceChildren(...rates.map((rate, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'shipping-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'shipping-option';
    radio.checked = index === 0;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = rate.title;
    const delivery = document.createElement('small');
    delivery.textContent = rate.estimatedDays ? `Estimated delivery: about ${rate.estimatedDays} day${rate.estimatedDays === 1 ? '' : 's'}` : 'Live carrier rate';
    copy.append(title, delivery);
    const amount = document.createElement('span');
    amount.className = 'shipping-amount';
    amount.textContent = formatPrice(rate.amount);
    option.append(radio, copy, amount);
    option.addEventListener('click', () => {
      selectedShippingQuote = rate.quote;
      shippingOptions.querySelectorAll('.shipping-option').forEach(entry => entry.classList.remove('selected'));
      shippingOptions.querySelectorAll('input').forEach(entry => { entry.checked = false; });
      option.classList.add('selected');
      radio.checked = true;
      checkoutButton.disabled = false;
      checkoutButton.innerHTML = 'Secure checkout <span>→</span>';
      shippingStatus.textContent = `${rate.title} selected. Your live delivery charge will be added at secure checkout.`;
    });
    if (index === 0) option.click();
    return option;
  }));
}

async function requestShippingRates() {
  const checkoutApi = window.SAKHI_MOHINI_CHECKOUT_API;
  const productName = opener?.dataset.productName;
  const destinationZip = shippingZipInput.value.trim();
  if (!/^\d{5}(?:-\d{4})?$/.test(destinationZip)) {
    shippingStatus.textContent = 'Enter a valid 5-digit U.S. ZIP code.';
    return;
  }
  if (!checkoutApi || !productName) {
    shippingStatus.textContent = 'Live delivery options are being connected. Please try again shortly.';
    return;
  }
  selectedShippingQuote = null;
  shippingOptions.replaceChildren();
  checkoutButton.disabled = true;
  checkoutButton.innerHTML = 'Choose delivery first <span>→</span>';
  shippingRatesButton.disabled = true;
  shippingRatesButton.textContent = 'Checking…';
  shippingStatus.textContent = 'Finding current USPS and UPS rates…';
  try {
    const response = await fetch(checkoutApi.replace(/\/create-checkout$/, '/shipping-rates'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, quantity: 1, destinationZip })
    });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.rates)) throw new Error(result.error || 'Live delivery options could not be loaded.');
    showShippingOptions(result.rates);
  } catch (error) {
    shippingStatus.textContent = error.message || 'Live delivery options could not be loaded. Please try again.';
  } finally {
    shippingRatesButton.disabled = false;
    shippingRatesButton.textContent = 'Show options';
  }
}

shippingRatesButton.addEventListener('click', requestShippingRates);
shippingZipInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); requestShippingRates(); } });
shippingZipInput.addEventListener('input', () => {
  if (!selectedShippingQuote) return;
  selectedShippingQuote = null;
  shippingOptions.replaceChildren();
  checkoutButton.disabled = true;
  checkoutButton.innerHTML = 'Choose delivery first <span>→</span>';
  shippingStatus.textContent = 'ZIP changed. Show delivery options again.';
});

async function beginStripeCheckout() {
  const checkoutApi = window.SAKHI_MOHINI_CHECKOUT_API;
  const productName = arguments[0] || opener?.dataset.productName;

  if (!checkoutApi || !productName) {
    checkoutMessage.textContent = 'Secure checkout is being connected. Please try again shortly.';
    return;
  }
  if (!selectedShippingQuote) {
    checkoutMessage.textContent = 'Choose a live delivery option before secure checkout.';
    return;
  }

  checkoutButton.disabled = true;
  checkoutButton.innerHTML = 'Opening secure checkout <span>…</span>';
  checkoutMessage.textContent = '';
  try {
    const response = await fetch(checkoutApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, quantity: 1, shippingQuote: selectedShippingQuote })
    });
    const result = await response.json();
    if (!response.ok || !result.url) throw new Error(result.error || 'Checkout could not be started.');
    window.location.assign(result.url);
  } catch (error) {
    checkoutMessage.textContent = error.message || 'Checkout could not be started. Please try again.';
    checkoutButton.disabled = false;
    checkoutButton.innerHTML = 'Secure checkout <span>→</span>';
  }
}

document.querySelector('.checkout-button').addEventListener('click', () => {
  const selected = document.querySelector('.method.selected')?.dataset.payment;
  if (selected === 'stripe') {
    beginStripeCheckout();
    return;
  }
  checkoutMessage.textContent = selected === 'zelle'
    ? 'Use the QR code in your Zelle-enabled bank app. Payments are verified manually.'
    : 'Secure Stripe checkout is unavailable. Please try again shortly.';
});

addToBagButton.addEventListener('click', () => {
  if (!opener) return;
  const name = opener.dataset.productName;
  const price = Number(opener.querySelector('p').textContent.replace(/[^0-9.]/g, ''));
  const image = opener.querySelector('img');
  const existing = bag.find(item => item.name === name);
  if (existing) existing.quantity += 1;
  else bag.push({ name, price, image: image.src, alt: image.alt, quantity: 1 });
  saveBag();
  closeProduct();
  openBag();
});

bagButton?.addEventListener('click', openBag);
bagClose?.addEventListener('click', closeBag);
bagBackdrop?.addEventListener('click', closeBag);

document.querySelector('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const email = event.currentTarget.querySelector('input').value.trim();
  if (!email) return;
  localStorage.setItem('sakhi-mohini-newsletter-email', email);
  button.innerHTML = 'Code unlocked <span>✓</span>';
  document.querySelector('.newsletter-message').textContent = 'Welcome! Use code SAKHI10 at secure Stripe checkout for 10% off your first order.';
});

document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const message = form.elements.message.value.trim();
  const subject = encodeURIComponent(`Website question from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  document.querySelector('.contact-message').textContent = 'Your email app is opening with your message ready to send.';
  window.location.href = `mailto:riteshmegha2013@gmail.com?subject=${subject}&body=${body}`;
});

loadCatalog();
renderBag();


// Full-address live-rate override: Shippo requires a complete U.S. delivery address.
(() => {
  const originalButton = document.querySelector('#get-shipping-rates');
  if (!originalButton) return;
  const liveRatesButton = originalButton.cloneNode(true);
  originalButton.replaceWith(liveRatesButton);

  const getLiveRates = async () => {
    const checkoutApi = window.SAKHI_MOHINI_CHECKOUT_API;
    const productName = opener?.dataset.productName;
    const street1 = document.querySelector('#shipping-street')?.value.trim() || '';
    const city = document.querySelector('#shipping-city')?.value.trim() || '';
    const state = document.querySelector('#shipping-state')?.value.trim().toUpperCase() || '';
    const zip = document.querySelector('#shipping-zip')?.value.trim() || '';
    if (!street1 || !city || !/^[A-Z]{2}$/.test(state) || !/^\d{5}(?:-\d{4})?$/.test(zip)) {
      shippingStatus.textContent = 'Enter your street address, city, two-letter state, and valid U.S. ZIP code.';
      return;
    }
    if (!checkoutApi || !productName) {
      shippingStatus.textContent = 'Delivery options are temporarily unavailable.';
      return;
    }
    liveRatesButton.disabled = true;
    liveRatesButton.textContent = 'Finding options…';
    shippingStatus.textContent = 'Checking live USPS and UPS delivery options…';
    shippingOptions.replaceChildren();
    selectedShippingQuote = null;
    try {
      const response = await fetch(checkoutApi.replace(/\/create-checkout$/, '/shipping-rates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, quantity: 1, destination: { street1, city, state, zip } })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Live carrier rates are temporarily unavailable.');
      showShippingOptions(data.rates || []);
    } catch (error) {
      shippingStatus.textContent = error.message || 'Live carrier rates are temporarily unavailable.';
    } finally {
      liveRatesButton.disabled = false;
      liveRatesButton.textContent = 'Show options';
    }
  };
  liveRatesButton.addEventListener('click', getLiveRates);
})();
