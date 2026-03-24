import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Store
} from 'lucide-react';
import { UserProfile, Shop } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  profile: UserProfile;
  shop: Shop | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function Layout({ children, profile, shop, currentPage, setCurrentPage }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'sales', label: 'Продажи', icon: ShoppingCart },
    { id: 'inventory', label: 'Инвентарь', icon: History },
    { id: 'reports', label: 'Отчеты', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-green-600" />
          <span className="font-bold text-lg text-gray-900">SavdoPlus</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-white border-r w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:flex items-center gap-3 border-b">
            <div className="bg-green-100 p-2 rounded-lg">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">SavdoPlus</h1>
              <p className="text-xs text-gray-500">{shop?.name || 'Магазин'}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  currentPage === item.id 
                    ? "bg-green-50 text-green-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", currentPage === item.id ? "text-green-600" : "text-gray-400")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
                {profile.full_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile.role === 'owner' ? 'Владелец' : 'Продавец'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
