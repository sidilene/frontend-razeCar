/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../services/api";

import {
  Users,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Tag,
  DollarSign,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle
} from "lucide-react";

// Função auxiliar para formatar moeda BR
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}




// --- NOVA FUNÇÃO: Capitalizar palavras (Ex: lavagem simples -> Lavagem Simples) ---
function formatarNomeCapitalizado(texto) {
  return texto.replace(/\b\w/g, (l) => l.toUpperCase());
}

// Componente visual para Inputs dos Modais (Estilo Moderno)
const ModernInput = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 dark:text-gray-300">{label}</label>
    <input
      {...props}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:focus:bg-gray-800 dark:focus:ring-blue-400 dark:text-gray-200 dark:placeholder-gray-500"
    />
  </div>
);

export default function TiposDeServicos() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados de formulário
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");

  // Item selecionado p/ edição ou exclusão
  const [selectedId, setSelectedId] = useState(null);

  // Estado para guardar quais itens estão expandidos (pode ser mais de um)
  const [expandedIds, setExpandedIds] = useState([]);
  const [infoSucesso, setInfoSucesso] = useState(null);

  // Função para alternar (abrir/fechar)
  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id) // Se já tem, remove (fecha)
        : [...prev, id] // Se não tem, adiciona (abre)
    );
  };

  // Carrega lista ao iniciar
  useEffect(() => {
    loadTipos();
  }, []);

  async function loadTipos() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tipos-lavagem`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao carregar tipos");

      const data = await res.json();
      setTipos(data.tiposLavagem || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
 // --------------- Criar Tipo ---------------
 async function criarTipo(e) {
    e.preventDefault();

    // Formata o preço para número (para o Back-end)
    const precoNum = parseFloat(
      preco.replace("R$", "").replace(/\./g, "").replace(",", ".")
    );

    const body = {
      nome,
      precoPadrao: precoNum,
      descricao,
    };

    try {
      const res = await fetch(`${API_BASE}/tipos-lavagem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Tenta ler o erro real que o Node.js mandou
        const errData = await res.json().catch(() => ({}));

        // Dispara o erro com a mensagem do backend (ou a mensagem genérica se falhar)
        throw new Error(errData.error || "Erro ao criar tipo no servidor");
      }

      // 1. Fecha o modal de formulário (Formulário some)
      setShowAddModal(false);

      // 2. Abre o Modal de Sucesso (Modal bonito aparece)
      setInfoSucesso({
        titulo: "Serviço Criado!",
        nomeServico: nome, // Ex: Lavagem Simples
        valor: preco,      // Ex: R$ 50,00 (Mantém a formatação visual)
      });

      // 3. Limpa os campos do formulário (Para a próxima vez)
      setNome("");
      setPreco("");
      setDescricao("");

      // 4. Atualiza a lista na tela
      await loadTipos();

    } catch (err) {
      console.error(err);
      alert("Erro ao criar serviço: " + err.message);
    }
  }

  // --------------- Abrir modal de edição ---------------
  function openEdit(tipo) {
    setSelectedId(tipo._id);
    setNome(tipo.nome);
    setDescricao(tipo.descricao || "");
    setPreco(
      tipo.precoPadrao.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
    setShowEditModal(true);
  }

  // --------------- Editar Tipo ---------------
  async function editarTipo(e) {
    e.preventDefault();

    const precoNum = parseFloat(
      preco.replace("R$", "").replace(/\./g, "").replace(",", ".")
    );

    const body = {
      nome,
      descricao,
      precoPadrao: precoNum,
    };

    try {
      const res = await fetch(
        `${API_BASE}/tipos-lavagem/${selectedId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error("Erro ao atualizar");

      setShowEditModal(false);
      await loadTipos();
    } catch (err) {
      alert("Erro ao atualizar tipo.");
    }
  }

  // --------------- Excluir Tipo ---------------
  async function deletarTipo() {
    try {
      const res = await fetch(
        `${API_BASE}/tipos-lavagem/${selectedId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Erro ao excluir");

      setShowDeleteModal(false);
      await loadTipos();
    } catch (err) {
      alert("Erro ao excluir tipo.");
    }
  }

  // Formatação de moeda em React
  function handlePrecoChange(e) {
    let v = e.target.value.replace(/\D/g, "");
    v = (parseInt(v, 10) / 100).toFixed(2).replace(".", ",");
    setPreco("R$ " + v);
  }

  return (
    <div className="tab-content max-w-7xl mx-auto p-6">

        {infoSucesso && (
        // 1. Container Mestre (Fixo na tela, mas INVISÍVEL/TRANSPARENTE)
        // Usei z-[9999] para garantir que fique acima de TUDO
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

          {/* 2. Camada do Fundo Escuro (Separada do conteúdo)
              Isso garante que a opacidade só afete o fundo e não bugue a tela */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            // Se quiser que feche ao clicar fora, descomente a linha abaixo:
            // onClick={() => setInfoSucesso(null)}
          ></div>

          {/* 3. O Card do Modal (Fica POR CIMA do fundo escuro) */}
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300">

            {/* --- Conteúdo do Modal --- */}

            {/* Círculo com Check */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">{infoSucesso.titulo}</h3>
            <p className="text-gray-500 mb-6">Disponível no menu de lavagens.</p>

            {/* Area de Destaque */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex flex-col items-center justify-center gap-1">

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3" /> Novo Serviço
              </span>

              <div className="text-xl font-black text-gray-800 tracking-wide uppercase break-words w-full px-2 leading-tight">
                {infoSucesso.nomeServico}
              </div>

              <div className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full mt-2 border border-green-200">
                <DollarSign className="w-3 h-3" />
                {infoSucesso.valor}
              </div>
            </div>

            <button
              onClick={() => setInfoSucesso(null)}
              className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95"
            >
              Concluir
            </button>

          </div>
        </div>
      )}
      {/* --- CONTEÚDO ORIGINAL DA TELA --- */}
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2 dark:text-gray-200">
        <Users className="mr-3 h-7 w-7 text-blue-600"/> <span>Gestão de Tipos de Serviço (Lavagem)</span>
      </h2>

      {/* Botão Adicionar */}
      <button
        onClick={() => {
          setNome("");
          setPreco("");
          setShowAddModal(true);
        }}
        className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
      >
        <Plus size={18} /> <span>Adicionar Tipo</span>
      </button>

      {/* Lista de Tipos */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6 dark:bg-gray-800 ">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tipos.map((t) => {
              const isExpanded = expandedIds.includes(t._id);

              return (
                <li key={t._id} className="flex flex-col py-3">
                  {/* --- LINHA PRINCIPAL --- */}
                  <div className="flex justify-between items-center gap-2">



                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Botão de Expandir */}
                      <button
                        onClick={() => toggleExpand(t._id)}
                        className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded-full transition shrink-0"
                        title={isExpanded ? "Esconder detalhes" : "Ver detalhes"}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>


                      {/* Informações Principais */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-gray-600 font-medium dark:text-gray-200 truncate">
                          {t.nome}
                        </span>

                        <span className="hidden sm:inline text-gray-400 shrink-0">-</span>

                        <span className="px-2 py-0.5 text-sm font-bold text-green-700 rounded-lg bg-green-100 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap shrink-0">
                          {formatarPreco(t.precoPadrao)}
                        </span>
                      </div>
                    </div>

                    {/* Ações (Editar / Deletar) */}
                    <div className="space-x-3 flex items-center shrink-0 pl-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil size={20} />
                      </button>

                      <button
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        onClick={() => {
                          setSelectedId(t._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* --- DESCRIÇÃO --- */}
                  {isExpanded && (
                    <div className="mt-2 ml-9 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p>
                        <span className="font-semibold">Descrição:</span>{" "}
                        {t.descricao || "Nenhuma"}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- MODAIS ATUALIZADOS (Design Moderno) --- */}

      {/* Modal Criar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-gray-800">

            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">

              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full"><Plus className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold">Novo Serviço</h3>
                    <p className="text-blue-100 text-xs">Adicione um novo tipo de lavagem</p>
                  </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={criarTipo} className="p-6">
              <ModernInput
                label="Nome do Serviço"
                type="text"
                maxLength={50}
                placeholder="Ex: Lavagem Premium"
                value={nome}
                /* AQUI: Aplica a formatação Capitalize ao digitar */
                onChange={(e) => setNome(formatarNomeCapitalizado(e.target.value))}
                required
                labelClassName="dark:!text-white"

              />

              <ModernInput
                label="Preço Padrão"
                type="text"
                maxLength={200}
                placeholder="R$ 0,00"
                value={preco}
                onChange={handlePrecoChange}
                required
              />

              {/* --- NOVO CAMPO: DESCRIÇÃO --- */}
              <ModernInput
                label="Descrição (Opcional)"
                type="text"
                maxLength={150}
                placeholder="Ex: Lavagem externa, aspiração interna e limpeza de vidros"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required={false}
                labelClassName="dark:!text-white"
              />
              {/* ----------------------------- */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-gray-800">

            <div className="bg-blue-700 p-5  flex justify-between items-center">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div>
                 Editar Serviço
               </h3>
               <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={editarTipo} className="p-6">
              <ModernInput
                label="Nome do Serviço "
                type="text"
                value={nome}
                /* AQUI: Aplica a formatação Capitalize ao digitar */
                onChange={(e) => setNome(formatarNomeCapitalizado(e.target.value))}
                required
                maxLength={50}
              />

              <ModernInput
                label="Preço Padrão"
                type="text"
                maxLength={200}
                value={preco}
                onChange={handlePrecoChange}
                required

              />

              {/* --- NOVO CAMPO: DESCRIÇÃO --- */}
              <ModernInput
                label="Descrição (Opcional)"
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required={false}
                maxLength={200}
                labelClassName="dark:!text-white"
              />
              {/* ----------------------------- */}


              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir (Mantido Igual) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">

            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Confirmar Exclusão</h3>
            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
              Tem certeza que deseja excluir este serviço? <br/>
              <span className="text-xs text-red-500">Essa ação não pode ser desfeita.</span>
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>

              <button
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2"
                onClick={deletarTipo}
              >
                <Trash2 size={18} /> <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


