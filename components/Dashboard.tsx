
import React, { useMemo, useState, useEffect } from 'react';
import { DollarSign, Briefcase, Users, Package, ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { getStorageData } from '../storage';
import { ProjectStatus, AppData } from '../types';

const Dashboard: React.FC = () => {
  // Fix: getStorageData returns a Promise, so we must use state and effect
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    getStorageData().then(setData);
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;
    // 1. Cálculos de Projetos
    const totalReceived = data.paymentsReceived.reduce((acc, p) => acc + p.amount, 0);
    const totalMaterialCost = data.materials.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
    const totalServicesProduced = data.services.reduce((acc, s) => acc + (s.amount || 0), 0);
    
    // Saldo Real do Negócio (O que sobrou do que os clientes pagaram menos o que custou produzir)
    const projectsRealBalance = totalReceived - (totalMaterialCost + totalServicesProduced);

    // 2. Cálculos de Colaboradores (Dívida de Trabalho)
    // O que eles ganharam produzindo
    const totalCollabEarned = totalServicesProduced;
    // O que já saiu do caixa para eles
    const totalCollabPaid = data.collaboratorPayments.reduce((acc, p) => acc + p.amount, 0);
    // Saldo que ainda devemos pagar à equipe
    const collabPendingBalance = totalCollabEarned - totalCollabPaid;

    return {
      projectsRealBalance,
      collabPendingBalance,
      totalReceived,
      totalProduced: totalMaterialCost + totalServicesProduced,
      activeProjects: data.projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      totalProjects: data.projects.length
    };
  }, [data]);

  if (!data || !metrics) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-400 font-bold">
        <Loader2 className="animate-spin" size={32} />
        Carregando métricas...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Resumo Operacional</h2>
        <p className="text-gray-500 font-medium">Foco em saldos líquidos e pendências financeiras.</p>
      </div>

      {/* Destaques Centrais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Saldo Projetos */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col justify-between group hover:border-indigo-100 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Saldo Real dos Projetos</p>
              <h3 className="text-sm font-bold text-gray-500">Lucro acumulado vs Produção</h3>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform">
              <DollarSign size={28} />
            </div>
          </div>
          <div className="mt-10">
            <p className={`text-5xl font-black tracking-tighter ${metrics.projectsRealBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              R$ {metrics.projectsRealBalance.toLocaleString()}
            </p>
            <div className="flex items-center gap-4 mt-6">
               <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                 <ArrowUpCircle size={14} /> Recebido: R$ {metrics.totalReceived.toLocaleString()}
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                 <ArrowDownCircle size={14} /> Custo Prod: R$ {metrics.totalProduced.toLocaleString()}
               </div>
            </div>
          </div>
        </div>

        {/* Card Saldo Colaboradores */}
        <div className="bg-gray-900 p-10 rounded-[40px] shadow-2xl shadow-gray-200 flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Pendente com Colaboradores</p>
              <h3 className="text-sm font-bold text-gray-500">Trabalho produzido a pagar</h3>
            </div>
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-3xl group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
          </div>
          <div className="mt-10">
            <p className={`text-5xl font-black tracking-tighter ${metrics.collabPendingBalance > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
              R$ {metrics.collabPendingBalance.toLocaleString()}
            </p>
            <div className="flex items-center gap-4 mt-6">
               <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                 <Wallet size={14} /> Total Dívida Gerada: R$ {metrics.totalProduced.toLocaleString()}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-5">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
             <Briefcase size={22} />
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Obras Ativas</p>
             <p className="text-xl font-black text-gray-900">{metrics.activeProjects} Projetos</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-5">
           <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
             <Package size={22} />
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Registrado</p>
             <p className="text-xl font-black text-gray-900">{metrics.totalProjects} Obras</p>
           </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-700">
           <AlertCircle size={24} />
           <p className="text-xs font-bold leading-tight">
             Lembre-se: O Saldo Real reflete apenas projetos onde a receita do cliente já entrou no caixa.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
