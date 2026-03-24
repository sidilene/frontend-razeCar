import PropTypes from "prop-types";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Car,
  Palette,
  Users,
  CalendarClock,
  Menu,
  Store,
  X,
  Package,
  Truck,
  CornerDownRight
} from "lucide-react";

// 1. Recebemos o "temAcessoAdmin" aqui em cima
export default function TabsNav({ activeTab, setActiveTab, temAcessoAdmin }) {
  const [isOpen, setIsOpen] = useState(false);

  // 2. Mudamos o nome para "todasAsTabs"
  const todasAsTabs = [
    { id: "dashboard", label: "Dashboard & Gráficos", icon: LayoutDashboard },
    { id: "lavagens", label: "Gestão de Lavagens", icon: Car },
    { id: "tipos", label: "Tipos de Serviço", icon: Palette },
    { id: "usuarios", label: "Gestão de Usuários", icon: Users },
    { id: "agendamentos", label: "Agendamentos", icon: CalendarClock },
    { id: "estoque", label: "Estoque", icon: Package},
    { id: "minhaloja", label: "Minha Loja", icon: Store },
    { id: "fornecedores", label: "Fornecedores", icon: Truck },
  ];

  // 3. Filtramos as abas com base na permissão do usuário
  const tabs = todasAsTabs.filter((tab) => {
    if (!temAcessoAdmin && (tab.id === "dashboard" || tab.id === "usuarios")) {
      return false; // Corta essas duas se não for dono
    }
    return true; // Mantém o resto
  });

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const activeTabData = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabData ? activeTabData.icon : Menu;

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 transition-all border-t border-blue-500 dark:bg-gray-900 duration-300 dark:border-gray-900">
      <div className="container mx-auto px-4">

        {/* --- VERSÃO MOBILE --- */}
        <div className="md:hidden py-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 font-medium text-sm"
          >
            <div className="flex items-center gap-2.5">
              <ActiveIcon className="h-4 w-4" />
              <span>{activeTabData ? activeTabData.label : "Menu"}</span>
            </div>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Lista Dropdown Mobile */}
          {isOpen && (
            <div className="absolute left-4 right-4 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
              {tabs.map((tab) => {
                // 1. ESCONDER Fornecedores da lista principal
                if (tab.id === 'fornecedores') return null;

                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <React.Fragment key={tab.id}>
                    {/* Item Principal */}
                    <button
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>

                    {/* 2. LÓGICA DE SUB-ABA: Se o item atual for Estoque, renderiza Fornecedores abaixo */}
                    {tab.id === 'estoque' && (
                      <button
                        onClick={() => handleTabClick('fornecedores')}
                        className={`flex items-center gap-3 w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-lg transition-colors relative ${
                          activeTab === 'fornecedores'
                            ? "text-blue-600 bg-blue-50/50 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {/* Linha visual conectando ao pai */}
                        <div className="absolute left-6 top-0 bottom-1/2 w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="absolute left-6 bottom-1/2 w-3 h-px bg-gray-200 dark:bg-gray-700" />

                        <CornerDownRight className="h-3.5 w-3.5 opacity-70" />
                        Fornecedores
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* --- VERSÃO DESKTOP --- */}
        <div className="hidden md:flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar py-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  group relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-y-[-1px]"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 dark:text-white dark:hover:text-blue-400"
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
}

// 4. Validamos a nova prop aqui embaixo
TabsNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  temAcessoAdmin: PropTypes.bool
};
