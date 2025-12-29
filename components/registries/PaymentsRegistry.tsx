
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  DollarSign, 
  Calendar,
  Wallet,
  ArrowRightLeft,
  Briefcase,
  User,
  Filter,
  Package,
  Layers,
  PlusCircle,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { getStorageData, addItem, addItemsBatch, deleteItem } from '../../storage';
import { AppData, PaymentReceived, CollaboratorPayment, MaterialRecord } from '../../types';

interface BatchMaterialRow {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

const PaymentsRegistry: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [entryForm, setEntryForm] = useState({ projectId: '', amount: 0, method: 'PIX', date: new Date().toISOString().split('T')[0] });
  const [expenseForm, setExpenseForm] = useState({ projectId: '', collaboratorId: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  
  const [materialBatchProject, setMaterialBatchProject] = useState('');
  const [materialBatchDate, setMaterialBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchMaterials, setBatchMaterials] = useState<BatchMaterialRow[]>([
    { id: 'row-0', productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const loadData = async () => {
    const d = await getStorageData();
    setData(d);
  };
  
  useEffect(() => { loadData() }, []);

  const totals = useMemo(() => {
    if (!data) return { entries: 0, expenses: 0, balance: 0 };
    const entries = data.paymentsReceived.reduce((acc, p) => acc + p.amount, 0);
    const expenses = data.collaboratorPayments.reduce((acc, p) => acc + p.amount, 0);
    return { entries, expenses, balance: entries - expenses };
  }, [data]);

  const allMovements = useMemo(() => {
    if (!data) return [];
    const entries = data.paymentsReceived.map(p => ({ 
      ...p, 
      type: 'ENTRADA' as const, 
      label: `Recebimento: ${p.method}`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }));
    const expenses = data.collaboratorPayments.map(p => ({ 
      ...p, 
      type: 'SAIDA' as const, 
      label: `Pagto: ${data.collaborators.find(c => c.id === p.collaboratorId)?.name || 'Equipe'}`,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }));

    return [...entries, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const filtered = allMovements.filter(p => {
    const project = data?.projects.find(proj => proj.id === p.projectId);
    const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project?.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'TODOS' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem('payments_received', { ...entryForm, id: `REC-${Date.now()}` });
    setShowEntryModal(false);
    setEntryForm({ projectId: '', amount: 0, method: 'PIX', date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem('collaborator_payments', { ...expenseForm, id: `PAG-${Date.now()}` });
    setShowExpenseModal(false);
    setExpenseForm({ projectId: '', collaboratorId: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleSaveMaterialBatch = async () => {
    if (!materialBatchProject) return alert("Selecione o projeto.");
    const validRows = batchMaterials.filter(row => row.productId && row.quantity > 0);
    if (validRows.length === 0) return alert("Adicione pelo menos um material válido.");

    const newRecords: MaterialRecord[] = validRows.map(row => ({
      id: `MAT-${Date.now()}-${Math.random()}`,
      projectId: materialBatchProject,
      productId: row.productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      date: materialBatchDate
    }));

    await addItemsBatch('materials', newRecords);
    setShowMaterialModal(false);
    setBatchMaterials([{ id: 'row-0', productId: '', quantity: 1, unitPrice: 0 }]);
    setMaterialBatchProject('');
    loadData();
    alert("Materiais aplicados com sucesso!");
  };

  if (!data) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
      <Loader2 className="animate-spin" size={32} />
      Carregando financeiro...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fluxo de Caixa</h2>
          <p className="text-gray-500 font-medium">Gestão integrada via Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowMaterialModal(true)} className="flex items-center gap-2 px-5 py-3.5 bg-cyan-600 text-white rounded-2xl font-black shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all uppercase tracking-widest text-[10px]">
            <Package size={18} /> Aplicar Materiais
          </button>
          <button onClick={() => setShowEntryModal(true)} className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px]">
            <ArrowUpCircle size={18} /> Receber Cliente
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 px-5 py-3.5 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all uppercase tracking-widest text-[10px]">
            <ArrowDownCircle size={18} /> Pagar Equipe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Recebido</p>
          <p className="text-3xl font-black text-emerald-600">R$ {totals.entries.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Pago</p>
          <p className="text-3xl font-black text-rose-600">R$ {totals.expenses.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Saldo em Caixa</p>
          <p className={`text-3xl font-black ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {totals.balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Filtrar movimentações..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl">
            {(['TODOS', 'ENTRADA', 'SAIDA'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-10 py-6">Status / Data</th>
                <th className="px-10 py-6">Descrição</th>
                <th className="px-10 py-6">Obra</th>
                <th className="px-10 py-6 text-right">Valor</th>
                <th className="px-10 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p, idx) => {
                const project = data.projects.find(proj => proj.id === p.projectId);
                const isEntry = p.type === 'ENTRADA';
                return (
                  <tr key={`${p.id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-10 py-7">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${isEntry ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                         {p.type}
                       </span>
                    </td>
                    <td className="px-10 py-7 font-black text-gray-900">{p.label}</td>
                    <td className="px-10 py-7 font-bold text-sm text-indigo-600">{project?.description || '-'}</td>
                    <td className={`px-10 py-7 text-right text-lg font-black ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {p.amount.toLocaleString()}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button 
                        onClick={async () => { if(confirm('Remover?')) { await deleteItem(isEntry ? 'payments_received' : 'collaborator_payments', p.id); loadData(); } }}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais omitidos por brevidade, mas mantendo a lógica de gravação no Supabase */}
    </div>
  );
};

export default PaymentsRegistry;
