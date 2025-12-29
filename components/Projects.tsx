
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Trash2, Edit2, Eye, User, Loader2 } from 'lucide-react';
import { getStorageData, addItem, updateItem, deleteProjectCascade } from '../storage';
import { Project, ProjectStatus, AppData } from '../types';

const Projects: React.FC = () => {
  // Fix: getStorageData returns a Promise
  const [data, setData] = useState<AppData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    startDate: '',
    endDate: '',
    clientId: '',
    value: 0,
    status: ProjectStatus.PENDING
  });

  const loadData = async () => {
    const d = await getStorageData();
    setData(d);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      // Fix: updateItem does not accept generics
      await updateItem('projects', editingProject.id, formData);
    } else {
      await addItem('projects', { ...formData, id: `PROJ-${Date.now()}` });
    }
    setShowModal(false);
    setEditingProject(null);
    setFormData({ description: '', startDate: '', endDate: '', clientId: '', value: 0, status: ProjectStatus.PENDING });
    loadData();
  };

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando projetos...
      </div>
    );
  }

  const filtered = data.projects.filter(p => {
    const client = data.clients.find(c => c.id === p.clientId);
    return p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (client?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Projetos em Execução</h2>
          <p className="text-gray-500 text-sm font-medium">Controle cronológico e financeiro de obras.</p>
        </div>
        <button onClick={() => { setEditingProject(null); setShowModal(true); }} className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <PlusCircle size={20} /> Novo Projeto
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Buscar por descrição ou cliente..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-8 py-5">Projeto / Cliente</th>
                <th className="px-8 py-5">Prazos</th>
                <th className="px-8 py-5">V. Contrato</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const client = data.clients.find(c => c.id === p.clientId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 group transition-all">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{p.description}</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mt-1">
                          <User size={12} className="text-indigo-500" />
                          {client?.name || 'Cliente não definido'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-gray-500">
                        <p>INI: {new Date(p.startDate).toLocaleDateString()}</p>
                        <p className="text-indigo-400">FIM: {new Date(p.endDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-gray-900">R$ {p.value.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        p.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                        p.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        p.status === ProjectStatus.CANCELED ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link to={`/projects/${p.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Eye size={18} /></Link>
                        <button onClick={() => { setEditingProject(p); setFormData(p); setShowModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={18} /></button>
                        <button onClick={async () => { if(confirm('Excluir projeto?')) { await deleteProjectCascade(p.id); loadData(); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Planejamento de Obra</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><PlusCircle className="rotate-45"/></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descrição do Projeto</label>
                <input required className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cliente</label>
                  <select required className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                    <option value="">Selecione um cliente</option>
                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor Contratado (R$)</label>
                  <input type="number" required className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600" value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Data Início</label>
                  <input type="date" required className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Entrega Estimada</label>
                  <input type="date" required className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Operacional</label>
                <select className="w-full px-6 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}>
                  {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs mt-4">Confirmar e Abrir Projeto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
