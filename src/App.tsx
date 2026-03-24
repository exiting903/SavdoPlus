import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserProfile, Shop } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Landing from './components/Landing';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile;
          setProfile({ ...profileData, uid: firebaseUser.uid });
          
          if (profileData.shop_id) {
            const shopRef = doc(db, 'shops', profileData.shop_id);
            const shopSnap = await getDoc(shopRef);
            if (shopSnap.exists()) {
              setShop({ ...shopSnap.data(), id: profileData.shop_id } as Shop);
            }
          }
        } else {
          // New user - default to landing/auth
          setProfile(null);
        }
      } else {
        setProfile(null);
        setShop(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'auth') {
      return <Auth user={user} onComplete={() => window.location.reload()} />;
    }
    return <Landing onAuth={() => setCurrentPage('auth')} />;
  }

  if (!profile) {
    return <Auth user={user} onComplete={() => window.location.reload()} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard profile={profile} shop={shop} setCurrentPage={setCurrentPage} />;
      case 'products': return <Products profile={profile} shop={shop} />;
      case 'sales': return <Sales profile={profile} shop={shop} />;
      case 'inventory': return <Inventory profile={profile} shop={shop} />;
      case 'reports': return <Reports profile={profile} shop={shop} setCurrentPage={setCurrentPage} />;
      case 'settings': return <Settings profile={profile} shop={shop} />;
      default: return <Dashboard profile={profile} shop={shop} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      profile={profile} 
      shop={shop} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
}
