import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const FeedbackContext = createContext(null);

const CONFIG_POR_TIPO = {
  sucesso: {
    tituloPadrao: "Sucesso!",
    icone: CheckCircle,
    corIcone: "text-green-600",
    corFundoIcone: "bg-green-100",
    corBotao: "bg-green-600 hover:bg-green-700 shadow-green-600/20",
  },
  erro: {
    tituloPadrao: "Ops, algo deu errado",
    icone: XCircle,
    corIcone: "text-red-600",
    corFundoIcone: "bg-red-100",
    corBotao: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
  },
  aviso: {
    tituloPadrao: "Atenção",
    icone: AlertTriangle,
    corIcone: "text-yellow-600",
    corFundoIcone: "bg-yellow-100",
    corBotao: "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20",
  },
  info: {
    tituloPadrao: "Aviso",
    icone: Info,
    corIcone: "text-blue-600",
    corFundoIcone: "bg-blue-100",
    corBotao: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
  },
};

export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState(null);
  // feedback = { mensagem, tipo, titulo } | null

  // showFeedback(mensagem, tipo, titulo, aoFechar)
  // "aoFechar" é opcional: roda depois que o usuário clica em "Entendido"
  // (útil pra quando antes o código dependia do alert() travar a tela,
  // ex: navigate() só depois que o usuário vê a mensagem de sucesso)
  const showFeedback = useCallback((mensagem, tipo = "erro", titulo, aoFechar) => {
    const tipoValido = CONFIG_POR_TIPO[tipo] ? tipo : "erro";
    setFeedback({
      mensagem: String(mensagem ?? ""),
      tipo: tipoValido,
      titulo: titulo || CONFIG_POR_TIPO[tipoValido].tituloPadrao,
      aoFechar: typeof aoFechar === "function" ? aoFechar : null,
    });
  }, []);

  const fecharFeedback = useCallback(() => {
    setFeedback((atual) => {
      if (atual?.aoFechar) atual.aoFechar();
      return null;
    });
  }, []);

  return (
    <FeedbackContext.Provider value={{ showFeedback, fecharFeedback }}>
      {children}
      {feedback && (
        <FeedbackModal
          mensagem={feedback.mensagem}
          tipo={feedback.tipo}
          titulo={feedback.titulo}
          onClose={fecharFeedback}
        />
      )}
    </FeedbackContext.Provider>
  );
}

function FeedbackModal({ mensagem, tipo, titulo, onClose }) {
  const { icone: Icone, corIcone, corFundoIcone, corBotao } = CONFIG_POR_TIPO[tipo];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-20 h-20 ${corFundoIcone} rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm`}>
          <Icone className={`w-10 h-10 ${corIcone}`} />
        </div>

        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{titulo}</h3>
        <p className="text-gray-500 dark:text-gray-300 mb-8 whitespace-pre-line">{mensagem}</p>

        <button
          onClick={onClose}
          autoFocus
          className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 ${corBotao}`}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback precisa ser usado dentro de um <FeedbackProvider>");
  }
  return ctx;
}
