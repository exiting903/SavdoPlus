import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Shop, Product, Sale } from '../types';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Filter
} from 'lucide-react';
import { format, startOfDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

interface ReportsProps {
  profile: UserProfile;
  shop: Shop | null;
  setCurrentPage: (page: string) => void;
}

export default function Reports({ profile, shop, setCurrentPage }: ReportsProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('7d');

  useEffect(() => {
    if (!shop) return;

    const productsQuery = query(collection(db, 'products'), where('shop_id', '==', shop.id));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
    });

    let startDate = subDays(new Date(), 7);
    if (period === '30d') startDate = subDays(new Date(), 30);
    if (period === 'month') startDate = startOfMonth(new Date());

    const salesQuery = query(
      collection(db, 'sales'), 
      where('shop_id', '==', shop.id),
      where('created_at', '>=', startDate),
      orderBy('created_at', 'desc')
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale)));
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, [shop, period]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.reversed ? 0 : sale.total_amount), 0);
  const totalSalesCount = sales.filter(s => !s.reversed).length;
  
  // Top selling products
  const productSalesMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
  sales.filter(s => !s.reversed).forEach(sale => {
    if (!productSalesMap[sale.product_id]) {
      productSalesMap[sale.product_id] = { name: sale.product_name_snapshot, quantity: 0, revenue: 0 };
    }
    productSalesMap[sale.product_id].quantity += sale.quantity;
    productSalesMap[sale.product_id].revenue += sale.total_amount;
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Daily sales chart data
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 31;
  const chartData = eachDayOfInterval({
    start: subDays(new Date(), days - 1),
    end: new Date()
  }).map(date => {
    const daySales = sales.filter(s => 
      !s.reversed && 
      format(s.created_at?.toDate() || new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      name: format(date, 'dd MMM', { locale: ru }),
      revenue: daySales.reduce((sum, s) => sum + s.total_amount, 0),
      count: daySales.length
    };
  });

  const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#dc2626'];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Отчеты</h2>
          <p className="text-gray-500">Анализируйте продажи и эффективность вашего магазина.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-1 flex shadow-sm">
            <button 
              onClick={() => setPeriod('7d')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", period === '7d' ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50")}
            >
              7 дней
            </button>
            <button 
              onClick={() => setPeriod('30d')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", period === '30d' ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50")}
            >
              30 дней
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", period === 'month' ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50")}
            >
              Месяц
            </button>
          </div>
          <button className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-gray-600">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Общая выручка</p>
          <h4 className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString()} сум</h4>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight className="w-3 h-3" /> +15% к прошлому периоду
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Количество продаж</p>
          <h4 className="text-3xl font-bold text-gray-900">{totalSalesCount}</h4>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
            <ArrowUpRight className="w-3 h-3" /> +8% к прошлому периоду
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Средний чек</p>
          <h4 className="text-3xl font-bold text-gray-900">
            {totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount).toLocaleString() : 0} сум
          </h4>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
            <ArrowDownRight className="w-3 h-3" /> -2% к прошлому периоду
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-8">Динамика выручки</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-8">Топ-5 товаров по продажам</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1f2937', fontSize: 12, fontWeight: 600 }} width={100} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantity" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Top Products List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">Популярные товары</h3>
          <button 
            onClick={() => setCurrentPage('products')}
            className="text-green-600 text-sm font-bold hover:underline"
          >
            Весь список
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Товар</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Продано</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Выручка</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Доля</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProducts.map((product, index) => (
                <tr key={product.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {index + 1}
                      </div>
                      <p className="font-bold text-gray-900">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center font-medium text-gray-600">
                    {product.quantity} шт
                  </td>
                  <td className="px-8 py-4 text-right font-bold text-gray-900">
                    {product.revenue.toLocaleString()} сум
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 rounded-full" 
                          style={{ width: `${Math.round((product.revenue / totalRevenue) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {Math.round((product.revenue / totalRevenue) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
