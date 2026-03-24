import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../../services/api";

import Navbar from "../../components/Navbar";
import TabsNav from "../../components/TabsNav";

import Dashboard from "./Dashboard";
import Lavagens from "./Lavagens";
import TiposServicos from "./TiposServicos";
import Usuarios from "./Usuarios";
import Agendamentos from "./Agendamentos";
import Planos from "./Planos";
import Estoque from "./Estoque";
import Fornecedores from "./Fornecedores";
import MinhaLoja from "./MinhaLoja";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("lavagens");
  const [isDono, setIsDono] = useState(false);
  const [carregandoAcesso, setCarregandoAcesso] = useState(true);

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const response = await fetch(`${API_BASE}/lavajatos/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (response.ok) {
          const dados = await response.json();

          // Pega o cargo (usa safe operator caso não exista)
          const cargo = dados.usuario?.cargo ? dados.usuario.cargo.toUpperCase() : "";
          const tipo = dados.usuario?.tipo ? dados.usuario.tipo.toUpperCase() : "";

          if (cargo === "DONO" || tipo === "DONO") {
           // console.log("✅ SISTEMA LIBEROU: É o chefe!");
            setIsDono(true);
            setActiveTab("dashboard");
          } else {
           // console.log("⛔ SISTEMA BLOQUEOU: É funcionário!");
            setIsDono(false);
            setActiveTab("lavagens");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
      } finally {
        setCarregandoAcesso(false);
      }
    };

    verificarAcesso();
  }, []);

  const renderTabContent = () => {
    if (carregandoAcesso) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

    switch (activeTab) {
      case "dashboard": return isDono ? <Dashboard /> : <Lavagens />;
      case "lavagens": return <Lavagens />;
      case "tipos": return <TiposServicos />;
      case "usuarios": return isDono ? <Usuarios /> : <Lavagens />;
      case "agendamentos": return <Agendamentos />;
      case "planos": return <Planos />;
      case "estoque": return <Estoque />;
      case "fornecedores": return <Fornecedores />;
      case "minhaloja": return <MinhaLoja />;
      default: return <Lavagens />;
    }
  };

  return (
    <div className="admin-container">
      <Navbar />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} temAcessoAdmin={isDono} />
      <div className="main-content p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
