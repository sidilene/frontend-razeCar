import React from "react";
import PropTypes from "prop-types";
import { LayoutDashboard, Car, Palette, Users } from "lucide-react";


export default function TabsNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard & Gráficos", icon: <LayoutDashboard size={16} /> },
    { id: "lavagens", label: "Gestão de Lavagens", icon: <Car size={16} /> },
    { id: "tipos", label: "Tipos de Serviço", icon: <Palette size={16} /> },
    { id: "usuarios", label: "Gestão de Usuários", icon: <Users size={16} /> },
  ];

  return (
    <nav className="tabs-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </nav>
  );
}

TabsNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};
