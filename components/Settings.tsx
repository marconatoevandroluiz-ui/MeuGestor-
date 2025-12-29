
import React, { useState, useEffect } from 'react';
import { 
  Save, Download, Upload, Trash2, 
  ShieldCheck, Database, Layout, 
  UserCircle, Briefcase, Monitor, 
  Tablet, Smartphone, Check, Image as ImageIcon, 
  X, RefreshCw, Loader2
} from 'lucide-react';
import { getStorageData, saveSettings, exportSystemImage, importSystemImage, resetSystem } from '../storage';
import { AppSettings, DisplayMode, AppData } from '../types';

const Settings: React.FC = () => {
  // Fix: getStorageData returns a Promise
  const [data, setData] = useState<AppData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const load = async () => {
    const d = await getStorageData();
    setData(d);
    setSettings(d.settings);
  };

  useEffect(() => { load() }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const content = readerEvent.target?.result as string;
        // Fix: importSystemImage is async
        if (await importSystemImage(content)) {
          alert("Sistema restaurado com sucesso! A página será reiniciada.");
          window.location.reload();
        } else {
          alert("Falha ao importar: Arquivo inválido.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settings) {
      if (file.size > 3 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        const updated = { ...settings, appLogo: base64 };
        setSettings(updated);
        await saveSettings(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = async () => {
    if (!settings) return;
    const updated = { ...settings, appLogo: undefined };
    setSettings(updated);
    await saveSettings(updated);
  };

  const setDisplayMode = async (mode: DisplayMode) => {
    if (!settings) return;
    const updated = { ...settings, displayMode: mode };
    setSettings(updated);
    await saveSettings(updated);
  };

  if (!settings) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Configurações do Sistema</h2>
        <p className="text-gray-500 font-medium">Personalize a identidade do seu aplicativo e gerencie backups.</p>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/20">
          <div className="p-3 bg-cyan-100 text-cyan-600 rounded-2xl">
            <ImageIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Logotipo Corporativo</h3>
            <p className="text-sm text-gray-400 font-medium">Configure a marca oficial (Ex: LBS Instalações).</p>
          </div>
        </div>
        <div className="p-8">
           <div className="flex flex-col md:flex-row items-center gap-10">
             <div className="relative group">
               <div className="w-64 h-32 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-cyan-300">
                 {settings.appLogo ? (
                   <img src={settings.appLogo} alt="Preview Logo" className="w-full h-full object-contain p-4" />
                 ) : (
                   <div className="text-center space-y-2">
                     <ImageIcon size={32} className="mx-auto text-gray-300" />
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sem Logo</p>
                   </div>
                 )}
               </div>
               {settings.appLogo && (
                 <button 
                  onClick={removeLogo}
                  className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                 >
                   <X size={16} />
                 </button>
               )}
             </div>

             <div className="flex-1 space-y-5">
               <div>
                 <p className="font-black text-gray-900 uppercase tracking-widest text-[10px] mb-2">Upload de Arquivo (JPG/PNG/SVG)</p>
                 <p className="text-xs text-gray-500 leading-relaxed font-medium">
                   Para melhores resultados como o logo da <strong>LBS</strong>, utilize uma imagem em alta resolução. 
                 </p>
               </div>
               <div className="flex flex-wrap gap-4">
                 <label className="flex items-center gap-3 px-8 py-4 bg-cyan-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all cursor-pointer">
                   <Upload size={18} /> Carregar Nova Logo
                   <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/svg+xml" onChange={handleLogoUpload} />
                 </label>
                 {settings.appLogo && (
                   <button 
                    onClick={removeLogo}
                    className="flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-600 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                   >
                     <RefreshCw size={18} /> Restaurar Padrão
                   </button>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/20">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Monitor size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Modo de Exibição</h3>
            <p className="text-sm text-gray-400 font-medium">Ajuste o tamanho da interface para simular diferentes dispositivos.</p>
          </div>
        </div>
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { id: 'pc', label: 'Computador (PC)', icon: <Monitor size={20} />, desc: 'Largura total padrão' },
               { id: 'tablet', label: 'Tablet (iPad)', icon: <Tablet size={20} />, desc: '768px centralizado' },
               { id: 'mobile', label: 'Celular (Smartphone)', icon: <Smartphone size={20} />, desc: '425px em formato de celular' },
             ].map((mode) => (
               <button
                 key={mode.id}
                 onClick={() => setDisplayMode(mode.id as DisplayMode)}
                 className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 text-center group ${
                   settings.displayMode === mode.id 
                   ? 'border-indigo-600 bg-indigo-50/30' 
                   : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                 }`}
               >
                 <div className={`p-4 rounded-2xl ${settings.displayMode === mode.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                   {mode.icon}
                 </div>
                 <div>
                   <p className={`font-black text-sm uppercase tracking-widest ${settings.displayMode === mode.id ? 'text-indigo-900' : 'text-gray-500'}`}>
                     {mode.label}
                   </p>
                   <p className="text-xs text-gray-400 font-medium mt-1">{mode.desc}</p>
                 </div>
                 {settings.displayMode === mode.id && (
                    <div className="mt-2 text-indigo-600"><Check size={20} /></div>
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex items-center gap-4 bg-gray-50/20">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Layout size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Identidade visual e de Gestão</h3>
            <p className="text-sm text-gray-400 font-medium">Estes dados aparecem no menu lateral e nos relatórios.</p>
          </div>
        </div>
        
        <form onSubmit={handleUpdateSettings} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome do Aplicativo</label>
              <div className="relative">
                <input 
                  className="w-full px-6 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={settings.appName}
                  onChange={e => setSettings({...settings, appName: e.target.value})}
                  placeholder="Ex: FlowMaster Pro"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome da Empresa / Projeto Principal</label>
              <input 
                className="w-full px-6 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
                placeholder="Ex: Construtora Aliança"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <UserCircle size={14} /> Nome do Administrador
              </label>
              <input 
                className="w-full px-6 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={settings.adminName}
                onChange={e => setSettings({...settings, adminName: e.target.value})}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Briefcase size={14} /> Cargo / Função
              </label>
              <input 
                className="w-full px-6 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={settings.adminRole}
                onChange={e => setSettings({...settings, adminRole: e.target.value})}
                placeholder="Ex: Engenheiro Residente"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {isSaved && (
              <span className="text-emerald-500 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-left-2">
                ✓ Alterações salvas com sucesso!
              </span>
            )}
            <button 
              type="submit" 
              className="ml-auto px-10 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-black transition-all uppercase tracking-widest text-[11px] flex items-center gap-2"
            >
              <Save size={18} /> Salvar Configurações
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Download size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-4">Criar Imagem do Sistema</h3>
          <p className="text-gray-500 text-sm mb-8 px-4">
            Gera um arquivo completo com todos os seus projetos, clientes, colaboradores e histórico financeiro.
          </p>
          <button 
            onClick={exportSystemImage}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-[10px]"
          >
            <Save size={18} /> Baixar Backup (.json)
          </button>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-xl hover:shadow-emerald-50/50 transition-all">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-4">Restaurar Imagem</h3>
          <p className="text-gray-500 text-sm mb-8 px-4">
            Recupere o sistema a partir de um backup anterior. Isso substituirá todos os dados atuais.
          </p>
          <label className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-[10px] cursor-pointer">
            <Database size={18} /> Selecionar Arquivo
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 p-10 rounded-[40px] flex flex-col md:flex-row items-center gap-8">
        <div className="p-5 bg-white rounded-3xl text-rose-500 shadow-sm shrink-0">
          <Trash2 size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-black text-rose-900 mb-2">Zona de Perigo</h4>
          <p className="text-rose-700/70 text-sm font-medium">
            Apaga permanentemente todos os registros do navegador. Use esta opção apenas se desejar começar o sistema do zero.
          </p>
        </div>
        <button 
          onClick={async () => { if(confirm("Deseja realmente limpar TODOS os dados? Esta ação não pode ser desfeita.")) { await resetSystem(); window.location.reload(); } }}
          className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 uppercase tracking-widest text-[10px]"
        >
          Limpar Tudo
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] pt-4">
        <ShieldCheck size={14} />
        <span>Dados Protegidos Localmente no seu Navegador</span>
      </div>
    </div>
  );
};

export default Settings;
