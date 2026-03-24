import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { UserRole } from '../types';

interface AuthProps {
  user: User | null;
  onComplete: () => void;
}

export default function Auth({ user, onComplete }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('owner');
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [shopName, setShopName] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let shopId = '';
      if (role === 'owner') {
        const shopRef = doc(db, 'shops', crypto.randomUUID());
        shopId = shopRef.id;
        await setDoc(shopRef, {
          name: shopName,
          owner_id: user.uid,
          created_at: new Date()
        });
      }

      await setDoc(doc(db, 'users', user.uid), {
        full_name: fullName,
        email: user.email,
        role: role,
        shop_id: shopId,
        created_at: new Date()
      });

      onComplete();
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Добро пожаловать</h2>
          <p className="text-gray-600 mb-10 leading-relaxed">
            Войдите через Google, чтобы получить доступ к вашей системе SavdoPlus.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-100 text-gray-900 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />}
            Продолжить с Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Настройка профиля</h2>
        <p className="text-gray-600 mb-8">Заполните данные, чтобы начать работу.</p>

        <form onSubmit={handleCompleteProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ваше имя</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ваша роль</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-3 rounded-xl border-2 font-bold transition-all ${role === 'owner' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500'}`}
              >
                Владелец
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`py-3 rounded-xl border-2 font-bold transition-all ${role === 'seller' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500'}`}
              >
                Продавец
              </button>
            </div>
          </div>

          {role === 'owner' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Название магазина</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Например: Магазин 'Удача'"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" />}
            Завершить регистрацию
          </button>
        </form>
      </div>
    </div>
  );
}
