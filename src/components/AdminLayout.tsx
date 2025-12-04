import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut,
  Video,
  TrendingUp
} from 'lucide-react';
import { signOut } from '../services/authService';
import clsx from 'clsx';
import MobileNav from './MobileNav';

const AdminLayout = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Gerenciar Usuários', path: '/admin/users', icon: Users },
    { name: 'Gerenciar Exames', path: '/admin/exams', icon: FileText },
    { name: 'Gerenciar Aulas', path: '/admin/videos', icon: Video },
    { name: 'Testes A/B', path: '/admin/ab-tests', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <MobileNav navItems={navItems} isAdmin />
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white border-r border-gray-800 p-4 fixed h-full">
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
          <h1 className="text-xl font-bold text-white">Painel Admin</h1>
        </div>
        
        <div className="px-4 mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu Principal</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-sm",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-400 hover:bg-red-900/20 hover:text-red-400 w-full text-sm transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 w-full bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
