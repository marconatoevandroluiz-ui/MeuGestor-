
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Wallet, CheckCircle2, Clock, Info, Loader2 } from 'lucide-react';
import { getStorageData, addItem, updateItem, deleteItem } from '../../storage';
import { Collaborator, AppData } from '../../types';

const CollaboratorsRegistry: React.FC = () => {
  // Fix: getStorageData returns a Promise
  const [data, setData] = useState<AppData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', role: '', phone: '', defaultDailyRate: 0 });

  const load = async () => {
    const d = await getStorageData();
    setData(d);
  };
  useEffect(() => { load() }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      // Fix: updateItem does not accept generics
      await updateItem('collaborators', editing.id, formData);
    } else {
      await addItem('collaborators', { ...formData, id: `COL-${Date.now()}` });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', role: '', phone: '', defaultDailyRate: 0 });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir colaborador?')) {
      await deleteItem('collaborators', id);
      load();
    }
  };

  const collaboratorsWithBalance = useMemo(() => {
    if (!data) return [];
    return data.collaborators.map(collab => {
      const totalProduced = data.services
        .filter(s => s.collaboratorId === collab.id)
        .reduce((acc, s) => acc + (s.amount || 0), 0);
      
      const totalPaid = data.collaboratorPayments
        .filter(p => p.collaboratorId === collab.id)
        .reduce((acc, p) => acc + (p.amount || 0), 0);
      
      return {
        ...collab,
        earned: totalProduced,
        paid: totalPaid,
        balance: totalProduced - totalPaid
      };
    });
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando colaboradores...
      </div>
    );
  }

  const filtered = collaboratorsWithBalance.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Equipe e Parceiros</h2>
          <p className="text-gray-500 text-sm">Controle de diárias produzidas vs pagamentos realizados.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 font-bold">
          <Plus size={20} /> Novo Colaborador
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm"><Info size={24}/></div>
        <div>
          <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider">Como funciona o Saldo?</h4>
          <p className="text-amber-800/70 text-sm mt-1 leading-relaxed">
            Ao lançar um <strong>Serviço</strong> para um colaborador, você gera um <strong>Crédito</strong> para ele (dívida sua). 
            Ao fazer um <strong>Pagamento</strong> no Fluxo de Caixa, você abate este saldo. 
            O saldo zero indica que o colaborador recebeu por tudo o que produziu.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Pesquisar por nome..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5 text-right">Total Produzido (Crédito)</th>
                <th className="px-8 py-5 text-right">Já Pago (Débito)</th>
                <th className="px-8 py-5 text-right">Saldo a Receber</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold">{c.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{c.name}</p>
                        <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{c.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-black text-gray-400">R$ {c.earned.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-sm font-black text-emerald-600">R$ {c.paid.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        R$ {c.balance.toLocaleString()}
                      </span>
                      {c.balance > 0 ? (
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter flex items-center gap-1">
                          <Clock size={10} /> Pendente
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
                          <CheckCircle2 size={10} /> Quitado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditing(c); setFormData({ name: c.name, role: c.role, phone: c.phone, defaultDailyRate: c.defaultDailyRate }); setShowModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={18}/></button>
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
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Cadastro de Colaborador</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Plus className="rotate-45"/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome Completo</label>
                <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Função / Cargo</label>
                  <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Telefone</label>
                  <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Diária Padrão (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold" 
                  value={formData.defaultDailyRate === 0 ? '' : formData.defaultDailyRate} 
                  placeholder="0,00"
                  onChange={e => setFormData({...formData, defaultDailyRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 mt-4">Salvar Colaborador</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorsRegistry;
