
export enum ProjectStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export type DisplayMode = 'pc' | 'tablet' | 'mobile';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  basePrice: number;
}

export interface Project {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  clientId: string; // Linked to Client Registry
  value: number;
  status: ProjectStatus;
}

export interface ServiceRecord {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number; 
  collaboratorId: string; // Linked to Collaborator Registry
  notes?: string; // Observações adicionais
}

export interface MaterialRecord {
  id: string;
  projectId: string;
  productId: string; // Linked to Product Registry
  quantity: number;
  unitPrice: number;
  date: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  phone: string;
  defaultDailyRate: number;
}

export interface PaymentReceived {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  method: string;
}

export interface CollaboratorPayment {
  id: string;
  projectId: string;
  collaboratorId: string;
  date: string;
  amount: number;
}

export interface AppSettings {
  appName: string;
  adminName: string;
  adminRole: string;
  companyName: string;
  displayMode: DisplayMode;
  appLogo?: string; // Armazena a imagem em Base64
}

export interface AppData {
  settings: AppSettings;
  clients: Client[];
  products: Product[];
  projects: Project[];
  services: ServiceRecord[];
  materials: MaterialRecord[];
  collaborators: Collaborator[];
  paymentsReceived: PaymentReceived[];
  collaboratorPayments: CollaboratorPayment[];
}
