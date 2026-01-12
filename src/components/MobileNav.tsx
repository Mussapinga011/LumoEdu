import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ArrowLeftCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface MobileNavProps {
  navItems: NavItem[];
  isAdmin?: boolean;
}

const MobileNav = ({ navItems, isAdmin = false }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className={clsx(
        "fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-50 border-b",
        isAdmin ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200"
      )}>
        <div className="font-bold text-xl">
          {isAdmin ? (
            'Painel Admin'
          ) : (
            <Link to="/learning">
              <img src="/lumo_text.png" alt="LumoEdu" className="h-7 w-auto object-contain" />
            </Link>
          )}
        </div>
        <button 
          onClick={toggleMenu}
          className={clsx("p-2 rounded-lg", isAdmin ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className={clsx(
          "fixed inset-0 z-40 pt-16",
          isAdmin ? "bg-gray-900 text-white" : "bg-white"
        )}>
          <nav className="flex flex-col p-4 space-y-2 h-full overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (isAdmin && item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center gap-4 px-4 py-4 rounded-xl font-bold transition-colors text-lg",
                    isAdmin 
                      ? (isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800")
                      : (isActive ? "bg-blue-50 text-secondary border-2 border-secondary/20" : "text-gray-500 hover:bg-gray-100")
                  )}
                >
                  <item.icon size={24} />
                  {item.name}
                </Link>
              );
            })}
            
            {isAdmin && (
              <Link
                to="/learning"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 px-4 py-4 rounded-xl font-bold text-gray-400 hover:bg-gray-800 text-lg transition-colors border-t border-gray-800 mt-2"
              >
                <ArrowLeftCircle size={24} />
                Ver Site Público
              </Link>
            )}
            
            <div className="mt-auto pt-4 border-t border-gray-200 pb-8">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-4 px-4 py-4 rounded-xl font-bold w-full text-lg",
                  isAdmin ? "text-gray-400 hover:bg-red-900/20 hover:text-red-400" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <LogOut size={24} />
                Sair
              </button>
            </div>
          </nav>
        </div>
      )}
      
      {/* Spacer to prevent content from being hidden behind header */}
      <div className="h-16" />
    </div>
  );
};

export default MobileNav;
