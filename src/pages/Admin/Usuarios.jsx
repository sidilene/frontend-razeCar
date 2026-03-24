import React, { useState, useEffect } from 'react';
import { API_BASE } from "../../services/api";
// 1. Adicionado CheckCircle, Key, Mail nas importações
import { Users, Plus, Pencil, Trash2, Save, X, AlertTriangle, Loader2, CheckCircle, Key, Mail ,  Crown } from 'lucide-react';

// Map de funções
const roleNameMap = {
  "0": "Operador",
  "1": "Administrador"
};

// --- FUNÇÃO AUXILIAR PARA FORMATAR TEXTO ---
const formatarNomeCapitalizado = (texto) => {
  return texto.replace(/\b\w/g, (l) => l.toUpperCase());
};

// --- COMPONENTE INPUT ---
const ModernInput = ({ label, name, type = "text", defaultValue, value, onChange, placeholder, required, disabled , ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-200">{label}</label>
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      {...props}
      className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState(null);
  const [funcionarioParaDeletar, setFuncionarioParaDeletar] = useState(null);
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addNome, setAddNome] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 2. Novo estado para controlar o Modal de Sucesso
  const [infoSucesso, setInfoSucesso] = useState(null);

  // Carrega usuários da API
  const loadUsersFromApi = async () => {
    try {
      const response = await fetch(`${API_BASE}/lavajatos/usuarios`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        throw new Error(erro.error || `Erro desconhecido. Status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  useEffect(() => {
    loadUsersFromApi();
  }, []);

  // Modal de edição logic
  const openEditFuncionarioModalById = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/funcionarios/${id}`, {
        method: "GET",
        credentials: "include"
      });
      if (!response.ok) throw new Error('Funcionário não encontrado');

      const data = await response.json();
      setFuncionarioParaEditar(data.funcionario);
    } catch (error) {
      alert('Erro ao carregar funcionário: ' + error.message);
      console.error(error);
    }
  };


  // Exclusão logic
  const confirmarExclusaoFuncionario = (user) => {
    if (user.tipo === "dono") return alert("Não é possível excluir o dono do lavajato.");
    setFuncionarioParaDeletar(user);
  };

  const handleDelete = async () => {
    if (!funcionarioParaDeletar || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/funcionarios/${funcionarioParaDeletar._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setFuncionarioParaDeletar(null);
        await loadUsersFromApi();
      } else {
        const erro = await response.json();
        alert("Erro ao excluir: " + (erro.error || "Erro desconhecido"));
      }
    } catch (err) {
      alert("Erro na requisição: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Edição logic
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioParaEditar || isLoading) return;

    setIsLoading(true);

    const { email, funcao } = e.target.elements;
    const dadosParaAtualizar = {
      nome: funcionarioParaEditar.nome,
      email: email.value,
      funcao: funcao.value
    };

    try {
      const response = await fetch(`${API_BASE}/funcionarios/${funcionarioParaEditar._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(dadosParaAtualizar)
      });

      if (response.ok) {
        setFuncionarioParaEditar(null);
        await loadUsersFromApi();
      } else {
        const erro = await response.json();
        alert('Erro ao atualizar funcionário: ' + (erro.error || JSON.stringify(erro)));
      }
    } catch (error) {
      alert('Erro na requisição: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Adicionar logic
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const { email, funcao } = e.target.elements;
    const emailValor = email.value.trim();

    if (!addNome || !funcao.value) {
      return alert("Preencha o nome e a função.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (funcao.value === "1") {
      if (!emailValor) return alert("O campo E-mail é OBRIGATÓRIO para administradores.");
      if (!emailRegex.test(emailValor)) return alert("E-mail inválido!");
    }

    if (funcao.value === "0" && emailValor.length > 0) {
      if (!emailRegex.test(emailValor)) return alert("O e-mail informado parece inválido.");
    }

    setIsLoading(true);

    const userData = {
      nome: addNome,
      funcao: funcao.value,
      email: emailValor || null,
      senha: "123456"
    };

    try {
      const response = await fetch(`${API_BASE}/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));

        // 1. CHECAGEM DE LIMITE (Status 403 ou flag upgrade)
        if (response.status === 403 || erro.upgrade === true) {
          setMostrarModalAdd(false); // Fecha o form de cadastro
          setShowLimitModal(true);   // Abre o modal da COROA 👑
          return; // PARA TUDO AQUI
        }

        // 2. Outros erros
        throw new Error(erro.error || erro.message || JSON.stringify(erro));
      }

      const data = await response.json();

      // --- SUCESSO ---
      if (funcao.value === "1") {
        setInfoSucesso({
          titulo: "Administrador Cadastrado!",
          mensagem: "O usuário foi criado e um convite foi enviado.",
          tipo: "admin",
          dadoExtra: emailValor
        });
      } else {
        setInfoSucesso({
          titulo: "Operador Cadastrado!",
          mensagem: "O usuário foi criado com sucesso.",
          tipo: "operador",
          dadoExtra: data.senhaPadrao || "123456"
        });
      }

      setMostrarModalAdd(false);
      setAddNome("");
      await loadUsersFromApi();

    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar usuário: " + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="usuarios" className="tab-content max-w-7xl mx-auto">
      {/* HEADER E TABELA */}
      <h2 className="text-2xl font-bold mb-6 flex items-center dark:text-gray-200">
        <Users className="mr-3 h-7 w-7 text-blue-600" /> <span>Gestão de Usuários</span>
      </h2>

      {/* ================================================= */}
      {/* MODAL DE LIMITE DE PLANO (DESIGNER IGUAL AO PDF)  */}
      {/* ================================================= */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

            {/* Cabeçalho Colorido (Amarelo igual ao seu exemplo) */}
            <div className="bg-yellow-500 p-6 flex justify-center">
              <div className="bg-white/20 p-3 rounded-full">
                {/* Usando Crown (Coroa) para indicar Nível do Plano */}
                <Crown className="text-white w-10 h-10" />
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Limite Atingido
              </h3>

              <p className="text-gray-600 font-semibold text-sm leading-relaxed whitespace-pre-line">
                Você atingiu o número máximo de funcionários permitidos no seu plano atual.
                <br /><br />
                Para adicionar mais membros à equipe, é necessário fazer um upgrade na sua conta.
              </p>


              {/* Botão "Cancelar" discreto abaixo */}
              <button
                onClick={() => setShowLimitModal(false)}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 font-medium underline decoration-transparent hover:decoration-gray-400 transition-all"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <button
          onClick={() => {
             setAddNome("");
             setMostrarModalAdd(true);
          }}
          className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center md:justify-start space-x-2 w-full md:w-auto"
        >
          <Plus /> <span>Adicionar Novo Usuário</span>
        </button>
      </div>

      {/* LISTA MOBILE */}
      <div className="md:hidden space-y-4">
        {users.map(user => (
          <div key={user._id} className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold dark:text-gray-200">{user.nome}</h3>
              {user.tipo !== "dono" && (
                <div className="flex flex-col space-y-5">
                  <button onClick={() => openEditFuncionarioModalById(user._id)} className="text-blue-600 hover:text-blue-900">
                    <Pencil className="h-5 w-9" />
                  </button>
                  <button onClick={() => confirmarExclusaoFuncionario(user)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-9" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600 font-semibold mt-1 dark:text-gray-300">{user.email}</p>
            <span className={`mt-2 inline-block px-2 py-1 text-xs font-bold rounded-full ${user.tipo === "dono" ? "bg-blue-100 text-blue-800" : user.funcao === "1" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
              {user.tipo === "dono" ? "Administrador Principal" : roleNameMap[user.funcao] || "Desconhecido"}
            </span>
          </div>
        ))}
      </div>

      {/* TABELA DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black-500 dark:text-gray-200">{user.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold dark:text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${user.tipo === "dono" ? "bg-blue-100 text-blue-800" : user.funcao === "1" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                    {user.tipo === "dono" ? "Administrador Principal" : roleNameMap[user.funcao] || "Desconhecido"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.tipo !== "dono" && (
                    <>
                      <button onClick={() => openEditFuncionarioModalById(user._id)} className="text-blue-600 hover:text-blue-900 mr-2">
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button onClick={() => confirmarExclusaoFuncionario(user)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar Usuário */}
      {mostrarModalAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-gray-800">

            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full"><Plus className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold">Novo Usuário</h3>
                    <p className="text-blue-100 text-xs">Para Usuários administradores , verificar E-mail para Login</p>
                  </div>
              </div>
              <button onClick={() => !isLoading && setMostrarModalAdd(false)} className="text-white/70 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6">
              <ModernInput
                label="Nome Completo"
                name="nome"
                required
                maxLength
                disabled={isLoading}
                placeholder="Ex: Maria Silva"
                value={addNome}
                onChange={(e) => setAddNome(formatarNomeCapitalizado(e.target.value.slice(0, 50)))}
              />
              <ModernInput label="E-mail de Acesso (opcional para Operador)" name="email" type="email" maxLength={100} placeholder="maria@email.com" disabled={isLoading}  />

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-200">Função</label>
                <div className="relative">
                   <select name="funcao" defaultValue="0" required disabled={isLoading} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700 disabled:opacity-50 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300">
                     <option value="0">Operador</option>
                     <option value="1">Administrador</option>
                   </select>
                   <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" disabled={isLoading} onClick={() => setMostrarModalAdd(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {funcionarioParaEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-800">

            <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center dark:bg-blue-700 dark:border-gray-700">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                 <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div>
                 Editar Usuário
               </h3>
               <button onClick={() => !isLoading && setFuncionarioParaEditar(null)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <ModernInput
                label="Nome"
                name="nome"
                value={funcionarioParaEditar.nome}
                required
                maxLength={50}
                disabled={isLoading}
                onChange={(e) => setFuncionarioParaEditar({
                  ...funcionarioParaEditar,
                  nome: formatarNomeCapitalizado(e.target.value)
                })}
              />
              <ModernInput
                label="Email"
                name="email"
                type="email"
                maxLength={100}
                value={funcionarioParaEditar.email || ""}
                disabled={isLoading}
                onChange={(e) => setFuncionarioParaEditar({
                  ...funcionarioParaEditar,
                  email: e.target.value
                })}

              />

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Função</label>
                <div className="relative">
                  <select
                    name="funcao"
                    value={funcionarioParaEditar.funcao || '0'}
                    disabled={true}
                    onChange={(e) => setFuncionarioParaEditar({
                      ...funcionarioParaEditar,
                      funcao: e.target.value
                    })}
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700 disabled:opacity-50 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    <option value="0">Operador</option>
                    <option value="1">Administrador</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" disabled={isLoading} onClick={() => setFuncionarioParaEditar(null)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isLoading ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {funcionarioParaDeletar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">

            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
               {isLoading ? <Loader2 className="w-8 h-8 text-red-600 animate-spin" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Confirmar Exclusão</h3>
            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
              Tem certeza que deseja remover o acesso de <strong className="text-gray-800 dark:text-gray-300">{funcionarioParaDeletar.nome}</strong>? <br/>
              <span className="text-xs text-red-500">Essa ação não pode ser desfeita.</span>
            </p>

            <div className="flex gap-3">
              <button disabled={isLoading} onClick={() => setFuncionarioParaDeletar(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 disabled:bg-red-400"
              >
                <Trash2 className="w-5 h-5" /> {isLoading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DE SUCESSO UNIFICADO (ADMIN E OPERADOR) */}
      {infoSucesso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">

            {/* Círculo com Icone */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
               <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">{infoSucesso.titulo}</h3>
            <p className="text-gray-500 mb-6">Adicionado</p>

            {/* Area de Destaque (Senha ou Email) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-center flex-col gap-2">
               {infoSucesso.tipo === 'operador' ? (
                  <>
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <Key className="w-3 h-3" /> Sucesso
                     </span>

                  </>
               ) : (
                  <>
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <Mail className="w-3 h-3" /> Enviado para
                     </span>
                     <div className="text-md font-medium text-gray-800 break-all">
                        {infoSucesso.dadoExtra}
                     </div>
                  </>
               )}
            </div>

            <button
              onClick={() => setInfoSucesso(null)}
              className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95"
            >
              Entendido, fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
