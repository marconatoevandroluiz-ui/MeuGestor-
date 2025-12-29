
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Loader2 } from 'lucide-react';
import { getStorageData, addItem, updateItem, deleteItem } from '../../storage';
import { Client } from '../../types';

const ClientsRegistry: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', document: '' });

  const load = async () => {
    setIsLoading(true);
    const data = await getStorageData();
    setClients(data.clients);
    setIsLoading(false);
  };
  useEffect(() => { load() }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      // Fix: updateItem does not accept generics
      await updateItem('clients', editingClient.id, formData);
    } else {
      await addItem('clients', { ...formData, id: `CLI-${Date.now()}` });
    }
    setShowModal(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', document: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir cliente?')) {
      await deleteItem('clients', id);
      load();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando clientes...
      </div>
    );
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Registro de Clientes</h2>
          <p className="text-gray-500 text-sm">Gerencie sua base de clientes centralizada.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 font-bold">
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Pesquisar clientes..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-8 py-5">Nome / Empresa</th>
                <th className="px-8 py-5">Contato</th>
                <th className="px-8 py-5">Documento</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{c.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm">
                      <p className="font-medium text-gray-700">{c.email}</p>
                      <p className="text-gray-400">{c.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono text-gray-500">{c.document}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingClient(c); setFormData(c); setShowModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><Plus className="rotate-45"/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome Completo / Razão Social</label>
                <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                  <input type="email" required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Telefone</label>
                  <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">CPF / CNPJ</label>
                <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})}/>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all mt-4">Salvar Cadastro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsRegistry;
