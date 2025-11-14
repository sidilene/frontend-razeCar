import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Páginas públicas
import Login from "./pages/Auth/Login";
import Registro from "./pages/Auth/Registro";

// Página administrativa
import Admin from "./pages/Admin/admin";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Registro />} />

        {/* Rota interna */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
