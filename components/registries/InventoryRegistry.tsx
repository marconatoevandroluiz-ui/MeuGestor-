
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Box, Loader2 } from 'lucide-react';
import { getStorageData, addItem, updateItem, deleteItem } from '../../storage';
import { Product } from '../../types';

const InventoryRegistry: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', unit: 'un', basePrice: 0 });

  const load = async () => {
    setIsLoading(true);
    const data = await getStorageData();
    setItems(data.products);
    setIsLoading(false);
  };
  useEffect(() => { load() }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      // Fix: updateItem does not accept generics
      await updateItem('products', editing.id, formData);
    } else {
      await addItem('products', { ...formData, id: `PRD-${Date.now()}` });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', unit: 'un', basePrice: 0 });
    load();
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando catálogo...
      </div>
    );
  }

  const filtered = items.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Produtos e Insumos</h2>
          <p className="text-gray-500 text-sm">Controle de catálogo para materiais de obras e serviços.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700">
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Filtrar produtos..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-8 py-5">Produto / Insumo</th>
                <th className="px-8 py-5">Unidade</th>
                <th className="px-8 py-5">Preço Base</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl"><Box size={20}/></div>
                      <span className="font-bold text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500 font-bold uppercase">{p.unit}</td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-700">R$ {p.basePrice.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditing(p); setFormData(p); setShowModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={18}/></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await deleteItem('products', p.id); load(); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
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
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Cadastro de Produto</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Plus className="rotate-45"/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome do Item</label>
                <input required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Unidade</label>
                  <select className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="un">UN</option>
                    <option value="m">Mts</option>
                    <option value="m2">M²</option>
                    <option value="m3">M³</option>
                    <option value="kg">Kg</option>
                    <option value="lt">Litros</option>
                    <option value="pc">Peça</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Preço Base (R$)</label>
                  <input type="number" step="0.01" required className="w-full px-5 py-3 border border-gray-200 bg-white text-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: parseFloat(e.target.value)})}/>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700 mt-4">Salvar no Catálogo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRegistry;
