import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Product } from './types';

export async function seedData(shopId: string, userId: string) {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('shop_id', '==', shopId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) return; // Already seeded

  const demoProducts = [
    { name: 'Хлеб буханка', category: 'Выпечка', selling_price: 3000, purchase_price: 2500, quantity: 50, unit: 'шт', min_stock_threshold: 10 },
    { name: 'Молоко Musaffo 1л', category: 'Молочные продукты', selling_price: 12000, purchase_price: 10500, quantity: 24, unit: 'шт', min_stock_threshold: 5 },
    { name: 'Coca-Cola 1.5л', category: 'Напитки', selling_price: 11000, purchase_price: 9500, quantity: 36, unit: 'шт', min_stock_threshold: 12 },
    { name: 'Вода Nestle 1.5л', category: 'Напитки', selling_price: 4000, purchase_price: 3200, quantity: 48, unit: 'шт', min_stock_threshold: 12 },
    { name: 'Рис Лазер 1кг', category: 'Бакалея', selling_price: 25000, purchase_price: 22000, quantity: 100, unit: 'кг', min_stock_threshold: 20 },
    { name: 'Сахар 1кг', category: 'Бакалея', selling_price: 14000, purchase_price: 12500, quantity: 80, unit: 'кг', min_stock_threshold: 15 },
    { name: 'Чай Ahmad Tea 100г', category: 'Чай/Кофе', selling_price: 18000, purchase_price: 15500, quantity: 15, unit: 'шт', min_stock_threshold: 5 },
    { name: 'Печенье Oreo', category: 'Сладости', selling_price: 8000, purchase_price: 6500, quantity: 3, unit: 'шт', min_stock_threshold: 5 },
    { name: 'Масло подсолнечное 1л', category: 'Бакалея', selling_price: 18000, purchase_price: 16000, quantity: 20, unit: 'шт', min_stock_threshold: 5 },
    { name: 'Яйца 10шт', category: 'Молочные продукты', selling_price: 15000, purchase_price: 13000, quantity: 30, unit: 'упак', min_stock_threshold: 5 },
    { name: 'Сникерс 50г', category: 'Сладости', selling_price: 7000, purchase_price: 5500, quantity: 0, unit: 'шт', min_stock_threshold: 10 },
    { name: 'Сок Bliss 1л', category: 'Напитки', selling_price: 14000, purchase_price: 12000, quantity: 12, unit: 'шт', min_stock_threshold: 5 },
  ];

  for (const p of demoProducts) {
    await addDoc(productsRef, {
      ...p,
      shop_id: shopId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      barcode: Math.floor(Math.random() * 1000000000000).toString()
    });
  }

  // Add some sample sales
  const salesRef = collection(db, 'sales');
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const randomProduct = demoProducts[Math.floor(Math.random() * demoProducts.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    await addDoc(salesRef, {
      shop_id: shopId,
      product_id: 'demo-id-' + i,
      product_name_snapshot: randomProduct.name,
      quantity: qty,
      unit_price_snapshot: randomProduct.selling_price,
      total_amount: randomProduct.selling_price * qty,
      sold_by: userId,
      created_at: serverTimestamp(),
      reversed: false
    });
  }
}
