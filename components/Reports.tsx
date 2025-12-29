
import React, { useState, useMemo, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Users, ArrowRight, UserCheck, Loader2 } from 'lucide-react';
import { getStorageData } from '../storage';
import { AppData } from '../types';

const Reports: React.FC = () => {
  // Fix: getStorageData returns a Promise
  const [data, setData] = useState<AppData | null>(null);
  const [activeView, setActiveView] = useState<'PROJECTS' | 'COLLABORATORS'>('PROJECTS');

  useEffect(() => {
    getStorageData().then(setData);
  }, []);

  const reportData = useMemo(() => {
    if (!data) return [];
    return data.projects.map(project => {
      const received = data.paymentsReceived
        .filter(pr => pr.projectId === project.id)
        .reduce((acc, pr) => acc + pr.amount, 0);

      const materialsCost = data.materials
        .filter(m => m.projectId === project.id)
        .reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);

      const servicesValue = data.services
        .filter(s => s.projectId === project.id)
        .reduce((acc, s) => acc + (s.amount || 0), 0);

      const totalProductionCost = materialsCost + servicesValue;
      const profit = received - totalProductionCost;
      const profitMargin = received > 0 ? (profit / received) * 100 : 0;

      return {
        id: project.id,
        description: project.description,
        client: data.clients.find(c => c.id === project.clientId)?.name || 'N/A',
        contractValue: project.value,
        received,
        productionCost: totalProductionCost,
        profit,
        profitMargin
      };
    });
  }, [data]);

  const collabReportData = useMemo(() => {
    if (!data) return [];
    return data.collaborators.map(collab => {
      // Crédito: Serviços que ele produziu
      const produced = data.services
        .filter(s => s.collaboratorId === collab.id)
        .reduce((acc, s) => acc + (s.amount || 0), 0);
      
      // Débito: Pagamentos que ele recebeu
      const paid = data.collaboratorPayments
        .filter(p => p.collaboratorId === collab.id)
        .reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        id: collab.id,
        name: collab.name,
        role: collab.role,
        produced,
        paid,
        balance: produced - paid
      };
    });
  }, [data]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => ({
      received: acc.received + curr.received,
      expenses: acc.expenses + curr.productionCost,
      profit: acc.profit + curr.profit
    }), { received: 0, expenses: 0, profit: 0 });
  }, [reportData]);

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando relatórios...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Relatórios Gerenciais</h2>
          <p className="text-gray-500 font-medium">Análise de rentabilidade por obra e movimentação da equipe.</p>
        </div>
      </div>

      {/* Tabs de Seleção de Relatório */}
      <div className="flex items-center gap-3 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveView('PROJECTS')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'PROJECTS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <FileText size={16} /> Balanço de Obras
        </button>
        <button 
          onClick={() => setActiveView('COLLABORATORS')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'COLLABORATORS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Users size={16} /> Movimentação de Equipe
        </button>
      </div>

      {activeView === 'PROJECTS' ? (
        <>
          {/* KPI Cards Obras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Faturado Real</p>
              <p className="text-3xl font-black text-emerald-600">R$ {totals.received.toLocaleString()}</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Gasto Produção</p>
              <p className="text-3xl font-black text-rose-500">R$ {totals.expenses.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 p-8 rounded-[32px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lucro Operacional</p>
              <p className={`text-3xl font-black ${totals.profit >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>R$ {totals.profit.toLocaleString()}</p>
            </div>
          </div>

          {/* Tabela de Obras */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-10 py-6">Projeto / Cliente</th>
                    <th className="px-10 py-6 text-right">Contrato</th>
                    <th className="px-10 py-6 text-right">Recebido</th>
                    <th className="px-10 py-6 text-right">Custo Prod.</th>
                    <th className="px-10 py-6 text-right">Lucro Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-7">
                        <p className="font-black text-gray-900 leading-tight">{row.description}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{row.client}</p>
                      </td>
                      <td className="px-10 py-7 text-right font-bold text-gray-400 text-sm">R$ {row.contractValue.toLocaleString()}</td>
                      <td className="px-10 py-7 text-right font-black text-emerald-600">R$ {row.received.toLocaleString()}</td>
                      <td className="px-10 py-7 text-right font-black text-rose-500">R$ {row.productionCost.toLocaleString()}</td>
                      <td className={`px-10 py-7 text-right font-black ${row.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        R$ {row.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Tabela de Colaboradores */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Extrato da Equipe</h3>
               <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                 <UserCheck size={16} />
                 Saldo Positivo = Valor a Pagar ao Colaborador
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-10 py-6">Colaborador / Função</th>
                    <th className="px-10 py-6 text-right">Produção Total (Crédito)</th>
                    <th className="px-10 py-6 text-right">Pago (Débito)</th>
                    <th className="px-10 py-6 text-right">Saldo Devedor (A Pagar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collabReportData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-7">
                        <p className="font-black text-gray-900 leading-tight">{row.name}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{row.role}</p>
                      </td>
                      <td className="px-10 py-7 text-right font-black text-gray-900">R$ {row.produced.toLocaleString()}</td>
                      <td className="px-10 py-7 text-right font-black text-emerald-600">R$ {row.paid.toLocaleString()}</td>
                      <td className={`px-10 py-7 text-right font-black ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
                        {row.balance > 0 ? `R$ ${row.balance.toLocaleString()}` : 'QUITADO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
