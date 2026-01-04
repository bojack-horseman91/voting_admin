import React from 'react';
import { UserRole, UserSession } from '../types';
import { LogOut, LayoutDashboard, Database, MapPin, User, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  session: UserSession;
  onLogout: () => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, session, onLogout, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 text-white">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-green-400" />
            ElectionMgr
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{session.role.replace('_', ' ')}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-700 rounded-lg text-white">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
            </div>
            {/* Additional Nav Items could go here */}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold">
              {session.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session.username}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-300 hover:text-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggleSidebar} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-800 text-white transform transition-transform duration-300 z-30 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-4 flex justify-between items-center border-b border-slate-700">
            <h1 className="text-lg font-bold">ElectionMgr</h1>
            <button onClick={toggleSidebar}><X className="w-6 h-6" /></button>
         </div>
         <nav className="p-4">
             <div className="flex items-center gap-3 px-4 py-3 bg-slate-700 rounded-lg text-white">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
            </div>
            <button onClick={onLogout} className="mt-8 flex items-center gap-2 text-red-300">
                <LogOut className="w-5 h-5" /> Sign Out
            </button>
         </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden text-gray-600">
                <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
             {session.role === UserRole.UPAZILLA_ADMIN && (
                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Upazilla Admin Mode</span>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
