import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Shop, Product, Sale } from '../types';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  History,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  shop: Shop | null;
  setCurrentPage: (page: string) => void;
}

import { seedData } from '../seed';

export default function Dashboard({ profile, shop, setCurrentPage }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!shop) return;
    setSeeding(true);
    try {
      await seedData(shop.id, profile.uid);
    } catch (error) {
      console.error('Seed error:', error);
    } finally {
      setSeeding(false);
    }
  };

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
      limit(10)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      setRecentSales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale)));
    });

    // Today's sales
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySalesQuery = query(
      collection(db, 'sales'),
      where('shop_id', '==', shop.id),
      where('created_at', '>=', startOfDay)
    );
    const unsubscribeTodaySales = onSnapshot(todaySalesQuery, (snapshot) => {
      setTodaySales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale)));
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeTodaySales();
    };
  }, [shop]);

  const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.reversed ? 0 : sale.total_amount), 0);
  const lowStockItems = products.filter(p => p.quantity <= p.min_stock_threshold && p.quantity > 0);
  const outOfStockItems = products.filter(p => p.quantity === 0);

  const chartData = [
    { name: 'Пн', sales: 4000 },
    { name: 'Вт', sales: 3000 },
    { name: 'Ср', sales: 2000 },
    { name: 'Чт', sales: 2780 },
    { name: 'Пт', sales: 1890 },
    { name: 'Сб', sales: 2390 },
    { name: 'Вс', sales: 3490 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Добро пожаловать, {profile.full_name}!</h2>
          <p className="text-gray-500">Вот что происходит в вашем магазине сегодня.</p>
        </div>
        <div className="flex items-center gap-3">
          {products.length === 0 && !loading && (
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
            >
              {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Загрузить демо-данные
            </button>
          )}
          <button 
            onClick={() => setCurrentPage('sales')}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all"
          >
            <Plus className="w-5 h-5" /> Новая продажа
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Выручка сегодня" 
          value={`${totalRevenue.toLocaleString()} сум`} 
          icon={TrendingUp} 
          trend="+12%" 
          trendUp={true}
          color="green"
        />
        <StatCard 
          title="Продажи сегодня" 
          value={todaySales.length.toString()} 
          icon={ShoppingCart} 
          trend="+5%" 
          trendUp={true}
          color="blue"
        />
        <StatCard 
          title="Всего товаров" 
          value={products.length.toString()} 
          icon={Package} 
          trend="0%" 
          trendUp={true}
          color="purple"
        />
        <StatCard 
          title="Мало остатков" 
          value={lowStockItems.length.toString()} 
          icon={AlertTriangle} 
          trend={outOfStockItems.length > 0 ? `${outOfStockItems.length} нет в наличии` : "Все в норме"} 
          trendUp={false}
          color={lowStockItems.length > 0 ? "amber" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-gray-900">Продажи за неделю</h3>
            <select className="bg-gray-50 border-none rounded-lg text-sm font-medium px-3 py-1 outline-none">
              <option>Эта неделя</option>
              <option>Прошлая неделя</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-900">Последние продажи</h3>
            <button 
              onClick={() => setCurrentPage('sales')}
              className="text-green-600 text-sm font-bold hover:underline"
            >
              Все
            </button>
          </div>
          <div className="space-y-6">
            {recentSales.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Нет недавних продаж</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{sale.product_name_snapshot}</p>
                      <p className="text-xs text-gray-500">{format(sale.created_at?.toDate() || new Date(), 'HH:mm', { locale: ru })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">+{sale.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{sale.quantity} шт</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="font-bold text-lg text-amber-900">Нужно пополнить запасы</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-amber-600 font-medium">Осталось: {product.quantity} {product.unit}</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('inventory')}
                  className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                >
                  Пополнить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  const colors: any = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trendUp ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
  );
}
