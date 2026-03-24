import React, { useState, useEffect } from 'react';
import { API_BASE } from "../../services/api";
import {
  Truck, Plus, Pencil, Trash2, Save, X,
  AlertTriangle, Loader2, CheckCircle,
  Phone, Mail
} from 'lucide-react';

// --- FUNÇÕES AUXILIARES DE MÁSCARA ---

const mascaraCNPJ = (valor) => {
  if (!valor) return "";
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const mascaraTelefone = (valor) => {
  if (!valor) return "";
  let v = valor.replace(/\D/g, "");
  // Formato (99) 99999-9999
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v.slice(0, 15);
};



const formatarNomeCapitalizado = (texto) => {
  if (!texto) return "";
  return texto.replace(/\b\w/g, (l) => l.toUpperCase());
};

// --- COMPONENTE INPUT (Reutilizado) ---
const ModernInput = ({ label, name, type = "text", value, onChange, placeholder, required, disabled }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-200">{label}</label>
    <div className="relative">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorParaEditar, setFornecedorParaEditar] = useState(null);
  const [fornecedorParaDeletar, setFornecedorParaDeletar] = useState(null);
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário de Adição
  const [addNome, setAddNome] = useState("");
  const [addCnpj, setAddCnpj] = useState("");
  const [addTelefone, setAddTelefone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addCategoria, setAddCategoria] = useState("");
  const [addEndereco, setAddEndereco] = useState("");

  const [infoSucesso, setInfoSucesso] = useState(null);

  // Carrega Fornecedores da API
  const loadFornecedores = async () => {
    try {
      const response = await fetch(`${API_BASE}/fornecedores`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao carregar lista");

      const data = await response.json();
      setFornecedores(data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  // --- DELETE ---
  const handleDelete = async () => {
    if (!fornecedorParaDeletar || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/fornecedores/${fornecedorParaDeletar._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setFornecedorParaDeletar(null);
        await loadFornecedores();
      } else {
        alert("Erro ao excluir fornecedor.");
      }
    } catch (err) {
      alert("Erro na requisição: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADICIONAR ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!addNome || !addTelefone) return alert("Nome e Telefone são obrigatórios.");

    setIsLoading(true);

    const dados = {
      nome: addNome,
      cnpj: addCnpj, // Envia formatado ou limpo, depende da sua preferencia. Vou enviar formatado para visualização
      telefone: addTelefone,
      email: addEmail,
      categoria: addCategoria,
      endereco: addEndereco
    };

    try {
      const response = await fetch(`${API_BASE}/fornecedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dados)
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.error || "Erro ao salvar");
      }

      setInfoSucesso({
        titulo: "Fornecedor Cadastrado!",
        mensagem: "O novo parceiro foi adicionado à lista.",
        dadoExtra: addNome
      });

      setMostrarModalAdd(false);
      // Limpa formulário
      setAddNome("");
      setAddCnpj("");
      setAddTelefone("");
      setAddEmail("");
      setAddCategoria("");
      setAddEndereco("");

      await loadFornecedores();

    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EDITAR ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!fornecedorParaEditar || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/fornecedores/${fornecedorParaEditar._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(fornecedorParaEditar)
      });

      if (response.ok) {
        setFornecedorParaEditar(null);
        await loadFornecedores();
      } else {
        alert('Erro ao atualizar fornecedor.');
      }
    } catch (error) {
      alert('Erro na requisição: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const abrirModalNovo = () => {
    // Limpa o "lixo" antigo
    setAddNome("");
    setAddCnpj("");
    setAddTelefone("");
    setAddEmail("");
    setAddCategoria("");
    setAddEndereco("");

    // Abre o modal novinho em folha
    setMostrarModalAdd(true);
  };

  return (
    <div id="fornecedores" className="tab-content max-w-7xl mx-auto">

      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-6 flex items-center dark:text-gray-200">
        <Truck className="mr-3 h-7 w-7 text-blue-600" /> <span>Gestão de Fornecedores</span>
      </h2>

      {/* BARRA DE AÇÕES */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={abrirModalNovo}
          className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 w-full md:w-auto shadow-lg shadow-blue-600/20"
        >
          <Plus /> <span>Novo Fornecedor</span>
        </button>

        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 min-w-max">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><Truck className="w-4 h-4"/></div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Parceiros</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{fornecedores.length}</p>
                </div>
            </div>
        </div>
      </div>

      {/* LISTA MOBILE (CARDS) */}
      <div className="md:hidden space-y-4">
        {fornecedores.map(forn => (
          <div key={forn._id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 dark:bg-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-base font-bold dark:text-gray-200">{forn.nome}</h3>
                {forn.categoria && (
                   <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md dark:bg-gray-700 dark:text-gray-300">
                     {forn.categoria}
                   </span>
                )}
              </div>
              <div className="flex flex-col gap-3 pl-2">
                <button onClick={() => setFornecedorParaEditar(forn)} className="text-blue-600 hover:text-blue-900">
                  <Pencil className="h-5 w-5" />
                </button>
                <button onClick={() => setFornecedorParaDeletar(forn)} className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
               <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4  text-gray-400"/> {forn.telefone}
               </div>
               {forn.email && (
                 <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4  text-gray-400"/> {forn.email}
                 </div>
               )}
               {forn.cnpj && (
                 <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold">CNPJ:</span> {forn.cnpj}
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* TABELA DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Fornecedor</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Contato</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Categoria</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {fornecedores.map(forn => (
              <tr key={forn._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{forn.nome}</div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{forn.cnpj || "Sem CNPJ"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400"/> {forn.telefone}
                   </div>
                   {forn.email && (
                     <div className="text-base text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-gray-400"/> {forn.email}
                     </div>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                    {forn.categoria || "Geral"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setFornecedorParaEditar(forn)} className="text-blue-600 hover:text-blue-900 mr-4 transition transform hover:scale-110">
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button onClick={() => setFornecedorParaDeletar(forn)} className="text-red-600 hover:text-red-900 transition transform hover:scale-110">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL ADICIONAR */}
      {mostrarModalAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-gray-800">
                <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full"><Truck className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-lg font-bold">Novo Fornecedor</h3>
                        <p className="text-blue-100 text-xs">Cadastre um parceiro comercial</p>
                    </div>
                </div>
                <button onClick={() => !isLoading && setMostrarModalAdd(false)} className="text-white/70 hover:text-white transition">
                    <X className="w-6 h-6" />
                </button>
                </div>

                <form onSubmit={handleAddSubmit} className="p-6">
                  {/* Linha 1 */}
                  <ModernInput label="Nome da Empresa / Pessoa" name="nome" required disabled={isLoading} maxLength={100} placeholder="Ex: Distribuidora Silva" value={addNome} onChange={(e) => setAddNome(formatarNomeCapitalizado(e.target.value).slice(0, 100))} />

                  {/* Linha 2 */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                       <ModernInput
                          label="CNPJ (Opcional)"
                          name="cnpj"
                          maxLength={20}
                          placeholder="00.000.000/0000-00"
                          disabled={isLoading}
                          value={addCnpj}
                          onChange={(e) => setAddCnpj(mascaraCNPJ(e.target.value).slice(0, 20))}
                       />
                    </div>
                    <div className="flex-1">
                       <ModernInput
                          label="Telefone/Zap *"
                          name="telefone"
                          required
                          maxLength={20}
                          placeholder="(99) 99999-9999"
                          disabled={isLoading}
                          value={addTelefone}
                          onChange={(e) => setAddTelefone(mascaraTelefone(e.target.value))}
                       />
                    </div>
                  </div>

                  {/* Linha 3 */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                        <ModernInput label="Email" name="email" type="email" maxLength={100} placeholder="contato@empresa.com" disabled={isLoading} value={addEmail} onChange={(e) => setAddEmail(e.target.value.slice(0, 100))} />
                    </div>
                    <div className="flex-1">
                         <ModernInput label="Categoria" name="categoria" maxLength={50} placeholder="Ex: Produtos,Peças" disabled={isLoading} value={addCategoria} onChange={(e) => setAddCategoria(formatarNomeCapitalizado(e.target.value).slice(0, 50))} />
                    </div>
                  </div>

                  {/* Linha 4 */}
                  <ModernInput label="Endereço" name="endereco" maxLength={250} placeholder="Rua, Número, Bairro..." disabled={isLoading} value={addEndereco} onChange={(e) => setAddEndereco(e.target.value.slice(0, 250))} />

                  <div className="flex gap-3 pt-4">
                    <button type="button" disabled={isLoading} onClick={() => setMostrarModalAdd(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Salvar
                    </button>
                  </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {fornecedorParaEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-800">
                <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center dark:bg-blue-700 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div>
                    Editar Fornecedor
                </h3>
                <button onClick={() => !isLoading && setFornecedorParaEditar(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleEditSubmit} className="p-6">
                    <ModernInput label="Nome" name="nome" value={fornecedorParaEditar.nome} required disabled={isLoading} maxLength={50} onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, nome: formatarNomeCapitalizado(e.target.value).slice(0, 100)})} />

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <ModernInput
                                label="CNPJ"
                                name="cnpj"
                                value={fornecedorParaEditar.cnpj || ""}
                                disabled={isLoading}
                                onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, cnpj: mascaraCNPJ(e.target.value).slice(0, 20)})}
                            />
                        </div>
                        <div className="flex-1">
                            <ModernInput
                                label="Telefone"
                                name="telefone"
                                value={fornecedorParaEditar.telefone}
                                required
                                disabled={isLoading}
                                onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, telefone: mascaraTelefone(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <ModernInput label="Email" name="email" value={fornecedorParaEditar.email || ""} disabled={isLoading} onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, email: e.target.value.slice(0, 100)})} />
                        </div>
                        <div className="flex-1">
                             <ModernInput label="Categoria" name="categoria" value={fornecedorParaEditar.categoria || ""} disabled={isLoading} onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, categoria: formatarNomeCapitalizado(e.target.value).slice(0, 50)})} />
                        </div>
                    </div>

                    <ModernInput label="Endereço" name="endereco" value={fornecedorParaEditar.endereco || ""} disabled={isLoading} onChange={(e) => setFornecedorParaEditar({...fornecedorParaEditar, endereco: e.target.value.slice(0, 250)})} />

                    <div className="flex gap-3 pt-4">
                        <button type="button" disabled={isLoading} onClick={() => setFornecedorParaEditar(null)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Atualizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL EXCLUIR (Idêntico ao Estoque) */}
      {fornecedorParaDeletar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isLoading ? <Loader2 className="w-8 h-8 text-red-600 animate-spin" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Remover Fornecedor?</h3>
                <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
                    Deseja remover <strong className="text-gray-800 dark:text-gray-300">{fornecedorParaDeletar.nome}</strong>? <br/>
                    <span className="text-xs text-red-500">Se houver produtos vinculados, verifique antes.</span>
                </p>
                <div className="flex gap-3">
                    <button disabled={isLoading} onClick={() => setFornecedorParaDeletar(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50">Cancelar</button>
                    <button onClick={handleDelete} disabled={isLoading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 disabled:bg-red-400">
                        <Trash2 className="w-5 h-5" /> Excluir
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL SUCESSO */}
      {infoSucesso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{infoSucesso.titulo}</h3>
                <p className="text-gray-500 mb-6">{infoSucesso.mensagem}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-center flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Parceiro
                    </span>
                    <div className="text-lg font-bold text-blue-600 break-all">
                        {infoSucesso.dadoExtra}
                    </div>
                </div>
                <button onClick={() => setInfoSucesso(null)} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95">
                    Concluir
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
