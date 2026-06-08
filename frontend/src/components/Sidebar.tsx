import Link from 'next/link';
import { Home, Briefcase, List, Users, MessageSquare, Settings, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Niches', href: '/niches', icon: Briefcase },
    { label: 'Sources', href: '/sources', icon: List },
    { label: 'CRM Pipeline', href: '/leads', icon: Users },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      <div className="p-4 md:p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-500" />
          ClientFinder OS
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Icon className="w-5 h-5 text-slate-400" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        &copy; 2026 ClientFinder OS
      </div>
    </aside>
  );
}
