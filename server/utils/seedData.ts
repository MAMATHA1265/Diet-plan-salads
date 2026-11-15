import bcrypt from 'bcryptjs';
import { isSupabaseConnected, setSupabaseConnected } from '../config/supabase.ts';
import { dbRepo } from './store.ts';

export async function ensureSeeded() {
  try {
    await runSeed();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isSupabaseConnected()) {
      console.warn(
        `[Seed] Supabase write blocked (${message}). Ensure RLS policies in schema.sql are applied in Supabase SQL Editor. Falling back to local store.`
      );
      setSupabaseConnected(false);
      await runSeed();
      return;
    }
    throw err;
  }
}

async function runSeed() {
  const existingPlans = await dbRepo.count('plans');
  const existingSalads = await dbRepo.count('salads');
  const existingUsers = await dbRepo.count('users');

  if (existingPlans > 0 && existingSalads > 0 && existingUsers > 0) {
    return;
  }

  console.log('[Seed] Initializing sample plans, salads, ingredients, and accounts...');

  // 1. Membership Plans
  let basicPlan = await dbRepo.findOne('plans', { slug: 'basic' });
  if (!basicPlan) {
    basicPlan = await dbRepo.create('plans', {
      name: 'Basic',
      slug: 'basic',
      tagline: 'Weekday clean eating routine for steady nutrition.',
      saladsPerDay: 1,
      daysPerMonth: 20,
      monthlyPrice: 2499,
      discountPercent: 10,
      freeDelivery: false,
      features: [
        '1 signature or custom salad bowl per day',
        '20 active delivery days per month',
        '10% member discount on all extra orders',
        'Pause or reschedule up to 5 days anytime',
      ],
      isActive: true,
    });
  }

  let standardPlan = await dbRepo.findOne('plans', { slug: 'standard' });
  if (!standardPlan) {
    standardPlan = await dbRepo.create('plans', {
      name: 'Standard',
      slug: 'standard',
      tagline: 'Full-month daily lunch or dinner bowl with deeper savings.',
      saladsPerDay: 1,
      daysPerMonth: 26,
      monthlyPrice: 3199,
      discountPercent: 15,
      freeDelivery: false,
      features: [
        '1 signature or custom salad bowl per day',
        '26 active delivery days per month',
        '15% member discount on all extra orders',
        'Priority morning or lunch delivery slots',
      ],
      isActive: true,
    });
  }

  let premiumPlan = await dbRepo.findOne('plans', { slug: 'premium' });
  if (!premiumPlan) {
    premiumPlan = await dbRepo.create('plans', {
      name: 'Premium',
      slug: 'premium',
      tagline: 'Complete lunch + dinner nutrition with zero delivery fees.',
      saladsPerDay: 2,
      daysPerMonth: 26,
      monthlyPrice: 5499,
      discountPercent: 25,
      freeDelivery: true,
      features: [
        '2 signature or custom salad bowls per day',
        '26 active delivery days per month',
        '25% member discount on every order',
        'Free express delivery on all orders & subscriptions',
      ],
      isActive: true,
    });
  }

  // 2. Signature Salads
  if (existingSalads === 0) {
    const sampleSalads = [
      {
        name: 'Mediterranean Quinoa Crunch',
        description:
          'Tri-color organic quinoa, Hass avocado, Persian cucumber, Kalamata olives, heirloom cherry tomatoes, and fresh lemon-parsley vinaigrette.',
        price: 289,
        calories: 410,
        protein: 16,
        carbs: 44,
        fats: 19,
        fiber: 11,
        dietaryType: 'vegan',
        tags: ['Vegan', 'High Fiber', 'Gluten-Free'],
        ingredientsList: ['Tri-Color Quinoa', 'Avocado', 'Cucumber', 'Cherry Tomatoes', 'Kalamata Olives', 'Lemon Vinaigrette'],
        imageUrl: '/src/assets/images/salad_quinoa_power_1794738480377.jpg',
        isAvailable: true,
        featured: true,
      },
      {
        name: 'Charred Chicken & Baby Kale',
        description:
          'Herb-grilled chicken breast, massaged baby kale, soft-boiled farm egg, shaved radish, toasted slivered almonds, and Greek yogurt dill dressing.',
        price: 349,
        calories: 490,
        protein: 38,
        carbs: 18,
        fats: 26,
        fiber: 7,
        dietaryType: 'high-protein',
        tags: ['High Protein', 'Low Carb', 'Keto Friendly'],
        ingredientsList: ['Grilled Chicken', 'Baby Kale', 'Farm Egg', 'Radish', 'Toasted Almonds', 'Yogurt Dill Dressing'],
        imageUrl: '/src/assets/images/salad_grilled_protein_1794738481019.jpg',
        isAvailable: true,
        featured: true,
      },
      {
        name: 'Crispy Sesame Tofu & Edamame',
        description:
          'Golden sesame-crusted non-GMO tofu, steamed edamame, baby spinach, shredded red cabbage, avocado, and cold-pressed green herb emulsion.',
        price: 309,
        calories: 430,
        protein: 24,
        carbs: 28,
        fats: 23,
        fiber: 9,
        dietaryType: 'vegan',
        tags: ['Vegan', 'Plant Protein', 'Dairy-Free'],
        ingredientsList: ['Sesame Tofu', 'Edamame', 'Baby Spinach', 'Red Cabbage', 'Avocado', 'Herb Olive Dressing'],
        imageUrl: '/src/assets/images/salad_vegan_tofu_1794738481127.jpg',
        isAvailable: true,
        featured: true,
      },
      {
        name: 'Spiced Herb Paneer & Chickpea',
        description:
          'Pan-seared herb paneer cubes, roasted cumin chickpeas, crisp spinach, cucumber ribbons, toasted walnuts, and aged balsamic reduction.',
        price: 319,
        calories: 470,
        protein: 26,
        carbs: 31,
        fats: 25,
        fiber: 8,
        dietaryType: 'veg',
        tags: ['Vegetarian', 'High Protein'],
        ingredientsList: ['Herb Paneer', 'Roasted Chickpeas', 'Baby Spinach', 'Cucumber', 'Walnuts', 'Balsamic Glaze'],
        imageUrl: '/src/assets/images/salad_paneer_spinach_1794738480788.jpg',
        isAvailable: true,
        featured: false,
      },
      {
        name: 'Blood Orange, Beet & Walnut',
        description:
          'Crisp romaine hearts, slow-roasted baby beets, segmented blood orange, toasted pecans, sunflower seeds, and bright herb olive oil.',
        price: 299,
        calories: 360,
        protein: 11,
        carbs: 34,
        fats: 20,
        fiber: 9,
        dietaryType: 'vegan',
        tags: ['Vegan', 'Antioxidant', 'Light'],
        ingredientsList: ['Romaine Lettuce', 'Roasted Beets', 'Blood Orange', 'Walnuts', 'Sunflower Seeds', 'Olive Oil'],
        imageUrl: '/src/assets/images/salad_mediterranean_olive_1794738481305.jpg',
        isAvailable: true,
        featured: false,
      },
      {
        name: 'Garden Avocado & Sprouted Chickpea',
        description:
          'Crisp butter romaine, microgreens, spiced chickpeas, tri-color quinoa, pumpkin seeds, cherry tomatoes, and cold-pressed herb dressing.',
        price: 279,
        calories: 395,
        protein: 15,
        carbs: 39,
        fats: 18,
        fiber: 12,
        dietaryType: 'vegan',
        tags: ['Vegan', 'Gut Health', 'High Fiber'],
        ingredientsList: ['Romaine', 'Avocado', 'Spiced Chickpeas', 'Quinoa', 'Pumpkin Seeds', 'Herb Olive Oil'],
        imageUrl: '/src/assets/images/hero_salad_editorial_1794738480041.jpg',
        isAvailable: true,
        featured: false,
      },
    ];

    for (const salad of sampleSalads) {
      await dbRepo.create('salads', salad);
    }
  }

  // 3. Custom Salad Builder Ingredients
  const existingIngredients = await dbRepo.count('ingredients');
  if (existingIngredients === 0) {
    const ingredients = [
      // Bases
      { name: 'Crisp Romaine Lettuce', category: 'base', price: 80, calories: 35, protein: 2, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Baby Spinach', category: 'base', price: 90, calories: 40, protein: 4, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Massaged Tuscan Kale', category: 'base', price: 95, calories: 50, protein: 4, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Tri-Color Quinoa', category: 'base', price: 110, calories: 165, protein: 6, dietaryTag: 'vegan', isAvailable: true },

      // Proteins
      { name: 'Grilled Herb Paneer', category: 'protein', price: 85, calories: 180, protein: 14, dietaryTag: 'veg', isAvailable: true },
      { name: 'Crispy Sesame Tofu', category: 'protein', price: 80, calories: 145, protein: 15, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Charred Chicken Breast', category: 'protein', price: 105, calories: 165, protein: 28, dietaryTag: 'non-veg', isAvailable: true },
      { name: 'Roasted Spiced Chickpeas', category: 'protein', price: 65, calories: 130, protein: 8, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Soft-Boiled Farm Egg', category: 'protein', price: 55, calories: 110, protein: 10, dietaryTag: 'non-veg', isAvailable: true },

      // Toppings
      { name: 'Persian Cucumber', category: 'topping', price: 25, calories: 15, protein: 1, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Heirloom Cherry Tomato', category: 'topping', price: 30, calories: 20, protein: 1, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Kalamata Olives', category: 'topping', price: 45, calories: 55, protein: 0, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Toasted Walnuts & Almonds', category: 'topping', price: 55, calories: 95, protein: 4, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Pumpkin & Chia Seeds', category: 'topping', price: 45, calories: 80, protein: 4, dietaryTag: 'vegan', isAvailable: true },

      // Dressings
      { name: 'Cold-Pressed Olive Oil & Herbs', category: 'dressing', price: 30, calories: 90, protein: 0, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Fresh Lemon Mustard', category: 'dressing', price: 25, calories: 45, protein: 0, dietaryTag: 'vegan', isAvailable: true },
      { name: 'Greek Yogurt Dill', category: 'dressing', price: 35, calories: 60, protein: 3, dietaryTag: 'veg', isAvailable: true },
      { name: 'Aged Balsamic Vinaigrette', category: 'dressing', price: 35, calories: 55, protein: 0, dietaryTag: 'vegan', isAvailable: true },
    ];

    for (const ing of ingredients) {
      await dbRepo.create('ingredients', ing);
    }
  }

  // 4. Users (Admin + Demo Members)
  if (existingUsers === 0) {
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const memberHash = await bcrypt.hash('Member@123', 10);

    await dbRepo.create('users', {
      name: 'Meera Nair',
      email: 'admin@verdantbowl.com',
      passwordHash: adminHash,
      phone: '+91 98765 00001',
      address: 'Verdant Central Kitchen, Indiranagar, Bengaluru 560038',
      role: 'admin',
      planId: null,
      isActive: true,
    });

    const member1 = await dbRepo.create('users', {
      name: 'Ananya Sharma',
      email: 'ananya@verdantbowl.com',
      passwordHash: memberHash,
      phone: '+91 98765 43210',
      address: '402 Palm Grove Residency, Koramangala 4th Block, Bengaluru 560034',
      role: 'member',
      planId: standardPlan._id,
      isActive: true,
    });

    await dbRepo.create('users', {
      name: 'Rohan Kulkarni',
      email: 'rohan@verdantbowl.com',
      passwordHash: memberHash,
      phone: '+91 98201 11223',
      address: '18 Cedar Lane, Bandra West, Mumbai 400050',
      role: 'member',
      planId: basicPlan._id,
      isActive: true,
    });

    // 5. Seed Active Subscription & Sample Orders for Ananya
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 26);

    const sub = await dbRepo.create('subscriptions', {
      userId: member1._id,
      planId: standardPlan._id,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pausedAt: null,
      deliveryAddress: member1.address,
      timeSlot: '12:00 PM - 1:00 PM',
      razorpayPaymentId: 'pay_seed_std_001',
      razorpayOrderId: 'order_seed_std_001',
      autoRenew: true,
    });

    await dbRepo.create('payments', {
      userId: member1._id,
      amount: standardPlan.monthlyPrice,
      currency: 'INR',
      purpose: 'subscription',
      referenceId: sub._id,
      razorpayOrderId: 'order_seed_std_001',
      razorpayPaymentId: 'pay_seed_std_001',
      razorpaySignature: 'verified_seed_signature',
      status: 'captured',
    });

    const sampleOrders = [
      {
        orderNumber: 'VB-1041',
        userId: member1._id,
        items: [
          {
            name: 'Mediterranean Quinoa Crunch',
            quantity: 1,
            unitPrice: 289,
            calories: 410,
            isCustom: false,
          },
        ],
        subtotal: 289,
        discountPercent: 15,
        discountAmount: 43,
        deliveryFee: 20,
        totalAmount: 266,
        deliveryAddress: member1.address,
        timeSlot: '12:00 PM - 1:00 PM',
        status: 'Delivered',
        orderType: 'one-time',
        subscriptionId: null,
        scheduledDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentStatus: 'paid',
        paymentId: 'pay_seed_ord_1041',
      },
      {
        orderNumber: 'VB-1042',
        userId: member1._id,
        items: [
          {
            name: 'Daily Subscription Bowl · Standard',
            quantity: 1,
            unitPrice: 0,
            calories: 430,
            isCustom: false,
          },
        ],
        subtotal: 0,
        discountPercent: 15,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount: 0,
        deliveryAddress: member1.address,
        timeSlot: '12:00 PM - 1:00 PM',
        status: 'Preparing',
        orderType: 'subscription',
        subscriptionId: sub._id,
        scheduledDate: new Date().toISOString(),
        paymentStatus: 'paid',
        paymentId: 'pay_seed_std_001',
      },
      {
        orderNumber: 'VB-1043',
        userId: member1._id,
        items: [
          {
            name: 'Spiced Herb Paneer & Chickpea',
            quantity: 1,
            unitPrice: 319,
            calories: 470,
            isCustom: false,
          },
        ],
        subtotal: 319,
        discountPercent: 15,
        discountAmount: 48,
        deliveryFee: 20,
        totalAmount: 291,
        deliveryAddress: member1.address,
        timeSlot: '7:00 PM - 8:00 PM',
        status: 'Pending',
        orderType: 'one-time',
        subscriptionId: null,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        paymentStatus: 'paid',
        paymentId: 'pay_seed_ord_1043',
      },
    ];

    for (const order of sampleOrders) {
      await dbRepo.create('orders', order);
    }
  }
}
