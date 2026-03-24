import React, { useEffect , useState } from "react";
import { API_BASE } from "../../services/api";
import { useNavigate } from "react-router-dom";
import razeLogo from "../../assets/logo.png";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Criação das bolhas animadas
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

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const senha = e.target.password.value;

    if (!email || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const resposta = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json().catch(() => ({}));



      if (resposta.ok) {

        localStorage.setItem('lavajato_id', dados.id || dados._id);

        localStorage.setItem('user_plano', dados.plano);


          //////////////////
        if (dados.detalhesLavajato) {
            localStorage.setItem('dados_lavajato', JSON.stringify(dados.detalhesLavajato));
        } else {
            // Fallback: Se não vier do back, limpa para não usar dados antigos de outro login
            localStorage.removeItem('dados_lavajato');
        }
       ///////////////////////
        // Opcional: Salvar dados básicos do usuário (nome, função) para mostrar no Header
        localStorage.setItem('user_info', JSON.stringify(dados.user));
        // ✅ Login bem-sucedido
        const funcaoNum = Number(dados.user.funcao);
        alert(`✅ Bem-vindo(a), ${dados.user.nome}!`);

        if (funcaoNum === 0) navigate("/home");
        else if (funcaoNum === 1) navigate("/admin");
        else alert("Função desconhecida.");
      } else {
        alert("Falha no login: " + (dados.error || "Erro desconhecido"));
      }
    } catch (erro) {
      alert("Erro ao tentar fazer login: " + erro.message);
    }
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center font-poppins bg-[#1800ad]">
      <div className="login-container relative bg-white p-[40px_30px] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-[380px] overflow-hidden z-10">
        <div className="bubbles absolute bottom-0 left-0 w-full h-full -z-10 pointer-events-none"></div>

        <form onSubmit={handleLogin}>
          <h2 className="flex justify-center items-center gap-2 text-[#1e3c72] font-bold text-[1.5rem] mb-8">
            <i className="fas fa-car text-[#00aaff] text-[1.5rem]"></i>
            RazeCar Login
            <img
            src={razeLogo}
            alt="Raze Logo"
            className="w-10 h-10 rounded-lg shadow-md mb-6 object-cover"
          />
          </h2>

          <div className="input-group relative mb-5">
            <i className="fas fa-user icon absolute left-[15px] top-1/2 -translate-y-1/2 text-[#007acc]"></i>
            <input
              type="email"
              name="email"
              placeholder="Seu e-mail"
              onInput={(e) => e.target.value = e.target.value.toLowerCase()}
              required
              maxLength={150}
              className="w-full pl-[50px] py-[15px] border-[2px] border-[#ddeeff] rounded-[10px] text-[#1e3c72] bg-[#f7fbff] text-[16px] focus:outline-none focus:border-[#00aaff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,170,255,0.2)] transition-all"
            />
          </div>

          <div className="input-group relative mb-5">
            <i className="fas fa-lock icon absolute left-[15px] top-1/2 -translate-y-1/2 text-[#007acc]"></i>
            <input
              type={showPassword ? "text" : "password"} // Muda dinamicamente o tipo
              name="password"
              placeholder="Sua senha"
              required
              maxLength={100}
              // Adicionei pr-[50px] aqui para o texto não ficar em cima do ícone do olho
              className="w-full pl-[50px] pr-[50px] py-[15px] border-[2px] border-[#ddeeff] rounded-[10px] text-[#1e3c72] bg-[#f7fbff] text-[16px] focus:outline-none focus:border-[#00aaff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,170,255,0.2)] transition-all"
            />
            {/* Botão de revelar senha */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#007acc] hover:text-[#005f9e] transition-colors focus:outline-none"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20}  />}
            </button>
          </div>

          <button className="w-full py-[15px] bg-[linear-gradient(90deg,#FF7A00,#e06a00)] text-white font-semibold text-[18px] rounded-[10px] shadow-[0_5px_15px_rgba(0,122,204,0.4)] hover:shadow-[0_8px_20px_rgba(0,122,204,0.6)] hover:-translate-y-[3px] transition-all">
            Entrar
          </button>

          <div className="extra-links text-center mt-8">
            <button
              type="button"
              onClick={() => navigate("/recuperar-senha")}
              className="text-[#007acc] text-[14px] hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="extra-links text-center mt-2">
            <button
              type="button"
              onClick={() => navigate("/cadastro")}
              className="text-[#007acc] text-[14px] hover:underline"
            >
              Não tem uma conta? Registre-se
            </button>
          </div>
        </form>
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
      `}</style>
    </div>
  );
}
