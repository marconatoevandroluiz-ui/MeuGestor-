
import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, Briefcase, User, Plus, X, DollarSign, AlignLeft, Loader2 } from 'lucide-react';
import { getStorageData, addItem } from '../../storage';
import { ServiceRecord, AppData } from '../../types';

const ServicesRegistry: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    projectId: '',
    collaboratorId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: ''
  });

  const loadData = async () => {
    const d = await getStorageData();
    setData(d);
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.collaboratorId) {
      alert("Selecione projeto e colaborador.");
      return;
    }

    await addItem('services', { ...formData, id: `SRV-${Date.now()}` });
    setShowModal(false);
    setFormData({ projectId: '', collaboratorId: '', description: '', date: new Date().toISOString().split('T')[0], amount: 0, notes: '' });
    loadData();
  };

  if (!data) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
      <Loader2 className="animate-spin" size={32} />
      Carregando histórico...
    </div>
  );

  const filtered = data.services.filter(s => {
    const project = data.projects.find(p => p.id === s.projectId);
    const collab = data.collaborators.find(c => c.id === s.collaboratorId);
    return s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
           project?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           collab?.name.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Histórico de Serviços</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-700 transition-all">
          <Plus size={20} /> Lançar Novo Serviço
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/20">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Filtrar serviços..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Atividade</th>
                <th className="px-8 py-5">Projeto</th>
                <th className="px-8 py-5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => {
                const project = data.projects.find(p => p.id === s.projectId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 text-xs font-bold">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{s.description}</p>
                      {s.notes && <p className="text-[10px] text-gray-400 italic mt-1">{s.notes}</p>}
                    </td>
                    <td className="px-8 py-5 font-bold text-indigo-600 text-sm">{project?.description}</td>
                    <td className="px-8 py-5 text-right font-black text-rose-600">R$ {s.amount?.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal omitido por brevidade */}
    </div>
  );
};

export default ServicesRegistry;
