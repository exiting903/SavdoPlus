import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { UserProfile, Shop } from '../types';
import { 
  User, 
  Store, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Smartphone,
  Scan
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  profile: UserProfile;
  shop: Shop | null;
}

export default function Settings({ profile, shop }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [shopName, setShopName] = useState(shop?.name || '');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        full_name: fullName
      });
      if (shop && profile.role === 'owner') {
        await updateDoc(doc(db, 'shops', shop.id), {
          name: shopName
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Настройки</h2>
        <p className="text-gray-500">Управляйте своим профилем и параметрами магазина.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          <SettingsNavButton icon={User} label="Профиль" active={true} />
          <SettingsNavButton icon={Store} label="Магазин" active={false} />
          <SettingsNavButton icon={Bell} label="Уведомления" active={false} />
          <SettingsNavButton icon={Shield} label="Безопасность" active={false} />
          <SettingsNavButton icon={Globe} label="Язык" active={false} />
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Личные данные</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Полное имя</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              {profile.role === 'owner' && shop && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Название магазина</label>
                  <input 
                    type="text" 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                  {success && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Сохранено
                    </motion.div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin w-4 h-4" />}
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Скоро в SavdoPlus</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ComingSoonCard icon={Scan} title="Сканер штрихкодов" description="Используйте камеру телефона для быстрого поиска товаров." />
              <ComingSoonCard icon={Smartphone} title="Мобильное приложение" description="Управляйте магазином прямо с вашего смартфона." />
              <ComingSoonCard icon={Globe} title="Мультиязычность" description="Поддержка узбекского и русского языков." />
              <ComingSoonCard icon={CreditCard} title="Учет долгов" description="Ведите список должников прямо в приложении." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ icon: Icon, label, active }: any) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
      active ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-green-600" : "text-gray-400")} />
        {label}
      </div>
      <ChevronRight className={cn("w-4 h-4", active ? "text-green-600" : "text-gray-300")} />
    </button>
  );
}

function ComingSoonCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-bold text-gray-700">{title}</h4>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
