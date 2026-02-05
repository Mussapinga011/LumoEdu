import { Link, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut,
  MessageCircle,
  Download,
  School,
  BookMarked,
  ArrowLeftCircle,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Settings,
  BookOpen,
  Target
} from 'lucide-react';
import clsx from 'clsx';
import MobileNav from './MobileNav';
import { useAuth } from '../hooks/useAuth';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: string | number;
}

const AdminLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['content', 'academic', 'users']);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const navSections: NavSection[] = [
    {
      title: 'Visão Geral',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Estrutura Acadêmica',
      items: [
        { name: 'Universidades', path: '/admin/universities', icon: School },
        { name: 'Cursos', path: '/admin/courses', icon: GraduationCap },
        { name: 'Disciplinas', path: '/admin/disciplines', icon: BookMarked }
      ]
    },
    {
      title: 'Conteúdo Pedagógico',
      items: [
        { name: 'Modo Aprender', path: '/admin/learning', icon: Target },
        { name: 'Exames', path: '/admin/exams', icon: FileText }
      ]
    },
    {
      title: 'Comunidade',
      items: [
        { name: 'Usuários', path: '/admin/users', icon: Users },
        { name: 'Grupos', path: '/admin/groups', icon: MessageCircle }
      ]
    },
    {
      title: 'Recursos',
      items: [
        { name: 'Downloads', path: '/admin/downloads', icon: Download }
      ]
    }
  ];

  // Flatten all items for mobile nav
  const allNavItems = navSections.flatMap(section => section.items);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <MobileNav navItems={allNavItems} isAdmin />
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white border-r border-gray-800 fixed h-full overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Settings className="text-white" size={20} />
            </div>
            <div>
              <img src="/lumo_text.png" alt="LumoEdu" className="h-6 w-auto object-contain mb-1" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-4 space-y-1">
          {navSections.map((section) => {
            const isExpanded = expandedSections.includes(section.title.toLowerCase().replace(/\s+/g, '-'));
            const hasActiveItem = section.items.some(item => 
              location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path))
            );

            return (
              <div key={section.title} className="mb-2">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, '-'))}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all group",
                    hasActiveItem 
                      ? "text-blue-400 bg-blue-500/10" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                  )}
                >
                  <span>{section.title}</span>
                  {isExpanded ? (
                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  ) : (
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="mt-1 space-y-0.5 ml-2 animate-in slide-in-from-top-2 duration-200">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path || 
                        (item.path !== '/admin' && location.pathname.startsWith(item.path));
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={clsx(
                            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm group relative overflow-hidden",
                            isActive 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30" 
                              : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                          )}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                          )}
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className={clsx(
                              "p-2 rounded-lg transition-all",
                              isActive 
                                ? "bg-white/20" 
                                : "bg-gray-800/50 group-hover:bg-gray-700/50"
                            )}>
                              <item.icon size={18} />
                            </div>
                            <span className="truncate">{item.name}</span>
                          </div>
                          
                          {item.badge && (
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-black",
                              isActive 
                                ? "bg-white/20 text-white" 
                                : "bg-blue-500/20 text-blue-400"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-800/50 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 px-3 mb-3">Acesso Rápido</div>
          
          <Link
            to="/learning"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800/50 hover:text-white text-sm transition-all group"
          >
            <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-all">
              <BookOpen size={18} />
            </div>
            <span>Ver Plataforma</span>
            <ArrowLeftCircle size={16} className="ml-auto opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-red-900/20 hover:text-red-400 text-sm transition-all group"
          >
            <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-red-900/20 transition-all">
              <LogOut size={18} />
            </div>
            <span>Sair do Painel</span>
          </button>
        </div>

        {/* Footer Badge */}
        <div className="p-4 border-t border-gray-800/50 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-300">Sistema Online</div>
              <div className="text-[10px] text-gray-500 font-medium">Todos os serviços operacionais</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 pb-24 md:pb-8 w-full bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
