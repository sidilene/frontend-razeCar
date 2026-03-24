import React, { useState, useEffect } from 'react';
/* eslint-disable react/prop-types */
import { API_BASE } from "../../services/api";
import {
  Package, Plus, Pencil, Trash2, Save, X,
  AlertTriangle, Loader2, CheckCircle,
  TrendingDown, AlertOctagon,  Minus, Truck
} from 'lucide-react';

// --- FUNÇÕES AUXILIARES ---
const formatarMoeda = (valor) => {
  return new window.Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

const formatarNomeCapitalizado = (texto) => {
  return texto.replace(/\b\w/g, (l) => l.toUpperCase());
};

const mascaraMoeda = (valor) => {
  if (!valor) return "";
  let v = valor.toString();
  v = v.replace(/\D/g, "");
  const valorFormatado = new window.Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(v) / 100);
  return valorFormatado;
};

const limparMoeda = (valorString) => {
  if (!valorString) return 0;
  const apenasDigitos = valorString.toString().replace(/\D/g, "");
  return Number(apenasDigitos) / 100;
};

// --- COMPONENTE INPUT (Reutilizado) ---
const ModernInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  step,
  maxLength, // 👈 Adicione isso
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-200">
      {label}
    </label>
    <div className="relative">
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength} // 👈 Adicione isso
        {...props}
        className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

// --- NOVO: COMPONENTE SELECT (Para Fornecedores) ---
// --- COMPONENTE SELECT (Para Fornecedores) ---
const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  disabled,
  placeholder
}) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-200">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:bg-slate-700 dark:border-gray-700 dark:text-gray-300 appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder || "Selecione..."}</option>
        {/* Proteção para caso options seja undefined */}
        {options && options.length > 0 && options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.nome}
          </option>
        ))}
      </select>

      {/* Ícone de seta */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  </div>
);

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]); // --- NOVO: Lista de fornecedores

  const [produtoParaEditar, setProdutoParaEditar] = useState(null);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState(null);
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário de Adição
  const [addNome, setAddNome] = useState("");
  const [addQtd, setAddQtd] = useState("");
  const [addMinimo, setAddMinimo] = useState("");
  const [addValor, setAddValor] = useState("");
  const [addFornecedor, setAddFornecedor] = useState(""); // --- NOVO: Estado para fornecedor selecionado

  const [infoSucesso, setInfoSucesso] = useState(null);

  // Carrega Estoque da API
  const loadEstoqueFromApi = async () => {
    try {
      const response = await fetch(`${API_BASE}/estoque`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao carregar estoque");
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    }
  };

  // --- NOVO: Carrega Fornecedores da API ---
  const loadFornecedores = async () => {
    try {
      const response = await fetch(`${API_BASE}/fornecedores`, { // Certifique-se que essa rota existe
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setFornecedores(data);
      }
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  }

  useEffect(() => {
    loadEstoqueFromApi();
    loadFornecedores(); // Carrega a lista ao iniciar
  }, []);

  const handleQuickUpdate = async (produto, delta) => {
    if (isLoading) return;
    const novaQuantidade = produto.quantidade + delta;
    if (novaQuantidade < 0) return;

    setIsLoading(true);

    const dadosAtualizados = {
        nome: produto.nome,
        quantidade: novaQuantidade,
        minimo: produto.minimo,
        valor: produto.valor,
        fornecedor: produto.fornecedor // Mantém o fornecedor atual
    };

    try {
        const response = await fetch(`${API_BASE}/estoque/${produto._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify(dadosAtualizados)
        });

        if (response.ok) {
            await loadEstoqueFromApi();
        }
    } catch (error) {
        console.error("Erro de requisição:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const openEditModal = (produto) => {
    const valorFormatado = mascaraMoeda(produto.valor.toFixed(2));

    // --- LÓGICA DO FORNECEDOR ---
    // Se o backend retornou o objeto fornecedor populado (ex: { _id: "...", nome: "..." }), pegamos o _id.
    // Se retornou null ou undefined, usamos string vazia.
    const fornecedorId = produto.fornecedor && produto.fornecedor._id
        ? produto.fornecedor._id
        : (produto.fornecedor || "");

    setProdutoParaEditar({
        ...produto,
        valor: valorFormatado,
        fornecedor: fornecedorId
    });
  };

  const confirmarExclusao = (produto) => {
    setProdutoParaDeletar(produto);
  };

  const handleDelete = async () => {
    if (!produtoParaDeletar || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/estoque/${produtoParaDeletar._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setProdutoParaDeletar(null);
        await loadEstoqueFromApi();
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!addNome || !addQtd) return alert("Preencha o nome e a quantidade.");

    setIsLoading(true);

    const produtoData = {
      nome: addNome,
      quantidade: Number(addQtd),
      minimo: Number(addMinimo) || 5,
      valor: limparMoeda(addValor),
      fornecedor: addFornecedor || null // --- Envia o ID do fornecedor
    };

    try {
      const response = await fetch(`${API_BASE}/estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(produtoData)
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.error || JSON.stringify(erro));
      }

      setInfoSucesso({
        titulo: "Produto Adicionado!",
        mensagem: "O item foi inserido no estoque com sucesso.",
        dadoExtra: addNome
      });

      setMostrarModalAdd(false);
      setAddNome("");
      setAddQtd("");
      setAddMinimo("");
      setAddValor("");
      setAddFornecedor(""); // Limpa fornecedor
      await loadEstoqueFromApi();

    } catch (error) {
      alert("Erro ao adicionar produto: " + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!produtoParaEditar || isLoading) return;
    setIsLoading(true);

    const dadosParaAtualizar = {
      nome: produtoParaEditar.nome,
      quantidade: Number(produtoParaEditar.quantidade),
      minimo: Number(produtoParaEditar.minimo),
      valor: limparMoeda(produtoParaEditar.valor),
      fornecedor: produtoParaEditar.fornecedor || null // --- Envia o ID atualizado
    };

    try {
      const response = await fetch(`${API_BASE}/estoque/${produtoParaEditar._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(dadosParaAtualizar)
      });

      if (response.ok) {
        setProdutoParaEditar(null);
        await loadEstoqueFromApi();
      } else {
        const erro = await response.json();
        alert('Erro ao atualizar: ' + (erro.error || JSON.stringify(erro)));
      }
    } catch (error) {
      alert('Erro na requisição: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

    const limitarNumero = (valor) => {
    let num = parseInt(valor, 10);
    if (isNaN(num) || num < 0) return "";
    if (num > 999999) return "999999";
    return String(num);
  };

  return (
    <div id="estoque" className="tab-content max-w-7xl mx-auto">

      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-6 flex items-center dark:text-gray-200">
        <Package className="mr-3 h-7 w-7 text-blue-600" /> <span>Controle de Estoque</span>
      </h2>

      {/* BARRA DE AÇÕES */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() => {
             setAddNome("");
             setAddQtd("");
             setAddMinimo("5");
             setAddValor("");
             setAddFornecedor(""); // Resetar fornecedor
             setMostrarModalAdd(true);
          }}
          className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 w-full md:w-auto shadow-lg shadow-blue-600/20"
        >
          <Plus /> <span>Novo Produto</span>
        </button>

        {/* Resumo Rápido */}
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 min-w-max">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><Package className="w-4 h-4"/></div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Itens</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{produtos.length}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 min-w-max">
                <div className="bg-red-50 text-red-600 p-2 rounded-full"><AlertOctagon className="w-4 h-4"/></div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Estoque Baixo</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">
                        {produtos.filter(p => p.quantidade <= p.minimo).length}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* LISTA MOBILE */}
      <div className="md:hidden space-y-4">
        {produtos.map(prod => {
          const isLowStock = prod.quantidade <= prod.minimo;
          return (
            <div key={prod._id} className={`bg-white p-4 rounded-lg shadow-md border-l-4 dark:bg-gray-800 ${isLowStock ? 'border-red-500' : 'border-green-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold dark:text-gray-200">{prod.nome}</h3>
                    <p className="text-sm text-gray-500">{formatarMoeda(prod.valor)} / un</p>
                    {/* Exibe o fornecedor se existir */}
                    {prod.fornecedor && (
                        <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                            <Truck className="w-3 h-3"/> {prod.fornecedor.nome}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-3 pl-2">
                  <button onClick={() => openEditModal(prod)} className="text-blue-600 hover:text-blue-900">
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button onClick={() => confirmarExclusao(prod)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                 {/* CONTROLE QUANTIDADE MOBILE */}
                 <div className="text-center flex flex-col items-center">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Atual</p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleQuickUpdate(prod, -1)}
                            disabled={isLoading}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 active:scale-95 transition shadow-sm disabled:opacity-50 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                        >
                            <Minus className="w-4 h-4"/>
                        </button>
                        <span className={`text-lg font-bold w-6 text-center ${isLowStock ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                            {prod.quantidade}
                        </span>
                        <button
                            onClick={() => handleQuickUpdate(prod, 1)}
                            disabled={isLoading}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition shadow-sm disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4"/>
                        </button>
                    </div>
                 </div>

                 <div className="text-center border-l border-gray-200 pl-4">
                    <p className="text-xs text-gray-500 font-bold uppercase">Mínimo</p>
                    <span className="text-lg font-bold text-gray-400">{prod.minimo}</span>
                 </div>

                 <div className="text-center border-l border-gray-200 pl-4">
                      {isLowStock ?
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Repor</span> :
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">OK</span>
                      }
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABELA DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Produto</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Valor Un.</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Quantidade</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {produtos.map(prod => {
               const isLowStock = prod.quantidade <= prod.minimo;
               return (
                <tr key={prod._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Package className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{prod.nome}</div>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-300">Min: {prod.minimo}</span>
                            {/* Mostra nome do fornecedor se existir */}
                            {prod.fornecedor && (
                                <span className="text-xs text-blue-500 flex items-center gap-1 font-medium">
                                    • {prod.fornecedor.nome}
                                </span>
                            )}
                        </div>
                        </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium dark:text-gray-300">
                        {formatarMoeda(prod.valor)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => handleQuickUpdate(prod, -1)}
                                disabled={isLoading}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30"
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <span className={`inline-block w-12 text-center py-1 rounded-lg text-sm font-bold ${isLowStock ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-slate-600 dark:text-white dark:border-slate-500'}`}>
                                {prod.quantidade}
                            </span>

                            <button
                                onClick={() => handleQuickUpdate(prod, 1)}
                                disabled={isLoading}
                                className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-30"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isLowStock ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 items-center gap-1 justify-center w-full max-w-[100px] mx-auto">
                                <TrendingDown className="w-3 h-3" /> Baixo
                            </span>
                        ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 items-center gap-1 justify-center w-full max-w-[100px] mx-auto">
                                <CheckCircle className="w-3 h-3" /> Normal
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(prod)} className="text-blue-600 hover:text-blue-900 mr-4 transition transform hover:scale-110">
                            <Pencil className="h-5 w-5" />
                        </button>
                        <button onClick={() => confirmarExclusao(prod)} className="text-red-600 hover:text-red-900 transition transform hover:scale-110">
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL ADICIONAR */}
      {mostrarModalAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-gray-800">
                <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full"><Package className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-lg font-bold">Novo Produto</h3>
                        <p className="text-blue-100 text-xs">Adicione itens ao inventário</p>
                    </div>
                </div>
                <button onClick={() => !isLoading && setMostrarModalAdd(false)} className="text-white/70 hover:text-white transition">
                    <X className="w-6 h-6" />
                </button>
                </div>

                <form onSubmit={handleAddSubmit} className="p-6">
                <ModernInput label="Nome do Produto" name="nome" required disabled={isLoading} placeholder="Ex: Cera Automotiva" value={addNome} maxLength={50} // 👈 Limite visual
                onChange={(e) => setAddNome(formatarNomeCapitalizado(e.target.value.slice(0, 50)))} />

                {/* --- SELEÇÃO DE FORNECEDOR (ADD) --- */}
                <ModernSelect
                    label="Fornecedor"
                    value={addFornecedor}
                    onChange={(e) => setAddFornecedor(e.target.value)}
                    options={fornecedores}
                    disabled={isLoading}
                    placeholder="Sem Fornecedor (Opcional)"
                />

                <div className="flex gap-4">
                    <div className="flex-1">
                        <ModernInput label="Qtd. Atual" name="qtd" type="number" required disabled={isLoading} placeholder="0" value={addQtd} max="999999" // 👈 Limite nas setinhas
                         onChange={(e) => setAddQtd(limitarNumero(e.target.value))} />
                    </div>
                    <div className="flex-1">
                        <ModernInput label="Estoque Min." name="minimo" type="number" required disabled={isLoading} placeholder="5" value={addMinimo} max="999999"
                          onChange={(e) => setAddMinimo(limitarNumero(e.target.value))} />
                    </div>
                </div>

                <ModernInput
                    label="Valor Unitário"
                    name="valor"
                    type="tel"
                    disabled={isLoading}
                    placeholder="R$ 0,00"
                    value={addValor}
                    maxLength={15} // Limite de tamanho da string de dinheiro
                    onChange={(e) => setAddValor(mascaraMoeda(e.target.value.slice(0, 15)))}
                />

                <div className="flex gap-3 pt-2">
                    <button type="button" disabled={isLoading} onClick={() => setMostrarModalAdd(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {isLoading ? "Salvando..." : "Salvar"}
                    </button>
                </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {produtoParaEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-800">
                <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center dark:bg-blue-700 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div>
                    Editar Produto
                </h3>
                <button onClick={() => !isLoading && setProdutoParaEditar(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-6">
                <ModernInput label="Nome do Produto" name="nome" value={produtoParaEditar.nome} required disabled={isLoading} onChange={(e) => setProdutoParaEditar({...produtoParaEditar, nome: formatarNomeCapitalizado(e.target.value)})} />

                {/* --- SELEÇÃO DE FORNECEDOR (EDIT) --- */}
                <ModernSelect
                    label="Fornecedor"
                    value={produtoParaEditar.fornecedor || ""} // Garante que não quebre se for null
                    onChange={(e) => setProdutoParaEditar({...produtoParaEditar, fornecedor: e.target.value})}
                    options={fornecedores}
                    disabled={isLoading}
                    placeholder="Sem Fornecedor (Opcional)"
                />

                <div className="flex gap-4">
                    <div className="flex-1">
                        <ModernInput label="Quantidade" name="quantidade" type="number" value={produtoParaEditar.quantidade} required disabled={isLoading} onChange={(e) => setProdutoParaEditar({...produtoParaEditar, quantidade: e.target.value})} />
                    </div>
                    <div className="flex-1">
                        <ModernInput label="Mínimo Alerta" name="minimo" type="number" value={produtoParaEditar.minimo} required disabled={isLoading} onChange={(e) => setProdutoParaEditar({...produtoParaEditar, minimo: e.target.value})} />
                    </div>
                </div>

                <ModernInput
                    label="Valor Unitário"
                    name="valor"
                    type="tel"
                    value={produtoParaEditar.valor}
                    disabled={isLoading}
                    onChange={(e) => setProdutoParaEditar({...produtoParaEditar, valor: mascaraMoeda(e.target.value)})}
                />

                <div className="flex gap-3 pt-2">
                    <button type="button" disabled={isLoading} onClick={() => setProdutoParaEditar(null)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:bg-blue-400">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Atualizar
                    </button>
                </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL EXCLUIR E MODAL SUCESSO (Mantidos iguais ao original) */}
      {produtoParaDeletar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isLoading ? <Loader2 className="w-8 h-8 text-red-600 animate-spin" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Remover Produto?</h3>
                <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
                    Deseja remover <strong className="text-gray-800 dark:text-gray-300">{produtoParaDeletar.nome}</strong> do estoque? <br/>
                    <span className="text-xs text-red-500">O histórico de movimentações pode ser afetado.</span>
                </p>
                <div className="flex gap-3">
                    <button disabled={isLoading} onClick={() => setProdutoParaDeletar(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50">Cancelar</button>
                    <button onClick={handleDelete} disabled={isLoading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 disabled:bg-red-400">
                        <Trash2 className="w-5 h-5" /> Excluir
                    </button>
                </div>
            </div>
        </div>
      )}

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
                        <Package className="w-3 h-3" /> Item
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
