import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Shop, Product } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Package,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductsProps {
  profile: UserProfile;
  shop: Shop | null;
}

export default function Products({ profile, shop }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    selling_price: '',
    purchase_price: '',
    quantity: '',
    unit: 'шт',
    min_stock_threshold: '5',
    barcode: ''
  });

  useEffect(() => {
    if (!shop) return;

    const q = query(collection(db, 'products'), where('shop_id', '==', shop.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setLoading(true);

    const productData = {
      shop_id: shop.id,
      name: formData.name,
      category: formData.category,
      selling_price: Number(formData.selling_price),
      purchase_price: Number(formData.purchase_price) || 0,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      min_stock_threshold: Number(formData.min_stock_threshold),
      barcode: formData.barcode,
      updated_at: serverTimestamp(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          created_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        selling_price: '',
        purchase_price: '',
        quantity: '',
        unit: 'шт',
        min_stock_threshold: '5',
        barcode: ''
      });
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      selling_price: product.selling_price.toString(),
      purchase_price: product.purchase_price?.toString() || '',
      quantity: product.quantity.toString(),
      unit: product.unit,
      min_stock_threshold: product.min_stock_threshold.toString(),
      barcode: product.barcode || ''
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Товары</h2>
          <p className="text-gray-500">Управляйте ассортиментом вашего магазина.</p>
        </div>
        {profile.role === 'owner' && (
          <button 
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                category: '',
                selling_price: '',
                purchase_price: '',
                quantity: '',
                unit: 'шт',
                min_stock_threshold: '5',
                barcode: ''
              });
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            <Plus className="w-5 h-5" /> Добавить товар
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск по названию или категории..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:w-48 bg-gray-50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Товар</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Категория</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Цена</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Остаток</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Товары не найдены</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold">
                          {product.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.barcode || 'Без штрихкода'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{product.selling_price.toLocaleString()} сум</p>
                      <p className="text-xs text-gray-400">Закуп: {product.purchase_price?.toLocaleString()} сум</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{product.quantity} {product.unit}</p>
                      <p className="text-xs text-gray-400">Мин: {product.min_stock_threshold}</p>
                    </td>
                    <td className="px-6 py-4">
                      {product.quantity === 0 ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                          <AlertCircle className="w-3 h-3" /> Нет в наличии
                        </span>
                      ) : product.quantity <= product.min_stock_threshold ? (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                          <AlertCircle className="w-3 h-3" /> Мало
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          В наличии
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {profile.role === 'owner' && (
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Название товара</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Напр: Молоко 1л"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Категория</label>
                  <input 
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Напр: Молочные продукты"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Цена продажи (сум)</label>
                  <input 
                    required
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Цена закупки (сум)</label>
                  <input 
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Количество</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-24 bg-gray-50 border-none rounded-xl px-2 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="шт">шт</option>
                      <option value="кг">кг</option>
                      <option value="л">л</option>
                      <option value="упак">упак</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Мин. порог для уведомления</label>
                  <input 
                    required
                    type="number"
                    value={formData.min_stock_threshold}
                    onChange={(e) => setFormData({...formData, min_stock_threshold: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Штрихкод (необязательно)</label>
                  <input 
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Отсканируйте или введите вручную"
                  />
                </div>
              </div>

              <div className="pt-6 border-t flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {editingProduct ? 'Сохранить изменения' : 'Добавить товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
