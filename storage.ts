
import { AppData, AppSettings } from './types';
import { supabase } from './supabase';

const initialSettings: AppSettings = {
  appName: 'FlowMaster',
  adminName: 'Gestor Flow',
  adminRole: 'Administrador',
  companyName: 'Flow Enterprise',
  displayMode: 'pc'
};

// Funções de busca global
export const getStorageData = async (): Promise<AppData> => {
  const [
    { data: settings },
    { data: clients },
    { data: products },
    { data: projects },
    { data: services },
    { data: materials },
    { data: collaborators },
    { data: paymentsReceived },
    { data: collaboratorPayments }
  ] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('clients').select('*'),
    supabase.from('products').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('services').select('*'),
    supabase.from('materials').select('*'),
    supabase.from('collaborators').select('*'),
    supabase.from('payments_received').select('*'),
    supabase.from('collaborator_payments').select('*')
  ]);

  return {
    settings: settings || initialSettings,
    clients: clients || [],
    products: products || [],
    projects: projects || [],
    services: services || [],
    materials: materials || [],
    collaborators: collaborators || [],
    paymentsReceived: paymentsReceived || [],
    collaboratorPayments: collaboratorPayments || []
  };
};

export const getSettings = async (): Promise<AppSettings> => {
  const { data } = await supabase.from('settings').select('*').single();
  return data || initialSettings;
};

export const saveSettings = async (settings: AppSettings) => {
  // Supabase usa o ID 1 para as configurações globais
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, ...settings });
  if (error) console.error("Erro ao salvar settings:", error);
};

export const addItem = async (table: string, item: any) => {
  const { error } = await supabase.from(table).insert([item]);
  if (error) console.error(`Erro ao adicionar em ${table}:`, error);
};

export const addItemsBatch = async (table: string, items: any[]) => {
  const { error } = await supabase.from(table).insert(items);
  if (error) console.error(`Erro ao adicionar batch em ${table}:`, error);
};

export const updateItem = async (table: string, id: string, updatedFields: any) => {
  const { error } = await supabase.from(table).update(updatedFields).eq('id', id);
  if (error) console.error(`Erro ao atualizar em ${table}:`, error);
};

export const deleteItem = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.error(`Erro ao deletar de ${table}:`, error);
};

export const deleteProjectCascade = async (projectId: string) => {
  await Promise.all([
    supabase.from('projects').delete().eq('id', projectId),
    supabase.from('services').delete().eq('projectId', projectId),
    supabase.from('materials').delete().eq('projectId', projectId),
    supabase.from('payments_received').delete().eq('projectId', projectId),
    supabase.from('collaborator_payments').delete().eq('projectId', projectId)
  ]);
};

// Funções de backup mantidas como utilitários de arquivo
export const exportSystemImage = async () => {
  const data = await getStorageData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_supabase_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const resetSystem = async () => {
  const tables = ['clients', 'products', 'projects', 'services', 'materials', 'collaborators', 'payments_received', 'collaborator_payments'];
  await Promise.all(tables.map(t => supabase.from(t).delete().neq('id', '0')));
  await saveSettings(initialSettings);
};

// Fix: Missing importSystemImage implementation
export const importSystemImage = async (json: string): Promise<boolean> => {
  try {
    const data: AppData = JSON.parse(json);
    await resetSystem();
    if (data.clients?.length) await addItemsBatch('clients', data.clients);
    if (data.products?.length) await addItemsBatch('products', data.products);
    if (data.collaborators?.length) await addItemsBatch('collaborators', data.collaborators);
    if (data.projects?.length) await addItemsBatch('projects', data.projects);
    if (data.services?.length) await addItemsBatch('services', data.services);
    if (data.materials?.length) await addItemsBatch('materials', data.materials);
    if (data.paymentsReceived?.length) await addItemsBatch('payments_received', data.paymentsReceived);
    if (data.collaboratorPayments?.length) await addItemsBatch('collaborator_payments', data.collaboratorPayments);
    await saveSettings(data.settings);
    return true;
  } catch (e) {
    console.error("Erro ao importar backup:", e);
    return false;
  }
};
