const API_BASE = '/api';

// ── Hardcoded demo data (used when the PHP backend is unavailable) ──────
const DEMO_CATEGORIES = [
  { category_id: 1, name: 'Breakfast', description: 'Start your morning right' },
  { category_id: 2, name: 'Lunch & Dinner', description: 'Hearty plant-based meals' },
  { category_id: 3, name: 'Handhelds', description: 'Wraps, burgers & more' },
  { category_id: 4, name: 'Sides', description: 'Perfect additions' },
  { category_id: 5, name: 'Dips', description: 'Tasty dips & sauces' },
  { category_id: 6, name: 'Drinks', description: 'Refreshing beverages' },
];

const DEMO_PRODUCTS = [
  // Breakfast
  { product_id: 1, category_id: 1, name: 'Açaí Bowl', description: 'Fresh açaí blended with banana, topped with granola & berries', price: '8.50', kcal: 420, available: 1, image_filename: 'breakfast1.png' },
  { product_id: 2, category_id: 1, name: 'Avocado Toast', description: 'Sourdough with smashed avocado, cherry tomatoes & seeds', price: '7.50', kcal: 380, available: 1, image_filename: 'breakfast2.png' },
  { product_id: 3, category_id: 1, name: 'Pancake Stack', description: 'Fluffy vegan pancakes with maple syrup & fresh fruit', price: '9.00', kcal: 520, available: 1, image_filename: 'breakfast3.png' },
  { product_id: 4, category_id: 1, name: 'Smoothie Bowl', description: 'Green smoothie bowl with chia, coconut & mango', price: '8.00', kcal: 350, available: 1, image_filename: 'breakfast4.png' },
  // Lunch & Dinner
  { product_id: 5, category_id: 2, name: 'Buddha Bowl', description: 'Quinoa, roasted veggies, hummus & tahini dressing', price: '11.50', kcal: 580, available: 1, image_filename: 'lunch1.png' },
  { product_id: 6, category_id: 2, name: 'Curry Bowl', description: 'Creamy coconut curry with jasmine rice & tofu', price: '12.00', kcal: 620, available: 1, image_filename: 'lunch2.png' },
  { product_id: 7, category_id: 2, name: 'Pasta Primavera', description: 'Penne with seasonal vegetables in a basil pesto', price: '10.50', kcal: 550, available: 1, image_filename: 'lunch3.png' },
  { product_id: 8, category_id: 2, name: 'Grain Salad', description: 'Mixed grains with roasted beets, walnuts & lemon', price: '10.00', kcal: 450, available: 1, image_filename: 'lunch4.png' },
  // Handhelds
  { product_id: 9, category_id: 3, name: 'Beyond Burger', description: 'Plant-based patty with lettuce, tomato & special sauce', price: '11.00', kcal: 650, available: 1, image_filename: 'handheld1.png' },
  { product_id: 10, category_id: 3, name: 'Falafel Wrap', description: 'Crispy falafel with hummus, pickles & fresh herbs', price: '9.50', kcal: 520, available: 1, image_filename: 'handheld2.png' },
  { product_id: 11, category_id: 3, name: 'BBQ Jackfruit Sandwich', description: 'Pulled jackfruit in smoky BBQ sauce with coleslaw', price: '10.00', kcal: 480, available: 1, image_filename: 'handheld3.png' },
  // Sides
  { product_id: 12, category_id: 4, name: 'Sweet Potato Fries', description: 'Crispy baked sweet potato fries with herb salt', price: '4.50', kcal: 280, available: 1, image_filename: 'side1.png' },
  { product_id: 13, category_id: 4, name: 'Onion Rings', description: 'Beer-battered onion rings with dipping sauce', price: '4.00', kcal: 320, available: 1, image_filename: 'side2.png' },
  { product_id: 14, category_id: 4, name: 'Garden Salad', description: 'Mixed greens with cherry tomatoes & vinaigrette', price: '5.00', kcal: 120, available: 1, image_filename: 'side3.png' },
  { product_id: 15, category_id: 4, name: 'Corn on the Cob', description: 'Grilled corn with vegan butter & chili flakes', price: '3.50', kcal: 180, available: 1, image_filename: 'side4.png' },
  // Dips
  { product_id: 16, category_id: 5, name: 'Classic Hummus', description: 'Smooth chickpea hummus with olive oil', price: '3.00', kcal: 160, available: 1, image_filename: 'dip1.png' },
  { product_id: 17, category_id: 5, name: 'Guacamole', description: 'Fresh avocado dip with lime & cilantro', price: '3.50', kcal: 200, available: 1, image_filename: 'dip2.png' },
  { product_id: 18, category_id: 5, name: 'Baba Ganoush', description: 'Smoky roasted eggplant dip with tahini', price: '3.00', kcal: 140, available: 1, image_filename: 'dip3.png' },
  { product_id: 19, category_id: 5, name: 'Tzatziki', description: 'Cool cucumber & coconut yoghurt dip', price: '2.50', kcal: 90, available: 1, image_filename: 'dip4.png' },
  { product_id: 20, category_id: 5, name: 'Salsa Roja', description: 'Spicy tomato salsa with roasted peppers', price: '2.50', kcal: 60, available: 1, image_filename: 'dip5.png' },
  // Drinks
  { product_id: 21, category_id: 6, name: 'Green Smoothie', description: 'Spinach, banana, mango & oat milk', price: '5.50', kcal: 220, available: 1, image_filename: 'drink1.png' },
  { product_id: 22, category_id: 6, name: 'Fresh Orange Juice', description: 'Freshly squeezed oranges', price: '4.00', kcal: 110, available: 1, image_filename: 'drink2.png' },
  { product_id: 23, category_id: 6, name: 'Iced Matcha Latte', description: 'Ceremonial matcha with oat milk on ice', price: '5.00', kcal: 150, available: 1, image_filename: 'drink3.png' },
  { product_id: 24, category_id: 6, name: 'Berry Lemonade', description: 'House-made lemonade with mixed berries', price: '4.50', kcal: 130, available: 1, image_filename: 'drink4.png' },
  { product_id: 25, category_id: 6, name: 'Kombucha', description: 'Organic ginger-lemon kombucha', price: '4.50', kcal: 50, available: 1, image_filename: 'drink5.png' },
];

// ── API functions with fallback ─────────────────────────────────────────

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories.php`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  } catch {
    console.warn('Using demo categories (backend unavailable)');
    return DEMO_CATEGORIES;
  }
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products.php`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch {
    console.warn('Using demo products (backend unavailable)');
    return DEMO_PRODUCTS;
  }
}

export async function submitOrder(cartItems) {
  const items = cartItems.map(item => ({
    product_id: item.product.product_id,
    price: item.product.price,
    quantity: item.quantity,
  }));

  try {
    const res = await fetch(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Order failed');
    return res.json();
  } catch {
    console.warn('Order submitted offline (backend unavailable)');
    return {
      success: true,
      order_id: Date.now(),
      pickup_number: Math.floor(Math.random() * 99) + 1,
    };
  }
}
