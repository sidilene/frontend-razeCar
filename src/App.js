import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Páginas públicas
import Login from "./pages/Auth/Login";
import Registro from "./pages/Auth/Registro";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";


// Página pública do cliente final (agendamento)
import AgendamentosUsers from "./pages/Admin/AgendamentosUsers";

// Páginas restritas (precisam de login)
import Admin from "./pages/Admin/admin";
import Planos from "./pages/Admin/Planos";

// Componentes de Segurança
import RotaPrivada from "./components/RotaPrivada";
import { BloqueioAssinatura } from "./components/BloqueioAssinatura";

export default function App() {
  return (
    <Router>
      {/* O Bloqueio fica DENTRO do Router para poder usar navigate()
         e verificar a URL atual
      */}
      <BloqueioAssinatura />

      <Routes>
        {/* --- ROTAS PÚBLICAS (Qualquer um acessa) --- */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Registro />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/definir-senha" element={<ResetPassword />} />
        <Route path="/termos" element={<TermosDeUso />} />
        <Route path="/privacidade" element={<PoliticaPrivacidade />} />

        {/* Importante: O agendamento do cliente DEVE ser público */}
        <Route path="/agendar/:slug" element={<AgendamentosUsers />} />


        {/* --- ROTAS PRIVADAS (Só acessa com Login/LocalStorage) --- */}

        {/* Dashboard do Admin */}
        <Route
          path="/admin"
          element={
            <RotaPrivada>
              <Admin />
            </RotaPrivada>
          }
        />

        {/* Tela de Pagamento/Planos */}
        <Route
          path="/planos"
          element={
            <RotaPrivada>
              <Planos />
            </RotaPrivada>
          }
        />

      </Routes>
    </Router>
  );
}
