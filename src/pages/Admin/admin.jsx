import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import TabsNav from "../../components/TabsNav";

// Import das páginas internas
import Dashboard from "./Dashboard";
import Lavagens from "./Lavagens";
import TiposServicos from "./TiposServicos";
import Usuarios from "./Usuarios";



export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "lavagens":
        return <Lavagens />;
      case "tipos":
        return <TiposServicos />;
      case "usuarios":
        return <Usuarios />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-container">
      <Navbar />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <div className="tab-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}


