
import React, { Component, ErrorInfo, ReactNode } from 'react';
// Import icons from lucide-react
import { AlertTriangle, RefreshCw, Download, Upload } from 'lucide-react';
// Backend utility functions imported from the storage file
import { exportSystemImage, resetSystem, importSystemImage } from '../storage';

interface Props {
  /**
   * Children components to be rendered within the error boundary
   */
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary component to catch rendering errors in children components
 */
// Fix: Extending Component directly from 'react' helps resolve inheritance type issues for state and props
class ErrorBoundary extends Component<Props, State> {
  // Fix: Initializing state as a class property ensures it is recognized by the TypeScript compiler
  public state: State = {
    hasError: false
  };

  // Fix: Constructor passes props to super and ensures the component is correctly instantiated
  constructor(props: Props) {
    super(props);
  }

  // Fix: Static method required by React to update state when an error occurs during rendering
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // Fix: Standard React lifecycle method to log error details
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // Fix: Handles system backup file import and reloads the page on success
  private handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        // Fix: importSystemImage is async
        if (await importSystemImage(content)) {
          window.location.reload();
        } else {
          alert("Arquivo de backup inválido.");
        }
      };
      reader.readAsText(file);
    }
  };

  public render() {
    // Fix: Accessing 'this.state' inherited from Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-xl w-full bg-gray-800 rounded-[40px] p-10 shadow-2xl border border-gray-700 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-3xl font-black mb-4 tracking-tight">Ops! Algo deu errado.</h1>
            <p className="text-gray-400 font-medium mb-10">
              O sistema encontrou um erro crítico que impediu a exibição da tela. Isso pode ser causado por dados corrompidos ou falha de carregamento.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black flex items-center justify-center gap-3 transition-all"
              >
                <RefreshCw size={20} /> Tentar Recarregar
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={exportSystemImage}
                  className="py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <Download size={18} /> Salvar Dados Atuais
                </button>
                <label className="py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer">
                  <Upload size={18} /> Restaurar Backup
                  <input type="file" className="hidden" accept=".json" onChange={this.handleFileImport} />
                </label>
              </div>

              <button 
                onClick={async () => { if(confirm("Deseja realmente limpar TODOS os dados? Esta ação não pode ser desfeita.")) { await resetSystem(); window.location.reload(); } }}
                className="w-full py-4 bg-transparent border border-gray-700 hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 rounded-2xl font-bold transition-all text-sm"
              >
                Resetar Sistema para o Zero
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Accessing 'this' with an explicit any cast to resolve "Property 'props' does not exist" error
    return (this as any).props.children;
  }
}

export default ErrorBoundary;
