import React, { useEffect, useState } from "react";
import { API_BASE } from "../../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pega o token direto da URL
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    novaSenha: "",
    confirmarSenha: ""
  });

  // 👇 ESTADO NOVO: Detecta se é celular
  const [isMobile, setIsMobile] = useState(false);

  // O link do Expo com seu IP atual
  const deepLinkApp = `exp://192.168.1.68:8081/--/definir-senha?token=${token}`;

  // --- NOVOS ESTADOS: SEGURANÇA E VISIBILIDADE ---
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [forcaSenha, setForcaSenha] = useState(0);
  const [criteriosSenha, setCriteriosSenha] = useState({
    tamanho: false, maiuscula: false, minuscula: false, numero: false, especial: false
  });

  // --- ESTADO DO MODAL (Com suporte a Sucesso e Redirecionamento) ---
  const [modalAviso, setModalAviso] = useState({ isOpen: false, mensagem: "", tipo: "erro", acao: null });

  const mostrarAviso = (mensagem, tipo = "erro", acao = null) => {
    setModalAviso({ isOpen: true, mensagem, tipo, acao });
  };

  // 👇 EFEITO NOVO: Checa se está no celular logo que a página carrega
  useEffect(() => {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      setIsMobile(true);
    }
  }, []);

  // Animação das bolhas (Seu código original)
  useEffect(() => {
    const bubblesContainer = document.querySelector(".bubbles");
    if (!bubblesContainer) return;
    bubblesContainer.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const bubble = document.createElement("div");
      bubble.classList.add("bubble");
      const size = Math.random() * 60 + 50;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.animationDuration = `${Math.random() * 5 + 5}s`;
      bubble.style.animationDelay = `${Math.random() * 5}s`;
      bubblesContainer.appendChild(bubble);
    }
  }, []);

  // Se não tiver token na URL
  useEffect(() => {
    if (!token) {
      alert("Link inválido ou incompleto.");
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    const senha = passwords.novaSenha;
    const criterios = {
      tamanho: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /\d/.test(senha),
      especial: /[^A-Za-z0-9]/.test(senha)
    };

    setCriteriosSenha(criterios);
    setForcaSenha(Object.values(criterios).filter(Boolean).length);
  }, [passwords.novaSenha]);

  // Função de salvar a senha (Seu código original)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.novaSenha.length < 8) {
      mostrarAviso("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (passwords.novaSenha !== passwords.confirmarSenha) {
      mostrarAviso("As senhas não coincidem!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/definir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          novaSenha: passwords.novaSenha
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Modal verde de sucesso, e passa o navigate para rodar só quando fechar o modal
        mostrarAviso(data.message || "Senha criada com sucesso!", "sucesso", () => navigate("/admin"));
      } else {
        mostrarAviso(data.error || "Token inválido ou expirado.");
      }
    } catch (error) {
      mostrarAviso("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center font-poppins bg-[#1800ad]">

      <div className="login-container relative bg-white p-[40px_30px] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-[380px] overflow-hidden z-10">
        <div className="bubbles absolute bottom-0 left-0 w-full h-full -z-10 pointer-events-none"></div>

        {/* 👇 LÓGICA CONDICIONAL: Mostra App ou Formulário Web */}
        {isMobile ? (

          <div className="text-center">
             <h2 className="flex justify-center items-center gap-2 text-[#1e3c72] font-bold text-[1.5rem] mb-6 text-center">
              <i className="fas fa-mobile-alt text-[#00aaff]"></i>
              Abrir no Celular
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Para redefinir sua senha, abra nosso aplicativo para uma melhor experiência.
            </p>

            <a
              href={deepLinkApp}
              className="block w-full py-[15px] mb-4 bg-[linear-gradient(90deg,#00aaff,#005f99)] text-white font-semibold text-[18px] rounded-[10px] shadow-lg hover:-translate-y-[3px] hover:shadow-xl transition-all"
            >
              ABRIR NO APP 📱
            </a>

            <button
              onClick={() => setIsMobile(false)}
              className="text-[#00aaff] text-sm hover:underline bg-transparent border-none cursor-pointer"
            >
              Ou continue pelo navegador web
            </button>
          </div>

        ) : (

          // 👇 SEU FORMULÁRIO ORIGINAL PARA QUEM ESTÁ NO COMPUTADOR
          <form onSubmit={handleSubmit}>
            <h2 className="flex justify-center items-center gap-2 text-[#1e3c72] font-bold text-[1.5rem] mb-6 text-center">
              <i className="fas fa-lock-open text-[#00aaff]"></i>
              Criar Nova Senha
            </h2>

            <p className="text-center text-sm text-gray-500 mb-6">
              Defina sua nova senha de acesso ao sistema.
            </p>

            {/* ========================================== */}
            {/* INPUT NOVA SENHA (COM OLHINHO E MEDIDOR) */}
            {/* ========================================== */}
            <div className="relative mb-2">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Nova Senha"
                required
                maxLength={100}
                className="w-full pl-[50px] pr-[50px] py-[15px] border-2 border-[#ddeeff] rounded-[10px] text-[#1e3c72] bg-[#f7fbff] outline-none focus:border-[#00aaff] focus:bg-white transition-all relative z-10"
                value={passwords.novaSenha}
                onChange={(e) => setPasswords({...passwords, novaSenha: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#007acc] hover:text-[#00aaff] z-20 transition"
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* --- MEDIDOR DE FORÇA DE SENHA --- */}
            {passwords.novaSenha.length > 0 && (
              <div className="mb-4 px-1 relative z-20">
                <div className="flex gap-1 h-1.5 mb-2">
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 4 ? 'bg-[#00aaff]' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 5 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>

                <ul className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-left">
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.tamanho ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span>{criteriosSenha.tamanho ? '✓' : '○'}</span> Mín. 8 caracteres
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.maiuscula ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span>{criteriosSenha.maiuscula ? '✓' : '○'}</span> Maiúscula
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.minuscula ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span>{criteriosSenha.minuscula ? '✓' : '○'}</span> Minúscula
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.numero ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span>{criteriosSenha.numero ? '✓' : '○'}</span> Um Número
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.especial ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span>{criteriosSenha.especial ? '✓' : '○'}</span> Símbolo (ex: #, @)
                  </li>
                </ul>
              </div>
            )}

            {/* ========================================== */}
            {/* INPUT CONFIRMAR SENHA (COM OLHINHO) */}
            {/* ========================================== */}
            <div className={`relative ${passwords.novaSenha.length > 0 ? 'mb-6' : 'mb-6 mt-4'}`}>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
              <input
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder="Confirmar Senha"
                required
                maxLength={100}
                className="w-full pl-[50px] pr-[50px] py-[15px] border-2 border-[#ddeeff] rounded-[10px] text-[#1e3c72] bg-[#f7fbff] outline-none focus:border-[#00aaff] focus:bg-white transition-all relative z-10"
                value={passwords.confirmarSenha}
                onChange={(e) => setPasswords({...passwords, confirmarSenha: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#007acc] hover:text-[#00aaff] z-20 transition"
              >
                {mostrarConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              disabled={loading}
              className={`w-full py-[15px] bg-[linear-gradient(90deg,#FF7A00,#e06a00)] text-white font-semibold text-[18px] rounded-[10px] shadow-lg transition-all
                ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-[3px] hover:shadow-xl'}`}
            >
              {loading ? "Salvando..." : "Salvar e Entrar"}
            </button>
          </form>

        )}

        {/* ========================================== */}
      {/* MODAL DE AVISO (SUCESSO / ERRO) */}
      {/* ========================================== */}
      {modalAviso.isOpen && (
        <div
          className="fixed inset-0 bg-[#000000aa] backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
          onClick={() => {
            if (modalAviso.acao) modalAviso.acao();
            setModalAviso({ isOpen: false, mensagem: "", tipo: "erro", acao: null });
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[320px] w-full shadow-2xl transform transition-all flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'popIn 0.3s ease-out forwards' }}
          >
            {modalAviso.tipo === "sucesso" ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle className="text-green-500" size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertCircle className="text-red-500" size={32} />
              </div>
            )}

            <h3 className={`text-xl font-bold mb-2 ${modalAviso.tipo === "sucesso" ? "text-green-600" : "text-[#1e3c72]"}`}>
              {modalAviso.tipo === "sucesso" ? "Sucesso!" : "Atenção"}
            </h3>

            <p className="text-gray-600 mb-6 text-sm">
              {modalAviso.mensagem}
            </p>

            <button
              onClick={() => {
                if (modalAviso.acao) modalAviso.acao();
                setModalAviso({ isOpen: false, mensagem: "", tipo: "erro", acao: null });
              }}
              className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg hover:-translate-y-1 ${
                modalAviso.tipo === "sucesso"
                  ? "bg-green-500 hover:bg-green-600 shadow-[0_4px_10px_rgba(34,197,94,0.4)]"
                  : "bg-red-500 hover:bg-red-600 shadow-[0_4px_10px_rgba(239,68,68,0.4)]"
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      </div>

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
          @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `
      }</style>
    </div>
  );
}
