import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Crown, CreditCard,
  RefreshCw, ShieldCheck, ArrowLeft, Loader2
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

// URL do seu Backend
import { API_BASE } from "../../services/api";

export default function PlanosWeb() {
  const navigate = useNavigate();
  const isDark = true; // Ajuste conforme seu contexto de tema

  const [loading, setLoading] = useState(true);
  const [loadingPagamento, setLoadingPagamento] = useState(null);
  const [modoCobranca, setModoCobranca] = useState(false);
  const [planoDoUsuario, setPlanoDoUsuario] = useState(null);

  // NOVO ESTADO: Controle Mensal / Anual (Começa no mensal)
  const [isAnual, setIsAnual] = useState(false);

  // CORES
  const themeClasses = {
    bg: isDark ? "bg-gray-900" : "bg-gray-100",
    surface: isDark ? "bg-gray-800" : "bg-white",
    text: isDark ? "text-gray-50" : "text-gray-900",
    textSecondary: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-700" : "border-gray-200",
    inputBg: isDark ? "bg-gray-700" : "bg-gray-50",
  };

  // DADOS ATUALIZADOS COM OS DOIS PREÇOS (Anual = 10x o Mensal)
  const DADOS_PLANOS = {
    basico: {
      nome: "Iniciante",
      precoMensal: "89,90",
      precoAnual: "899,00",
      recursos: ["1 Usuário administrador", "3 Funcionários", "Acompanhamento", "Agendamento", "Auto-Agendamento", "Cadastro de Serviços", "Histórico de Clientes", "Até 80 Lavagens por mês", "Relatórios"],
      destaque: false
    },
    pro: {
      nome: "Profissional",
      precoMensal: "110,00",
      precoAnual: "1100,00",
      recursos: ["2 Usuários admins", "10 Funcionários", "Lavagens ilimitadas", "Acompanhamento", "Agendamento", "Auto-Agendamento", "Cadastro de Serviços", "Histórico de Clientes", "Relatórios", "Recibo"],
      destaque: true
    },
    enterprise: {
      nome: "Rede",
      precoMensal: "179,00",
      precoAnual: "1790,00",
      recursos: ["3 Usuários administradores", "Até 15 Funcionários", "Lavagens ilimitadas", "Acompanhamento", "Agendamento", "Auto-Agendamento", "Cadastro de Serviços", "Histórico Completo", "Relatórios", "Recibo"],
      destaque: false
    }
  };

  useEffect(() => {
    verificarStatusUsuario();
  }, []);

  const verificarStatusUsuario = async () => {
    try {
      const response = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('Erro ao buscar usuário');

      const usuario = await response.json();

      if (usuario.assinatura && usuario.assinatura.status === 'vencido') {
         setPlanoDoUsuario('pro');
         setModoCobranca(true);
      }

    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (key, metodoPagamento) => {
    setLoadingPagamento(key);

    try {
      const payload = {
        // Envia YEARLY se a chave isAnual for true, senão MONTHLY
        ciclo: isAnual ? 'YEARLY' : 'MONTHLY',
        formaPagamento: metodoPagamento,
        planoKey: key,
      };

      console.log(`🚀 Iniciando checkout ${key} via ${metodoPagamento} (${payload.ciclo})...`);

      const response = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
             alert("Sessão expirada. Faça login novamente.");
             window.location.href = '/login';
             return;
        }

        throw new Error(errorData.error || "Erro ao processar pagamento.");
      }

      const data = await response.json();
      console.log("✅ Sucesso:", data);

      const { invoiceUrl, sucesso } = data;

      if (sucesso && invoiceUrl) {
        window.location.href = invoiceUrl;
      } else {
        alert("O sistema criou a assinatura, mas não retornou o link.");
      }

    } catch (error) {
      console.error("💥 Erro:", error);
      alert(error.message || "Erro de conexão.");
    } finally {
      setLoadingPagamento(null);
    }
  };

  const CardPlano = ({ planoKey, plano }) => {
    const isPro = plano.destaque;
    const isSelected = loadingPagamento === planoKey;

    // Pega o preço baseado no toggle atual
    const precoAtual = isAnual ? plano.precoAnual : plano.precoMensal;
    const textoPeriodo = isAnual ? "por ano" : "por mês";

    return (
      <div className={`relative rounded-xl p-6 transition-all duration-300 shadow-lg flex flex-col h-full ${themeClasses.surface} ${isPro ? "border-2 border-blue-600 transform hover:-translate-y-1 scale-100 md:scale-105 z-10" : `border ${themeClasses.border} hover:border-blue-400`}`}>
        {isPro && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            RECOMENDADO
          </div>
        )}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold ${themeClasses.text}`}>{plano.nome}</h3>
            <span className={`text-xs ${themeClasses.textSecondary}`}>{textoPeriodo}</span>
          </div>
          <div className={`text-2xl font-bold ${isPro ? "text-blue-500" : themeClasses.text}`}>
            R$ {precoAtual}
          </div>
        </div>

        <div className={`h-px w-full my-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

        <ul className="space-y-3 mb-8 flex-1">
          {plano.recursos.map((rec, i) => (
            <li key={i} className="flex items-center">
              <CheckCircle size={18} className={`mr-3 flex-shrink-0 ${isPro ? "text-blue-500" : "text-green-500"}`} />
              <span className={`text-sm ${themeClasses.textSecondary}`}>{rec}</span>
            </li>
          ))}
        </ul>

        {/* --- BOTÕES DE PAGAMENTO --- */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => handleCheckout(planoKey, 'PIX')}
            disabled={isSelected}
            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105
              bg-emerald-600 hover:bg-emerald-700 text-white shadow-md
              ${isSelected ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isSelected ? <Loader2 className="animate-spin" size={18}/> : (
              <>
                <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-sans">Px</div>
                Pagar com PIX
              </>
            )}
          </button>

          <button
            onClick={() => handleCheckout(planoKey, 'CREDIT_CARD')}
            disabled={isSelected}
            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105
              ${isPro ? "bg-blue-600 hover:bg-blue-700 text-white" : `${themeClasses.inputBg} ${themeClasses.text} hover:bg-gray-200 dark:hover:bg-gray-600 border ${themeClasses.border}`}
              ${isSelected ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isSelected ? <Loader2 className="animate-spin" size={18}/> : (
              <>
                <CreditCard size={18} />
                Cartão de Crédito
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg}`}>
      {/* NAVBAR */}
      <nav className={`h-16 w-full flex items-center px-4 border-b ${themeClasses.surface} ${themeClasses.border}`}>
        <span className={`font-bold ${themeClasses.text}`}>Pagamento</span>
      </nav>

      {/* SUB-HEADER */}
      <div className={`px-6 py-6 border-b ${themeClasses.surface} ${themeClasses.border}`}>
        <div className="max-w-6xl mx-auto flex items-center">
          <button onClick={() => navigate('/admin')} className={`mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition ${themeClasses.text}`}>
            <ArrowLeft size={24} />
          </button>
          <div className={`p-2 rounded-full mr-3 ${isDark ? 'bg-gray-700' : 'bg-indigo-100'}`}>
            {modoCobranca ? <RefreshCw size={24} className="text-red-600" /> : <Crown size={24} className="text-amber-500" />}
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>{modoCobranca ? "Renovação" : "Planos"}</h1>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {modoCobranca && planoDoUsuario ? (
            <div className="flex justify-center mt-10">
              <div className={`w-full max-w-md rounded-xl p-8 shadow-2xl border-t-4 border-red-600 text-center ${themeClasses.surface}`}>
                <div className="bg-red-100 dark:bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw size={40} className="text-red-600 animate-spin" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>Assinatura Pendente</h2>
                <p className={`mb-6 ${themeClasses.textSecondary}`}>Regularize seu plano <span className="font-bold text-red-500">{DADOS_PLANOS[planoDoUsuario].nome}</span>.</p>
                <div className={`text-4xl font-bold mb-8 ${themeClasses.text}`}>R$ {isAnual ? DADOS_PLANOS[planoDoUsuario].precoAnual : DADOS_PLANOS[planoDoUsuario].precoMensal}</div>

                <div className="flex flex-col gap-3 w-full mb-4">
                  <button
                    onClick={() => handleCheckout(planoDoUsuario, 'PIX')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition transform hover:-translate-y-1"
                    disabled={loadingPagamento === planoDoUsuario}
                  >
                    {loadingPagamento === planoDoUsuario ? <Loader2 className="animate-spin" /> : <> Pagar com PIX</>}
                  </button>

                  <button
                    onClick={() => handleCheckout(planoDoUsuario, 'CREDIT_CARD')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition transform hover:-translate-y-1"
                    disabled={loadingPagamento === planoDoUsuario}
                  >
                    {loadingPagamento === planoDoUsuario ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Pagar com Cartão</>}
                  </button>
                </div>

                <button onClick={() => setModoCobranca(false)} className={`text-sm underline hover:text-blue-500 ${themeClasses.textSecondary}`}>Quero alterar meu plano</button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className={`text-lg mb-6 ${themeClasses.textSecondary}`}>Escolha o plano ideal para escalar o seu negócio.</p>

                {/* --- TOGGLE MENSAL / ANUAL --- */}
                <div className="flex justify-center mb-8">
                  <div className={`p-1 rounded-full flex items-center ${themeClasses.inputBg} border ${themeClasses.border}`}>
                    <button
                      onClick={() => setIsAnual(false)}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${!isAnual ? 'bg-blue-600 text-white shadow-md' : themeClasses.textSecondary}`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => setIsAnual(true)}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${isAnual ? 'bg-blue-600 text-white shadow-md' : themeClasses.textSecondary}`}
                    >
                      Anual
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isAnual ? 'bg-white text-blue-600' : 'bg-green-500 text-white'}`}>
                        2 meses OFF
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {Object.entries(DADOS_PLANOS).map(([key, plano]) => (<CardPlano key={key} planoKey={key} plano={plano} />))}
              </div>
              <div className="flex items-center justify-center mt-12 opacity-70 gap-2">
                <ShieldCheck size={16} className={themeClasses.textSecondary} />
                <span className={`text-sm ${themeClasses.textSecondary}`}>Pagamento 100% Seguro</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
