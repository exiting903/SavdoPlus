import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Shop, Product, InventoryAdjustment } from '../types';
import { 
  History, 
  Plus, 
  Minus, 
  Search, 
  Loader2, 
  AlertCircle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface InventoryProps {
  profile: UserProfile;
  shop: Shop | null;
}

export default function Inventory({ profile, shop }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'restock' | 'correction' | 'damaged' | 'manual'>('restock');
  const [quantityChange, setQuantityChange] = useState(0);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!shop) return;

    const productsQuery = query(collection(db, 'products'), where('shop_id', '==', shop.id));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
    });

    const adjustmentsQuery = query(
      collection(db, 'inventory_adjustments'), 
      where('shop_id', '==', shop.id),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    const unsubscribeAdjustments = onSnapshot(adjustmentsQuery, (snapshot) => {
      setAdjustments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryAdjustment)));
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeAdjustments();
    };
  }, [shop]);

  const handleAdjustment = async () => {
    if (!selectedProduct || !shop || isProcessing || quantityChange === 0) return;
    if (profile.role !== 'owner') {
      alert('Только владелец может изменять остатки!');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create adjustment record
      await addDoc(collection(db, 'inventory_adjustments'), {
        shop_id: shop.id,
        product_id: selectedProduct.id,
        type: adjustmentType,
        quantity_change: quantityChange,
        note: note,
        adjusted_by: profile.uid,
        created_at: serverTimestamp()
      });

      // 2. Update product quantity
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        quantity: selectedProduct.quantity + quantityChange,
        updated_at: serverTimestamp()
      });

      setSelectedProduct(null);
      setQuantityChange(0);
      setNote('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode?.includes(searchQuery)
  ).slice(0, 5);

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'restock': return 'Пополнение';
      case 'correction': return 'Коррекция';
      case 'damaged': return 'Брак/Порча';
      case 'manual': return 'Ручное списание';
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Инвентарь</h2>
        <p className="text-gray-500">Управляйте остатками и просматривайте историю изменений.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adjustment Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-xl">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Изменение остатков</h3>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск товара..." 
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
                    <p className="text-sm text-green-700 font-medium">Текущий остаток: {selectedProduct.quantity} {selectedProduct.unit}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-green-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-green-600" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wider">Тип операции</label>
                    <select 
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value as any)}
                      className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    >
                      <option value="restock">Пополнение (+)</option>
                      <option value="correction">Коррекция (+/-)</option>
                      <option value="damaged">Брак/Порча (-)</option>
                      <option value="manual">Ручное списание (-)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wider">Количество</label>
                    <input 
                      type="number"
                      value={quantityChange}
                      onChange={(e) => setQuantityChange(Number(e.target.value))}
                      className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                      placeholder="Напр: 10 или -5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-green-700 uppercase tracking-wider">Примечание (необязательно)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium resize-none h-24"
                    placeholder="Причина изменения..."
                  />
                </div>

                <div className="pt-4 border-t border-green-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Новый остаток</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.quantity + quantityChange} {selectedProduct.unit}</p>
                  </div>
                  <button 
                    onClick={handleAdjustment}
                    disabled={isProcessing || quantityChange === 0}
                    className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adjustment History */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-xl">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">История изменений</h3>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
              </div>
            ) : adjustments.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Изменений пока нет</p>
              </div>
            ) : (
              adjustments.map(adj => {
                const product = products.find(p => p.id === adj.product_id);
                return (
                  <div key={adj.id} className="p-4 rounded-2xl border border-gray-50 bg-white hover:border-purple-100 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{product?.name || 'Удаленный товар'}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          adj.quantity_change > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {getAdjustmentTypeLabel(adj.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        {format(adj.created_at?.toDate() || new Date(), 'dd MMM, HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 italic">
                        {adj.note || 'Без примечания'}
                      </p>
                      <div className="flex items-center gap-2">
                        {adj.quantity_change > 0 ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                        <p className={cn("font-bold", adj.quantity_change > 0 ? "text-green-600" : "text-red-600")}>
                          {adj.quantity_change > 0 ? '+' : ''}{adj.quantity_change} {product?.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return <XIcon className={className} />;
}

import { X as XIcon } from 'lucide-react';
