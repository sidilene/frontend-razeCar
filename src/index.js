import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';

// --- INÍCIO DA INTERCEPTAÇÃO (MONKEY PATCH) ---
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  // 1. Faz a requisição normal
  const response = await originalFetch(...args);

  // 2. Se o Backend retornou 402 (Erro no Middleware de Assinatura)
  if (response.status === 402) {

    const urlAtual = window.location.pathname;
    // Adicionei '/admin' aqui se você quiser que o admin possa ver coisas,
    // mas geralmente apenas '/planos', '/checkout' e '/login' são liberados.
    const paginasLiberadas = ['/planos', '/checkout', '/login'];

    const ehPaginaLiberada = paginasLiberadas.some(pg => urlAtual.includes(pg));

    // Se NÃO for uma página liberada, ativa o bloqueio
    if (!ehPaginaLiberada) {

      // A. Dispara o Modal de Bloqueio
      window.dispatchEvent(new CustomEvent('ASSINATURA_VENCIDA'));

      // B. O TRUQUE DE MESTRE:
      // Retornamos uma Promessa que NUNCA se resolve.
      // Isso faz com que o componente que chamou o fetch fique "carregando" para sempre
      // e nunca chegue na linha que exibe o erro "Sua assinatura está inativa".
      // Como o Modal vai cobrir a tela, o usuário não vai ver loading nenhum.
      return new Promise(() => {});
    }
  }

  return response;
};
// --- FIM DA INTERCEPTAÇÃO ---

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
