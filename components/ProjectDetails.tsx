
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Edit2, 
  Package, Users, DollarSign, ListTodo,
  TrendingDown, TrendingUp, AlertCircle,
  Layers, Download, X, PlusCircle, AlignLeft,
  Loader2
} from 'lucide-react';
import { getStorageData, addItem, addItemsBatch, updateItem, deleteItem } from '../storage';
import { Project, ServiceRecord, MaterialRecord, PaymentReceived, CollaboratorPayment, Product, Collaborator, AppData } from '../types';

const Tabs = {
  SERVICES: 'servicos',
  MATERIALS: 'materiais',
  PAYMENTS_RECEIVED: 'recebimentos',
  PAYMENTS_PAID: 'pagamentos'
} as const;

interface BatchMaterialRow {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof Tabs[keyof typeof Tabs]>(Tabs.SERVICES);
  const [project, setProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [formState, setFormState] = useState<any>({});
  
  const [batchMaterials, setBatchMaterials] = useState<BatchMaterialRow[]>([
    { id: 'row-0', productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const refreshData = async () => {
    // Fix: getStorageData is async
    const d = await getStorageData();
    setData(d);
    const p = d.projects.find(proj => proj.id === id);
    if (!p && id) navigate('/projects');
    setProject(p || null);
  };

  useEffect(() => { refreshData() }, [id]);

  const stats = useMemo(() => {
    if (!project || !data) return { totalExpenses: 0, received: 0, netBalance: 0, laborDebt: 0 };
    
    const received = data.paymentsReceived
      .filter(p => p.projectId === id)
      .reduce((acc, pr) => acc + pr.amount, 0);
    
    const servicesCost = data.services
      .filter(s => s.projectId === id)
      .reduce((acc, s) => acc + (s.amount || 0), 0);
      
    const materialsCost = data.materials
      .filter(m => m.projectId === id)
      .reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
    
    const totalExpenses = servicesCost + materialsCost;
    
    const laborPaid = data.collaboratorPayments
      .filter(cp => cp.projectId === id)
      .reduce((acc, cp) => acc + cp.amount, 0);

    return { 
      totalExpenses, 
      received, 
      netBalance: received - totalExpenses, 
      laborDebt: servicesCost - laborPaid 
    };
  }, [project, data, id]);

  if (!data || !project) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando detalhes do projeto...
      </div>
    );
  }

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormState(item);
    } else {
      setEditingId(null);
      const today = new Date().toISOString().split('T')[0];
      if (activeTab === Tabs.SERVICES) setFormState({ description: '', date: today, amount: 0, collaboratorId: '', notes: '' });
      if (activeTab === Tabs.MATERIALS) setFormState({ productId: '', date: today, quantity: 1, unitPrice: 0 });
      if (activeTab === Tabs.PAYMENTS_RECEIVED) setFormState({ date: today, amount: 0, method: 'PIX' });
      if (activeTab === Tabs.PAYMENTS_PAID) setFormState({ date: today, amount: 0, collaboratorId: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const map = {
      [Tabs.SERVICES]: 'services',
      [Tabs.MATERIALS]: 'materials',
      [Tabs.PAYMENTS_RECEIVED]: 'paymentsReceived',
      [Tabs.PAYMENTS_PAID]: 'collaboratorPayments'
    };
    const key = map[activeTab] as any;

    if (editingId) {
      await updateItem(key, editingId, formState);
    } else {
      await addItem(key, { ...formState, id: `${activeTab}-${Date.now()}`, projectId: id });
    }
    setShowModal(false);
    refreshData();
  };

  const addBatchRow = () => {
    setBatchMaterials([...batchMaterials, { id: `row-${Date.now()}`, productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateBatchRow = (idx: number, fields: Partial<BatchMaterialRow>) => {
    const newList = [...batchMaterials];
    newList[idx] = { ...newList[idx], ...fields };
    setBatchMaterials(newList);
  };

  const handleSaveBatch = async () => {
    const validRows = batchMaterials.filter(row => row.productId && row.quantity > 0);
    if (validRows.length === 0) {
      alert("Selecione pelo menos um produto válido.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newRecords: MaterialRecord[] = validRows.map(row => ({
      id: `MAT-${Date.now()}-${Math.random()}`,
      projectId: id!,
      productId: row.productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      date: today
    }));

    await addItemsBatch('materials', newRecords);
    setShowBatchModal(false);
    setBatchMaterials([{ id: 'row-0', productId: '', quantity: 1, unitPrice: 0 }]);
    refreshData();
  };

  const exportMaterialsCSV = () => {
    const projectMaterials = data.materials.filter(m => m.projectId === id);
    if (projectMaterials.length === 0) return alert("Não há materiais registrados nesta obra.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data;Material;Unidade;Quantidade;Preço Unit;Total\n";

    projectMaterials.forEach(m => {
      const prod = data.products.find(p => p.id === m.productId);
      const total = m.quantity * m.unitPrice;
      csvContent += `${m.date};${prod?.name || 'Manual'};${prod?.unit || 'un'};${m.quantity};${m.unitPrice};${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `materiais_${project?.description.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const client = data.clients.find(c => c.id === project.clientId);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all text-gray-400 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{project.description}</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Cliente: <span className="text-indigo-600">{client?.name || 'Não Registrado'}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === Tabs.MATERIALS && (
            <>
              <button 
                onClick={exportMaterialsCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-[24px] font-black hover:bg-gray-50 transition-all text-xs uppercase tracking-widest"
              >
                <Download size={18} /> Exportar Lista
              </button>
              <button 
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-[24px] font-black shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all text-xs uppercase tracking-widest"
              >
                <Layers size={18} /> Lançamento em Lote
              </button>
            </>
          )}
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest">
            <Plus size={20} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Recebido do Cliente</p>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600">R$ {stats.received.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Custo Operacional (Serv + Mat)</p>
            <TrendingDown className="text-rose-500" size={18} />
          </div>
          <p className="text-2xl font-black text-rose-600">R$ {stats.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-[32px] shadow-xl shadow-gray-200">
          <div className="flex items-center justify-between mb-4 text-white/50">
            <p className="text-[10px] font-black uppercase tracking-widest">Saldo Líquido da Obra</p>
            <DollarSign size={18} />
          </div>
          <p className={`text-2xl font-black ${stats.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {stats.netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-white/60 border border-white/80 rounded-[32px] w-full overflow-x-auto shadow-sm backdrop-blur-md">
        {[
          { id: Tabs.SERVICES, label: 'Diárias (Débito)', icon: <ListTodo size={18} /> },
          { id: Tabs.MATERIALS, label: 'Materiais (Débito)', icon: <Package size={18} /> },
          { id: Tabs.PAYMENTS_RECEIVED, label: 'Entradas (Cliente)', icon: <TrendingUp size={18} /> },
          { id: Tabs.PAYMENTS_PAID, label: 'Pagamentos (Saída)', icon: <TrendingDown size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 rounded-[24px] transition-all whitespace-nowrap text-xs font-black uppercase tracking-widest ${
              activeTab === tab.id 
              ? 'bg-gray-900 text-white shadow-lg' 
              : 'text-gray-400 hover:bg-white hover:text-gray-600'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === Tabs.SERVICES && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Colaborador</th>
                  <th className="px-8 py-5">Atividade</th>
                  <th className="px-8 py-5 text-right">Valor Produzido</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.services.filter(s => s.projectId === id).map(s => {
                   const collab = data.collaborators.find(c => c.id === s.collaboratorId);
                   return (
                    <tr key={s.id} className="hover:bg-gray-50 group transition-all">
                      <td className="px-8 py-5 text-xs font-bold text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 font-bold text-gray-900">{collab?.name || 'Manual'}</td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 font-bold">{s.description}</span>
                          {s.notes && (
                            <span className="text-[11px] text-gray-400 italic mt-1 flex items-center gap-1">
                              <AlignLeft size={10} /> {s.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-rose-600">R$ {s.amount?.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => handleOpenModal(s)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={16}/></button>
                          <button onClick={async () => { if(confirm('Remover?')) { await deleteItem('services', s.id); refreshData(); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}

          {activeTab === Tabs.MATERIALS && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-8 py-5">Produto / Material</th>
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Qtd</th>
                  <th className="px-8 py-5">V. Unit</th>
                  <th className="px-8 py-5">Total</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.materials.filter(m => m.projectId === id).map(m => {
                   const product = data.products.find(p => p.id === m.productId);
                   return (
                    <tr key={m.id} className="hover:bg-gray-50 group">
                      <td className="px-8 py-5 font-bold text-gray-900">{product?.name || 'Outro'}</td>
                      <td className="px-8 py-5 text-xs text-gray-400 font-bold">{new Date(m.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-sm font-bold">{m.quantity} {product?.unit || 'un'}</td>
                      <td className="px-8 py-5 text-sm text-gray-500">R$ {m.unitPrice.toLocaleString()}</td>
                      <td className="px-8 py-5 font-black text-rose-600">R$ {(m.quantity * m.unitPrice).toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => handleOpenModal(m)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={16}/></button>
                          <button onClick={async () => { if(confirm('Remover?')) { await deleteItem('materials', m.id); refreshData(); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}

          {(activeTab === Tabs.PAYMENTS_RECEIVED || activeTab === Tabs.PAYMENTS_PAID) && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">{activeTab === Tabs.PAYMENTS_PAID ? 'Para / Beneficiário' : 'Método'}</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(activeTab === Tabs.PAYMENTS_RECEIVED ? data.paymentsReceived : data.collaboratorPayments).filter(p => p.projectId === id).map(p => {
                  const target = activeTab === Tabs.PAYMENTS_PAID ? data.collaborators.find(c => c.id === (p as any).collaboratorId)?.name : (p as any).method;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 group">
                      <td className="px-8 py-5 text-xs font-bold">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 font-bold">{target}</td>
                      <td className={`px-8 py-5 text-right font-black ${activeTab === Tabs.PAYMENTS_RECEIVED ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {p.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => handleOpenModal(p)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={16}/></button>
                          <button onClick={async () => { if(confirm('Remover?')) { await deleteItem(activeTab === Tabs.PAYMENTS_RECEIVED ? 'paymentsReceived' : 'collaboratorPayments', p.id); refreshData(); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Novo Lançamento</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Plus className="rotate-45"/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              {activeTab === Tabs.SERVICES && (
                <>
                  <select required className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.collaboratorId} onChange={e => setFormState({...formState, collaboratorId: e.target.value})}>
                    <option value="">Selecionar Colaborador</option>
                    {data.collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input placeholder="Descrição da tarefa" className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})}/>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})}/>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Valor Produzido (R$)" 
                      className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none font-black text-rose-600" 
                      value={formState.amount === 0 ? '' : formState.amount} 
                      onChange={e => setFormState({...formState, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <textarea 
                    placeholder="Observações adicionais (opcional)" 
                    className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none min-h-[100px] resize-none"
                    value={formState.notes || ''} 
                    onChange={e => setFormState({...formState, notes: e.target.value})}
                  />
                </>
              )}
              {activeTab === Tabs.MATERIALS && (
                <>
                  <select required className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.productId} onChange={e => {
                    const prod = data.products.find(p => p.id === e.target.value);
                    setFormState({...formState, productId: e.target.value, unitPrice: prod?.basePrice || 0});
                  }}>
                    <option value="">Selecionar Produto do Catálogo</option>
                    {data.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="number" 
                      placeholder="Qtd" 
                      className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" 
                      value={formState.quantity === 0 ? '' : formState.quantity} 
                      onChange={e => setFormState({...formState, quantity: parseFloat(e.target.value) || 0})}
                    />
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="V. Unit" 
                      className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" 
                      value={formState.unitPrice === 0 ? '' : formState.unitPrice} 
                      onChange={e => setFormState({...formState, unitPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <input type="date" className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})}/>
                </>
              )}
              {(activeTab === Tabs.PAYMENTS_RECEIVED || activeTab === Tabs.PAYMENTS_PAID) && (
                <>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Valor (R$)" 
                    required 
                    className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none font-black text-lg" 
                    value={formState.amount === 0 ? '' : formState.amount} 
                    onChange={e => setFormState({...formState, amount: parseFloat(e.target.value) || 0})}
                  />
                  {activeTab === Tabs.PAYMENTS_PAID ? (
                    <select required className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.collaboratorId} onChange={e => setFormState({...formState, collaboratorId: e.target.value})}>
                      <option value="">Para quem?</option>
                      {data.collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input placeholder="Método (PIX, DOC, Dinheiro...)" className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.method} onChange={e => setFormState({...formState, method: e.target.value})}/>
                  )}
                  <input type="date" className="w-full px-5 py-4 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})}/>
                </>
              )}
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100">Registrar no Projeto</button>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Lançamento em Lote de Materiais</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registre múltiplos insumos de uma só vez</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Plus className="rotate-45"/></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-left">
                    <th className="px-4">Produto</th>
                    <th className="px-4 w-24 text-center">Quantidade</th>
                    <th className="px-4 w-40 text-center">Preço Unit (R$)</th>
                    <th className="px-4 w-32 text-right">Subtotal</th>
                    <th className="px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {batchMaterials.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-1">
                        <select 
                          className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                          value={row.productId}
                          onChange={e => {
                            const prod = data.products.find(p => p.id === e.target.value);
                            updateBatchRow(idx, { productId: e.target.value, unitPrice: prod?.basePrice || 0 });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {data.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                        </select>
                      </td>
                      <td className="px-1">
                        <input 
                          type="number"
                          className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-center font-bold"
                          value={row.quantity}
                          onChange={e => updateBatchRow(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1">
                        <input 
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-center font-bold"
                          value={row.unitPrice}
                          onChange={e => updateBatchRow(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 text-right">
                        <span className="font-black text-gray-900">R$ {(row.quantity * row.unitPrice).toLocaleString()}</span>
                      </td>
                      <td className="px-1 text-right">
                        {batchMaterials.length > 1 && (
                          <button 
                            onClick={() => setBatchMaterials(batchMaterials.filter((_, i) => i !== idx))}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <button 
                onClick={addBatchRow}
                className="mt-6 flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl w-full justify-center hover:border-cyan-200 hover:text-cyan-500 transition-all font-bold"
              >
                <PlusCircle size={20} /> Adicionar Linha
              </button>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Lote</span>
                <span className="text-2xl font-black text-gray-900">R$ {batchMaterials.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0).toLocaleString()}</span>
              </div>
              <button 
                onClick={handleSaveBatch}
                className="px-10 py-4 bg-cyan-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all"
              >
                Gravar Todos os Registros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
