import React from 'react';
import { Navigate } from 'react-router-dom';



const RotaPrivada = ({ children }) => {
  // Tenta pegar o ID ou Token
  const usuarioLogado = localStorage.getItem('lavajato_id');

  // Se NÃO tiver ID, manda pro Login imediatamente
  if (!usuarioLogado) {
    return <Navigate to="/" replace />;
  }

  // Se tiver, mostra o conteúdo (a Dashboard)
  return children;
};

export default RotaPrivada;
