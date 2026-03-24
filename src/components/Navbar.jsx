import React, { useState, useEffect } from "react";
import ThemeToggle from './ThemeToggle';
import { API_BASE } from "../services/api";

export default function Navbar() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Estados para o Modal de Edição ---
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    nomeLavajato: "",
    email: "",
    telefone: ""
  });
  const [saving, setSaving] = useState(false);

  // --- NOVO: Estados para Deletar Conta ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE}/lavajatos/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal
        });

        if (response.ok) {
          const dados = await response.json();
          if (dados) {

            // 1. Pegamos o nome de quem realmente logou (Admin ou Dono)
            const nomeExibicao = dados.usuario?.nome || "Usuário";

            // Seta o estado do usuário (guardando o cargo também para usar depois)
            setUsuario({
              nome: nomeExibicao,
              cargo: dados.usuario?.cargo,
              plano: dados.lavajato?.plano || "FREE"

            });

            // 2. Preenchemos o modal com os dados mistos (Empresa + Contato do Usuário)
            setFormData({
              id: dados.lavajato?._id, // ID da empresa para o PUT
              nomeLavajato: dados.lavajato?.nomeLavajato || "",
              email: dados.usuario?.email || "", // E-mail de quem logou
              telefone: dados.lavajato?.telefone || ""
            });

            // Salva o e-mail correto no storage
            if (dados.usuario?.email) {
              localStorage.setItem('user_email', dados.usuario.email);
            }
          }
        } else {
          setUsuario(null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Erro ao buscar dados:", error);
          setUsuario(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
    return () => controller.abort();
  }, []);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!formData.id) {
      alert("Erro: ID não encontrado. Recarregue a página.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/lavajatos/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nomeLavajato: formData.nomeLavajato,
          email: formData.email,
          telefone: formData.telefone
        })
      });

      if (response.ok) {
        setUsuario({ nome: formData.nomeLavajato });
        setShowModal(false);

        const dadosAtuais = JSON.parse(localStorage.getItem('dados_lavajato') || '{}');
        localStorage.setItem('dados_lavajato', JSON.stringify({
           ...dadosAtuais,
           nome: formData.nomeLavajato,
           telefone: formData.telefone,
           email: formData.email
        }));

        alert("Dados atualizados com sucesso!");
      } else {
        const err = await response.json();
        alert(`Erro: ${err.error || "Falha ao atualizar"}`);
      }
    } catch (error) {
      console.error("Erro na atualização:", error);
      alert("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault(); // Opcional se chamado programaticamente
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      localStorage.removeItem('user_email');
      localStorage.removeItem('dados_lavajato'); // Limpa tudo
      window.location.href = "/"; // Ou rota de login
    }
  };

    // --- NOVO: Handler para Deletar Conta ---
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/deletar-conta`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senhaConfirmacao: deletePassword })
      });

      // --- NOVA LÓGICA DE TRATAMENTO ---
      const contentType = response.headers.get("content-type");

      if (response.ok) {
        alert("Conta excluída com sucesso.");
        handleLogout(null);
      } else {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          alert(data.error || "Erro ao excluir");
        } else {
          // Se cair aqui, é porque o servidor mandou um HTML (Erro 404 ou 500 fatal)
          const textError = await response.text();
          console.error("Erro bruto do servidor:", textError);
          alert(`Erro crítico (${response.status}): Rota não encontrada ou erro no servidor.`);
        }
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setDeleting(false);
    }
  };

    const getPlanStyles = (plano) => {
    switch (plano?.toUpperCase()) {
      case 'PRO':
        return 'bg-amber-500 text-white border-amber-600'; // Dourado para Pro
      case 'PREMIUM':
        return 'bg-purple-600 text-white border-purple-700'; // Roxo para Premium
      default:
        return 'bg-gray-500 text-white border-gray-600'; // Cinza para Free/Outros
    }
  };



  return (
    <>
      <header className="bg-[#1800ad] shadow-md sticky top-0 z-20 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center space-x-3">
            {usuario && (
              <button
                onClick={() => setShowModal(true)}
                className="ml-3 p-1 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                title="Editar meus dados"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-pen">
                  <path d="M11.5 15H7a4 4 0 0 0-4 4v2"/>
                  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
                  <circle cx="10" cy="7" r="4"/>
                </svg>
              </button>
            )}
            <h1 className="text-base md:text-2xl font-bold text-white dark:text-gray-100 transition-colors">
              {usuario?.nome || "RazeCar Admin"}
            </h1>

          </div>

          {/* User Area */}
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>

            <div className="flex items-center gap-3">
              {loading ? (
                <div className="animate-pulse flex items-center gap-2">
                   <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   {usuario && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                   )}

                   <span className="font-semibold text-white dark:text-gray-200">
                     Conectado
                   </span>
                </div>
              )}

              <span className="text-gray-300 dark:text-gray-600">|</span>
              <a href="/login" onClick={handleLogout} className="font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ">
                Sair
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL DE EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                 {/* MUDANÇA AQUI: Título dinâmico */}
                 {usuario?.cargo === 'DONO' ? 'Editar Lava Jato' : 'Seus Dados'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">

              {/* TAG DO PLANO DENTRO DO FORM */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano:</span>
                {usuario?.plano && (
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border shadow-sm ${getPlanStyles(usuario.plano)}`}>
                    {usuario.plano}
                  </span>
                )}
              </div>

              {/* 👇 BOTÃO MUDAR PLANO (APENAS WEB) 👇 */}
              {usuario?.cargo === 'DONO' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    window.location.href = "/planos";
                  }}
                  className="w-full mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 py-2 rounded-md text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  ⭐ Mudar ou Atualizar Plano
                </button>
              )}

              {/* MUDANÇA AQUI: Só mostra o Nome do Lava Jato se for DONO */}
              {usuario?.cargo === 'DONO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Lava Jato</label>
                  <input type="text" name="nomeLavajato" maxLength={100} value={formData.nomeLavajato} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input type="email" name="email" maxLength={100} value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>

              {/* MUDANÇA AQUI: Só mostra o Telefone se for DONO */}
              {usuario?.cargo === 'DONO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input type="text" name="telefone" maxLength={20} value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2">{saving ? "Salvando..." : "Salvar Alterações"}</button>
              </div>
            </form>

            {/* MUDANÇA AQUI: Só mostra a Zona de Perigo (Excluir Conta) se for DONO */}
            {usuario?.cargo === 'DONO' && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                 <h3 className="text-sm font-bold text-red-600 uppercase mb-2">Zona de Perigo</h3>
                 <button
                   type="button"
                   onClick={() => {
                     setShowModal(false);
                     setShowDeleteModal(true);
                   }}
                   className="w-full py-2 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                 >
                   Excluir minha conta permanentemente
                 </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- NOVO: Modal de Confirmação de Exclusão --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 border-2 border-red-500">
              <h2 className="text-xl font-bold text-red-600 mb-2">Excluir Conta?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                Esta ação apagará <strong>todos</strong> os dados do Lava Jato, funcionários e configurações. Isso não pode ser desfeito.
              </p>

              <form onSubmit={handleDeleteAccount}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Digite sua senha para confirmar
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Sua senha atual"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                   <button
                     type="button"
                     onClick={() => {
                       setShowDeleteModal(false);
                       setDeletePassword(""); // Limpa senha ao cancelar
                     }}
                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                   >
                     Cancelar
                   </button>
                   <button
                     type="submit"
                     disabled={deleting}
                     className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                   >
                     {deleting ? "Excluindo..." : "Sim, Excluir Conta"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </>
  );
}
