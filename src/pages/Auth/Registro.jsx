import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// 👇 Importando a biblioteca de validação
import { cpfValidator as cpf, cnpjValidator as cnpj } from '../../utils/validadores';
import { API_BASE } from "../../services/api";
import { User, Lock, Mail, Building, MapPin, FileText, CreditCard, Phone , Eye, EyeOff , AlertCircle} from "lucide-react";

const estadosBrasileiros = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

export default function Registro() {
  const [nomeLavajato, setNomeLavajato] = useState("");
  const [nomeDono, setNomeDono] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [forcaSenha, setForcaSenha] = useState(0);
  const [criteriosSenha, setCriteriosSenha] = useState({
    tamanho: false,
    maiuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  });

  const [documento, setDocumento] = useState("");
  const [estado, setEstado] = useState("");
  const [plano, setPlano] = useState("basico");
  const [modalAviso, setModalAviso] = useState({ isOpen: false, mensagem: "" });

  // --- LGPD ---
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [planoBloqueado, setPlanoBloqueado] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const planoURL = searchParams.get("plano");
    const planosValidos = ["basico", "pro", "enterprise"];

    if (planoURL && planosValidos.includes(planoURL)) {
      setPlano(planoURL);
      setPlanoBloqueado(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const bubblesContainer = document.getElementById("bubbles");
    if (!bubblesContainer) return;

    bubblesContainer.innerHTML = "";
    const bubbleCount = 20;

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement("div");
      bubble.classList.add(
        "absolute", "rounded-full", "bg-blue-500/10", "border", "border-blue-400/20", "animate-rise"
      );

      const size = Math.random() * 40 + 20;
      const duration = Math.random() * 5 + 5;
      const delay = Math.random() * 5;
      const left = Math.random() * 100;

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `${delay}s`;
      bubble.style.bottom = `-${size}px`;

      bubblesContainer.appendChild(bubble);
    }
  }, []);


  // --- VERIFICADOR DE FORÇA DE SENHA EM TEMPO REAL ---
  useEffect(() => {
    const criterios = {
      tamanho: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /\d/.test(senha),
      especial: /[^A-Za-z0-9]/.test(senha)
    };

    setCriteriosSenha(criterios);

    const forca = Object.values(criterios).filter(Boolean).length;
    setForcaSenha(forca);
  }, [senha]);

  const mostrarAviso = (mensagem) => {
    setModalAviso({ isOpen: true, mensagem });
  };

  const handleDocumentoChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }
    setDocumento(value);
  };

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");

    setTelefone(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Limpeza de dados
    const emailLimpo = email.trim();
    const documentoLimpo = documento.replace(/\D/g, '');
    const telefoneLimpo = telefone.replace(/\D/g, '');

    // 2. Validação LGPD
    if (!aceitouTermos) {
        return alert("⚠️ Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.");
    }

    // 3. Validação E-mail (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpo)) {
        return alert("❌ Por favor, insira um e-mail válido (ex: nome@exemplo.com).");
    }

    // 4. Validação CPF/CNPJ (Algoritmo)
    if (documentoLimpo.length === 11) {
        if (!cpf.isValid(documentoLimpo)) return alert("❌ O CPF informado é inválido.");
    } else if (documentoLimpo.length === 14) {
        if (!cnpj.isValid(documentoLimpo)) return alert("❌ O CNPJ informado é inválido.");
    } else {
        return alert("❌ O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).");
    }

    // 5. Outras validações

    if (senha !== confirmarSenha) {
        mostrarAviso("As senhas não coincidem.");
        return;
    }
    if (telefoneLimpo.length < 10) {
        mostrarAviso("Telefone inválido.");
        return;
    }
    if (!estado) {
        mostrarAviso("Por favor, selecione um estado.");
        return;
    }


    const dados = {
        nomeLavajato,
        nomeDono,
        email: emailLimpo,
        telefone,
        senha,
        estado,
        cpfCnpj: documentoLimpo,
        plano,
        aceitouTermos: true
    };

    try {
      const resposta = await fetch(`${API_BASE}/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        // Tenta fazer parse se for JSON
        try {
            const erroObj = JSON.parse(erro);
            throw new Error(erroObj.error || "Erro desconhecido");
        } catch(e) {
            throw new Error(erro || "Erro no servidor");
        }
      }

      const dadosResposta = await resposta.json();
        const { user, message } = dadosResposta;

        // 2. Salva no LocalStorage usando a chave correta 'lavajato_id'
        if (user) {
            localStorage.setItem('lavajato_id', user.id);  // <-- Aqui está a correção
            localStorage.setItem('user_plano', user.plano);

            // Opcional: Salvar o nome também ajuda a exibir "Olá, [Nome]" na Dashboard
            if (user.nome) {
                localStorage.setItem('lavajato_nome', user.nome);
            }
        }

      alert("✅ Cadastro realizado com sucesso!");
      navigate("/");

    } catch (erro) {
      console.error("❌ Erro ao cadastrar:", erro);
      alert("Falha ao cadastrar: " + erro.message);
    }
  };

  const inputClass = "w-full pl-12 pr-4 py-3 border-2 border-[#ddeeff] rounded-[10px] bg-[#f7fbff] text-[#1e3c72] placeholder-[#1e3c72]/50 focus:outline-none focus:border-[#00aaff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,170,255,0.2)] transition relative z-10";

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#1800ad] font-poppins overflow-hidden py-10">

      <form
        onSubmit={handleRegister}
        className="relative bg-white rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-[40px_30px] w-full max-w-[380px] z-10 overflow-hidden"
      >
        <div id="bubbles" className="absolute inset-0 pointer-events-none z-0"></div>

        <div className="relative z-10">
            <h2 className="text-center text-2xl font-bold text-[#1e3c72] flex items-center justify-center gap-2 mb-8">
            <i className="fas fa-car text-[#00aaff] text-2xl"></i> RazeCar Registro
            </h2>

            {/* Inputs existentes... */}
            <div className="relative mb-4">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <input type="text" placeholder="Nome do Lava-Jato" value={nomeLavajato} onChange={(e) => setNomeLavajato(e.target.value)} required maxLength={100} className={inputClass} />
            </div>

            <div className="relative mb-4">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <input type="text" placeholder="CPF ou CNPJ" value={documento} onChange={handleDocumentoChange} required maxLength={18} className={inputClass} />
            </div>

            <div className="relative mb-4">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <select value={estado} onChange={(e) => setEstado(e.target.value)} required className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="" disabled>Selecione o Estado</option>
                {estadosBrasileiros.map((uf) => (<option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>))}
            </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1e3c72]/50 z-20">▼</div>
            </div>

            <div className="relative mb-4">
            <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20 ${planoBloqueado ? "opacity-50" : ""}`} size={20} />
            <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                required
                disabled={planoBloqueado}
                className={`${inputClass} appearance-none
                ${planoBloqueado
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300 focus:border-gray-300 focus:shadow-none"
                    : "cursor-pointer"}`
                }
            >
                <option value="basico">Plano Básico</option>
                <option value="pro">Plano Profissional</option>
                <option value="enterprise">Plano Enterprise</option>
            </select>

            {!planoBloqueado && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1e3c72]/50 z-20">▼</div>
            )}

            {planoBloqueado && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-20">
                    <Lock size={16} />
                </div>
            )}
            </div>

            <div className="relative mb-4">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <input type="text" placeholder="Nome do Proprietário" value={nomeDono} onChange={(e) => setNomeDono(e.target.value)} required maxLength={100} className={inputClass} />
            </div>

            <div className="relative mb-4">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} required maxLength={150} className={inputClass} />
            </div>

            <div className="relative mb-4">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
            <input
                type="tel"
                placeholder="Telefone / WhatsApp"
                value={telefone}
                onChange={handleTelefoneChange}
                required
                maxLength={15}
                className={inputClass}
            />
            </div>

            {/* ========================================== */}
            {/* CAMPO DE SENHA COM MEDIDOR DE FORÇA E OLHINHO */}
            {/* ========================================== */}
            <div className="relative mb-2">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                maxLength={100}
                className={inputClass}
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
            {senha.length > 0 && (
              <div className="mb-4 px-1 relative z-20">
                <div className="flex gap-1 h-1.5 mb-2">
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 4 ? 'bg-[#00aaff]' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${forcaSenha >= 5 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>

                <ul className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.tamanho ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="text-[12px]">{criteriosSenha.tamanho ? '✓' : '○'}</span> Mín. 8 caracteres
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.maiuscula ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="text-[12px]">{criteriosSenha.maiuscula ? '✓' : '○'}</span> Letra Maiúscula
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.minuscula ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="text-[12px]">{criteriosSenha.minuscula ? '✓' : '○'}</span> Letra Minúscula
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.numero ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="text-[12px]">{criteriosSenha.numero ? '✓' : '○'}</span> Um Número
                  </li>
                  <li className={`flex items-center gap-1 transition-colors ${criteriosSenha.especial ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="text-[12px]">{criteriosSenha.especial ? '✓' : '○'}</span> Símbolo (ex: #, @, $, !)
                  </li>
                </ul>
              </div>
            )}

            {/* ========================================== */}
            {/* CAMPO DE CONFIRMAR SENHA (TBM COM OLHINHO) */}
            {/* ========================================== */}
            <div className={`relative ${senha.length > 0 ? 'mb-6' : 'mb-6 mt-4'}`}>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007acc] z-20" size={20} />
              <input
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                maxLength={100}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#007acc] hover:text-[#00aaff] z-20 transition"
              >
                {mostrarConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* --- CHECKBOX LGPD E TERMOS --- */}
            <div className="relative mb-6 flex items-start gap-2 z-20">
                <input
                    type="checkbox"
                    id="termos"
                    checked={aceitouTermos}
                    onChange={(e) => setAceitouTermos(e.target.checked)}
                    className="mt-1 w-4 h-4 cursor-pointer accent-[#00aaff]"
                />
                <label htmlFor="termos" className="text-xs text-[#1e3c72] leading-tight cursor-pointer">
                    Li e concordo com os <a href="./termos" target="_blank" rel="noreferrer" className="text-[#00aaff] font-bold hover:underline">Termos de Uso</a> e a <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[#00aaff] font-bold hover:underline">Política de Privacidade</a>, autorizando o tratamento dos meus dados.
                </label>
            </div>

            <button type="submit" className="w-full py-3 rounded-[10px] bg-[linear-gradient(90deg,#FF7A00,#e06a00)] text-white font-semibold shadow-[0_5px_15px_rgba(0,122,204,0.4)] hover:shadow-[0_8px_20px_rgba(0,122,204,0.6)] hover:-translate-y-[3px] transition relative z-20 cursor-pointer">
            Cadastrar
            </button>

            <div className="text-center mt-6">
            <a href="/" className="text-[#007acc] hover:underline text-sm relative z-20">Já tem uma conta? Entrar</a>
            </div>
        </div>
      </form>
      {/* ========================================== */}
      {/* MODAL DE AVISO (SUBSTITUTO DO ALERT) */}
      {/* ========================================== */}
      {modalAviso.isOpen && (
        <div
          className="fixed inset-0 bg-[#000000aa] backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
          onClick={() => setModalAviso({ isOpen: false, mensagem: "" })}
        >
          {/* Caixa do Modal */}
          <div
            className="bg-white rounded-2xl p-6 max-w-[320px] w-full shadow-2xl transform transition-all flex flex-col items-center text-center animate-bounce"
            onClick={(e) => e.stopPropagation()} // Impede que o clique dentro da caixa feche o modal
            style={{ animation: 'popIn 0.3s ease-out forwards' }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <AlertCircle className="text-red-500" size={32} />
            </div>

            <h3 className="text-xl font-bold text-[#1e3c72] mb-2">
              Atenção
            </h3>

            <p className="text-gray-600 mb-6 text-sm">
              {modalAviso.mensagem}
            </p>

            <button
              onClick={() => setModalAviso({ isOpen: false, mensagem: "" })}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-bold shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:-translate-y-1 transition-all"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

       <style>{`
          @keyframes rise {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateX(5px) scale(1.1); }
            100% { transform: translateY(-600px) scale(0.5); opacity: 0; }
          }
          .animate-rise {
            animation-name: rise;
            animation-timing-function: ease-in;
            animation-iteration-count: infinite;
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
