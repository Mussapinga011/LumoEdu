import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  BookOpen, 
  Trophy, 
  User, 
  LogOut, 
  Download,
  Zap,
  Video,
  Target
} from 'lucide-react';
import { signOut } from '../services/authService';
import clsx from 'clsx';
import MobileNav from './MobileNav';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Aprender', path: '/disciplines', icon: BookOpen },
    { name: 'Aulas', path: '/lessons', icon: Video },
    { name: 'Desafio', path: '/challenge', icon: Zap },
    { name: 'Simulados', path: '/simulation/config', icon: Target },
    { name: 'Ranking', path: '/ranking', icon: Trophy },
    { name: 'Downloads', path: '/downloads', icon: Download },
    { name: 'Perfil', path: '/profile', icon: User },
  ];



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <MobileNav navItems={navItems} />
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-4 fixed h-full">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-primary">AdmissionPrep</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors uppercase tracking-wide text-sm",
                  isActive 
                    ? "bg-blue-50 text-secondary border-2 border-secondary/20" 
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <item.icon size={24} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 w-full uppercase tracking-wide text-sm"
          >
            <LogOut size={24} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
