import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Shop, Product, Sale } from '../types';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Loader2, 
  History,
  Undo2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface SalesProps {
  profile: UserProfile;
  shop: Shop | null;
}

export default function Sales({ profile, shop }: SalesProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!shop) return;

    const productsQuery = query(collection(db, 'products'), where('shop_id', '==', shop.id));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
    });

    const salesQuery = query(
      collection(db, 'sales'), 
      where('shop_id', '==', shop.id),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale)));
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, [shop]);

  const handleSale = async () => {
    if (!selectedProduct || !shop || isProcessing) return;
    if (quantity > selectedProduct.quantity) {
      alert('Недостаточно товара на складе!');
      return;
    }

    setIsProcessing(true);
    try {
      const totalAmount = selectedProduct.selling_price * quantity;
      
      // 1. Create sale record
      await addDoc(collection(db, 'sales'), {
        shop_id: shop.id,
        product_id: selectedProduct.id,
        product_name_snapshot: selectedProduct.name,
        quantity: quantity,
        unit_price_snapshot: selectedProduct.selling_price,
        total_amount: totalAmount,
        sold_by: profile.uid,
        created_at: serverTimestamp(),
        reversed: false
      });

      // 2. Update product quantity
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        quantity: selectedProduct.quantity - quantity,
        updated_at: serverTimestamp()
      });

      setSelectedProduct(null);
      setQuantity(1);
      setSearchQuery('');
    } catch (error) {
      console.error('Error recording sale:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReverseSale = async (sale: Sale) => {
    if (!shop || profile.role !== 'owner') return;
    if (confirm('Вы уверены, что хотите отменить эту продажу? Товар вернется на склад.')) {
      try {
        // 1. Mark sale as reversed
        await updateDoc(doc(db, 'sales', sale.id), {
          reversed: true
        });

        // 2. Restore stock
        const productRef = doc(db, 'products', sale.product_id);
        const productSnap = await (await import('firebase/firestore')).getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data() as Product;
          await updateDoc(productRef, {
            quantity: productData.quantity + sale.quantity,
            updated_at: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error reversing sale:', error);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode?.includes(searchQuery)
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Продажи</h2>
        <p className="text-gray-500">Оформляйте продажи и просматривайте историю.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Sale Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Новая продажа</h3>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск товара по названию или штрихкоду..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all text-lg"
              />
              
              {searchQuery && filteredProducts.length > 0 && !selectedProduct && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 overflow-hidden divide-y divide-gray-50">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category} • {product.quantity} {product.unit} в наличии</p>
                      </div>
                      <p className="font-bold text-gray-900">{product.selling_price.toLocaleString()} сум</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-sm text-green-700 font-medium">{selectedProduct.selling_price.toLocaleString()} сум за {selectedProduct.unit}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-green-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-green-600" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-2xl bg-white border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all shadow-sm"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{quantity}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedProduct.unit}</p>
                  </div>
                  <button 
                    onClick={() => setQuantity(Math.min(selectedProduct.quantity, quantity + 1))}
                    className="w-12 h-12 rounded-2xl bg-white border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all shadow-sm"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="pt-4 border-t border-green-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Итого к оплате</p>
                    <p className="text-2xl font-bold text-gray-900">{(selectedProduct.selling_price * quantity).toLocaleString()} сум</p>
                  </div>
                  <button 
                    onClick={handleSale}
                    disabled={isProcessing}
                    className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                    Оформить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sales History */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">История продаж</h3>
            </div>
            <button className="text-blue-600 text-sm font-bold hover:underline">Сегодня</button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : sales.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Продаж пока нет</p>
              </div>
            ) : (
              sales.map(sale => (
                <div key={sale.id} className={cn(
                  "p-4 rounded-2xl border transition-all group",
                  sale.reversed ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-50 hover:border-blue-100 hover:shadow-sm"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-bold text-gray-900", sale.reversed && "line-through")}>
                        {sale.product_name_snapshot}
                      </p>
                      {sale.reversed && (
                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Отменено</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {format(sale.created_at?.toDate() || new Date(), 'HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {sale.quantity} шт × {sale.unit_price_snapshot.toLocaleString()} сум
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">{sale.total_amount.toLocaleString()} сум</p>
                      {profile.role === 'owner' && !sale.reversed && (
                        <button 
                          onClick={() => handleReverseSale(sale)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Отменить продажу"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
