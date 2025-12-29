
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Package, 
  FileText, 
  Menu,
  TrendingUp,
  CreditCard,
  ClipboardList,
  Contact2,
  Settings as SettingsIcon,
  X,
  Loader2
} from 'lucide-react';
import { getSettings } from './storage';
import { AppSettings } from './types';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import Reports from './components/Reports';
import ClientsRegistry from './components/registries/ClientsRegistry';
import CollaboratorsRegistry from './components/registries/CollaboratorsRegistry';
import InventoryRegistry from './components/registries/InventoryRegistry';
import ServicesRegistry from './components/registries/ServicesRegistry';
import PaymentsRegistry from './components/registries/PaymentsRegistry';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string, colorClass: string, onClick?: () => void }> = ({ to, icon, label, colorClass, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
        isActive 
        ? `bg-gray-900 text-white shadow-xl shadow-gray-200` 
        : `text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm`
      }`}
    >
      <span className={isActive ? 'text-white' : colorClass}>{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const loadSettings = async () => {
    const current = await getSettings();
    setAppSettings(current);
  };

  useEffect(() => {
    loadSettings();
    // Listener simplificado para atualizações
    const interval = setInterval(loadSettings, 5000);
    return () => clearInterval(interval);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  if (!appSettings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Conectando ao Supabase...</p>
      </div>
    );
  }

  const getContainerStyle = () => {
    switch (appSettings.displayMode) {
      case 'tablet':
        return { maxWidth: '768px', margin: '20px auto', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', height: 'calc(100vh - 40px)', border: '8px solid #1f2937' };
      case 'mobile':
        return { maxWidth: '425px', margin: '20px auto', borderRadius: '50px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', height: 'calc(100vh - 40px)', border: '12px solid #1f2937' };
      default:
        return { width: '100%', height: '100vh' };
    }
  };

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] transition-all duration-500 overflow-hidden">
          <div 
            style={getContainerStyle()} 
            className="flex bg-[#F8FAFC] w-full relative overflow-hidden transition-all duration-500"
          >
            {isSidebarOpen && (
              <div 
                className="absolute inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
                onClick={closeSidebar} 
              />
            )}

            <aside className={`
              absolute lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="h-full flex flex-col p-6">
                <div className="flex flex-col mb-8 px-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 flex items-center justify-center rounded-2xl ${appSettings.appLogo ? 'w-auto max-w-[180px]' : 'w-12 bg-indigo-600 text-white shadow-indigo-200 shadow-xl'}`}>
                        {appSettings.appLogo ? (
                          <img src={appSettings.appLogo} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <TrendingUp size={24} />
                        )}
                      </div>
                    </div>
                    <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                      <X size={20} />
                    </button>
                  </div>
                  {!appSettings.appLogo && (
                    <div className="min-w-0">
                      <h1 className="text-xl font-black text-gray-900 leading-none truncate">{appSettings.appName}</h1>
                      <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Enterprise Cloud</span>
                    </div>
                  )}
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                  <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" colorClass="text-blue-500" onClick={closeSidebar} />
                  <SidebarLink to="/projects" icon={<Briefcase size={20} />} label="Projetos" colorClass="text-indigo-500" onClick={closeSidebar} />
                  <SidebarLink to="/services" icon={<ClipboardList size={20} />} label="Serviços" colorClass="text-purple-500" onClick={closeSidebar} />
                  <SidebarLink to="/payments" icon={<CreditCard size={20} />} label="Financeiro" colorClass="text-emerald-500" onClick={closeSidebar} />
                  <SidebarLink to="/clients" icon={<Contact2 size={20} />} label="Clientes" colorClass="text-pink-500" onClick={closeSidebar} />
                  <SidebarLink to="/collaborators" icon={<Users size={20} />} label="Equipe" colorClass="text-amber-500" onClick={closeSidebar} />
                  <SidebarLink to="/inventory" icon={<Package size={20} />} label="Inventário" colorClass="text-cyan-500" onClick={closeSidebar} />
                  <SidebarLink to="/reports" icon={<FileText size={20} />} label="Relatórios" colorClass="text-rose-500" onClick={closeSidebar} />
                  <SidebarLink to="/settings" icon={<SettingsIcon size={20} />} label="Configuração" colorClass="text-gray-500" onClick={closeSidebar} />
                </nav>
              </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl lg:hidden">
                    <Menu size={22} />
                  </button>
                  <h2 className="hidden lg:block text-sm font-bold text-gray-400 uppercase tracking-widest">{appSettings.companyName}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-gray-900 leading-tight">{appSettings.adminName}</span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{appSettings.adminRole}</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                    <img src={`https://ui-avatars.com/api/?name=${appSettings.adminName}&background=4F46E5&color=fff&bold=true`} alt="Avatar" />
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/clients" element={<ClientsRegistry />} />
                    <Route path="/collaborators" element={<CollaboratorsRegistry />} />
                    <Route path="/inventory" element={<InventoryRegistry />} />
                    <Route path="/services" element={<ServicesRegistry />} />
                    <Route path="/payments" element={<PaymentsRegistry />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
