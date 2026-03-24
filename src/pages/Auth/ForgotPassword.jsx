import React, { useEffect, useState } from "react";
import { API_BASE } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Estado para controlar o botão

  // Lógica para a criação das bolhas animadas
  useEffect(() => {
    const bubblesContainer = document.querySelector(".bubbles");
    if (!bubblesContainer) return;

    bubblesContainer.innerHTML = "";
    const bubbleCount = 30;

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement("div");
      bubble.classList.add("bubble");

      const size = Math.random() * 60 + 50;
      const duration = Math.random() * 5 + 5;
      const delay = Math.random() * 5;
      const left = Math.random() * 100;

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `${delay}s`;

      bubblesContainer.appendChild(bubble);
    }
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();

    if (!email) {
      alert("Por favor, preencha o campo de e-mail.");
      return;
    }

    setLoading(true); // Bloqueia o botão

    try {
      // ✅ ROTA CORRIGIDA: /esqueci-senha (Rota Pública)
      const resposta = await fetch(`${API_BASE}/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        alert("✅ " + (dados.message || "E-mail enviado! Verifique sua caixa de entrada."));
        navigate("/login");
      } else {
        alert("⚠️ " + (dados.error || "Algo deu errado. Tente novamente."));
      }
    } catch (erro) {
      alert("Erro de conexão: " + erro.message);
    } finally {
      setLoading(false); // Libera o botão
    }
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center font-poppins bg-[#1800ad]">

      {/* Container Principal */}
      <div className="login-container relative bg-white p-[40px_30px] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-[380px] overflow-hidden z-10">

        {/* Container das Bolhas de Fundo */}
        <div className="bubbles absolute bottom-0 left-0 w-full h-full -z-10 pointer-events-none"></div>

        <form onSubmit={handleForgotPassword}>
          {/* Título */}
          <h2 className="flex justify-center items-center gap-2 text-[#1e3c72] font-bold text-[1.5rem] mb-2 text-center">
            <i className="fas fa-key text-[#00aaff] text-[1.5rem]"></i>
            Recuperar Senha
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Informe seu e-mail para receber as instruções de recuperação.
          </p>

          {/* Campo de E-mail */}
          <div className="input-group relative mb-5">
            <i className="fas fa-envelope icon absolute left-[15px] top-1/2 -translate-y-1/2 text-[#007acc]"></i>
            <input
              type="email"
              name="email"
              placeholder="Seu e-mail cadastrado"
              onInput={(e) => e.target.value = e.target.value.toLowerCase()}
              required
              maxLength={150}
              className="w-full pl-[50px] py-[15px] border-[2px] border-[#ddeeff] rounded-[10px] text-[#1e3c72] bg-[#f7fbff] text-[16px] focus:outline-none focus:border-[#00aaff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,170,255,0.2)] transition-all"
            />
          </div>

          {/* Botão de Envio */}
          <button
            disabled={loading}
            className={`w-full py-[15px] bg-[linear-gradient(90deg,#FF7A00,#e06a00)] text-white font-semibold text-[18px] rounded-[10px] shadow-[0_5px_15px_rgba(0,122,204,0.4)] transition-all
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_8px_20px_rgba(0,122,204,0.6)] hover:-translate-y-[3px]'}
            `}
          >
            {loading ? "Enviando..." : "Enviar Instruções"}
          </button>

          {/* Link para Login */}
          <div className="extra-links text-center mt-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[#007acc] text-[14px] hover:underline"
            >
              Lembrou? Voltar para o Login
            </button>
          </div>
        </form>
      </div>

      {/* Styles das bolhas */}
      <style>{`
        .bubble {
          position: absolute;
          bottom: -100px;
          border-radius: 50%;
          background: rgba(0, 170, 255, 0.2);
          border: 1px solid rgba(255,255,255,0.3);
          opacity: 0;
          animation: rise 10s infinite ease-in;
        }
        @keyframes rise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translate(10px) scale(1.2); }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
