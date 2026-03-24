/* eslint-disable react/prop-types */
import React, { useState, useEffect , useRef } from "react";




import { API_BASE } from "../../services/api";
import {
  Edit,
  Trash2,
  Check,
  Plus,
  X,
  Lock,
  Car,
  CheckCircle,
  Phone,
  Save,
  CheckSquare,
  AlertTriangle,
  User,
  Search,
  Calendar,
  Droplets,
  Edit3,
  CheckCircle2,
  Banknote,
  CreditCard,
  QrCode,

  Printer
} from "lucide-react";

/**
 * GestaoLavagens.jsx
 * - Modais modernizados
 * - Campo Funcionário agora é um Select (Caixa Suspensa) vindo da API
 * - [NOVO] Formatação automática de Nome (Primeira letra Maiúscula)
 */



// Estilo reutilizável
const modernInputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 placeholder-gray-400 appearance-none";
const modernLabelClass = "block text-xs font-bold text-gray-500 uppercase mb-1 ml-1";

export default function GestaoLavagens() {
  // dados principais
  const [lavagens, setLavagens] = useState([]); // Lista acumulada
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(true); // Controla se ainda há dados no banco
  const [carregando, setCarregando] = useState(false);
  const [lavagensFiltradas, setLavagensFiltradas] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // dados auxiliares (selects)
  const [tiposLavagem, setTiposLavagem] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  // filtros / busca
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [search, setSearch] = useState("");

  // modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [mostrarManual, setMostrarManual] = useState(false);

  const [avisos, setAvisos] = useState([]);
  const [bloquearBotao, setBloquearBotao] = useState(false);

  const [isPlanAlertOpen, setIsPlanAlertOpen] = useState(false);
  const [planAlertMessage, setPlanAlertMessage] = useState({ title: "", msg: "" });
  const [infoSucesso, setInfoSucesso] = useState(null);





  // --- ESTADOS PARA SELEÇÃO ---
  const [selectedIds, setSelectedIds] = useState([]);

  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const timerRef = useRef(null);

  // --- FUNÇÕES DE SELEÇÃO ---



  // Ativa/Desativa modo de seleção manualmente (Botão Desktop ou Cancelar)
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      // Se estiver saindo, limpa tudo
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  };

  // --- LÓGICA DE LONG PRESS (MOBILE) ---
  const startPress = (id) => {
    // Se já estiver em modo de seleção, o clique normal resolve (não precisa segurar)
    if (isSelectionMode) return;

    timerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      toggleSelect(id); // Já seleciona o item que foi pressionado
      // Vibração (opcional, se suportado pelo navegador mobile)
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600); // 600ms segurando para ativar
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Clique simples no Mobile
  const handleCardClick = (id) => {
    // Se o modo de seleção estiver ATIVO, o clique seleciona/deseleciona
    if (isSelectionMode) {
      toggleSelect(id);
    }
    // Se NÃO estiver ativo, não faz nada (ou você pode colocar outra ação aqui)
  };

// --- FUNÇÕES DE SELEÇÃO ---

  // Selecionar/Deselecionar UM item
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Selecionar/Deselecionar TODOS da lista atual
  const toggleSelectAll = () => {
    if (selectedIds.length === lavagensFiltradas.length && lavagensFiltradas.length > 0) {
      setSelectedIds([]); // Desmarca tudo
    } else {
      setSelectedIds(lavagensFiltradas.map(l => l._id)); // Marca tudo visível
    }
  };

  // formulário adicionar
  const [novaLavagem, setNovaLavagem] = useState({
    tipoLavagem: "",
    nome: "",
    modelo: "",
    telefone: "",
    placa: "",
    veiculo: "",
    funcionario: "",
    observacao: "",
    price: "",
    status: "aguardando",
  });

  // formulário editar
  const [editingLavagem, setEditingLavagem] = useState({
    _id: "",
    tipoLavagem: "",
    nome: "",
    telefone: "",
    placa: "",
    veiculo: "",
    funcionario: "",
    observacao: "",
    price: "",
    status: "aguardando",
  });

  const [toDelete, setToDelete] = useState({ id: null, nome: "" });

  // --- FUNÇÕES UTILITÁRIAS ---

  const formatarPreco = (valor) =>
    valor === null || valor === undefined || valor === ""
      ? "R$ 0,00"
      : Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const extrairPrecoDoTipo = (tipo) =>
    tipo?.preco ?? tipo?.price ?? tipo?.valor ?? tipo?.precoPadrao ?? null;

  // [NOVO] Função para capitalizar palavras (Ex: joao silva -> Joao Silva)
  const formatarNomeCapitalizado = (texto) => {
    return texto.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 1. Estado para armazenar os dados do veículo retornados pela API
  const [veiculoEncontrado, setVeiculoEncontrado] = useState(null);

// 2. Estado para controlar o loading (o spinner girando)
  const [isLoadingPlaca, setIsLoadingPlaca] = useState(false);

// Certifique-se de importar sua instância do api no topo do arquivo, ex:
// import api from '../../services/api


  const handleBulkDelete = async () => {
    // 1. Confirmação
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} itens?`)) return;

    // 2. Estado de Loading (opcional, mas bom ter)
    setIsDeletingBatch(true);

    try {
      const response = await fetch(`${API_BASE}/lavagens/batch-delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        // No fetch, o corpo vai aqui, stringificado
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      // 3. Sucesso: Atualiza a interface
      setLavagens((prev) => prev.filter((item) => !selectedIds.includes(item._id)));
      setSelectedIds([]); // Limpa a seleção
      alert("Itens excluídos com sucesso!");

    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir itens. Tente novamente.");
    } finally {
      setIsDeletingBatch(false);
    }
  };


  const buscarDadosPlaca = async () => {
    // 1. Limpeza básica da placa
    const placaLimpa = novaLavagem.placa.replace(/[^a-zA-Z0-9]/g, '');

    // 2. Validação simples
    if (!placaLimpa || placaLimpa.length < 7) {
      alert("Digite a placa completa para buscar.");
      return;
    }

    setIsLoadingPlaca(true);
    setVeiculoEncontrado(null);
    setMostrarManual(false); // Reseta: Esconde os inputs enquanto busca

    try {
      const response = await fetch(`${API_BASE}/consultar/${placaLimpa}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // --- CENÁRIO DE ERRO NA API (404, 500, etc) ---
      if (!response.ok) {
        setMostrarManual(true); // <--- AQUI: Se der erro, mostramos os inputs manuais

        if (response.status === 401) {
             alert("Sessão expirada. Faça login novamente.");
        } else {
             // Tenta ler msg de erro do backend, se não tiver usa msg padrão
             const errData = await response.json().catch(() => ({}));
             alert(errData.erro || "Veículo não encontrado. Preencha manualmente.");
        }
        return;
      }

      // --- SUCESSO ---
      const dadosVeiculo = await response.json();
      const veiculoFinal = dadosVeiculo.data || dadosVeiculo;

      // Verifica se realmente veio dados úteis (marca, modelo, etc)
      if (veiculoFinal && (veiculoFinal.modelo || veiculoFinal.display_name)) {
        setVeiculoEncontrado(veiculoFinal);

        // Atualiza também os dados que serão salvos no banco (marca/modelo/cor)
        setNovaLavagem(prev => ({
            ...prev,
            marca: veiculoFinal.marca || prev.marca,
            modelo: veiculoFinal.modelo || prev.modelo,
            cor: veiculoFinal.cor || prev.cor,
            cidade: veiculoFinal.cidade || prev.cidade,
        }));

        // Mantemos o manual FALSE porque queremos mostrar aquele Card bonito.
        // Se o usuário quiser editar, ele clica no link "Editar" que colocamos no HTML.
        setMostrarManual(false);

      } else {
        // A requisição funcionou, mas o objeto veio vazio
        setMostrarManual(true); // Abre inputs manuais
        alert("Veículo não encontrado na base. Preencha manualmente.");
      }

    } catch (error) {
      // --- CENÁRIO DE ERRO DE CONEXÃO (Internet caiu, servidor off) ---
      console.error("Erro requisição:", error);
      setMostrarManual(true); // <--- AQUI: Garante que os inputs apareçam
      alert("Erro de conexão. Por favor, preencha os dados manualmente.");
    } finally {
      setIsLoadingPlaca(false);
    }
  };

  // ============================
  // Carregamento de Dados
  // ============================
    async function loadLavagens(page = 1, isFirstLoad = false) {
      if (carregando || (!temMais && !isFirstLoad)) return;

      setCarregando(true);
      try {
        const queryParams = new URLSearchParams({
          page: page,
          limit: 20, // Alinhado com o backend
          search: search || "",
          dataInicio: dataInicio || "",
          dataFim: dataFim || ""
        });

        const res = await fetch(`${API_BASE}/lavagens?${queryParams}`, {
          method: "GET",
          credentials: "include"
        });

        const data = await res.json();
        const novasLavagens = data.lavagens || [];

        if (isFirstLoad) {
          setLavagens(novasLavagens);
          setLavagensFiltradas(novasLavagens);
        } else {
          setLavagens(prev => [...prev, ...novasLavagens]);
          setLavagensFiltradas(prev => [...prev, ...novasLavagens]);
        }

        setTotalRegistros(data.totalRegistros || 0);

        // AQUI ESTÁ A MUDANÇA: Use o que vem do servidor
        setTemMais(data.temMais);
        setPagina(page);

      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }

  async function loadTipos() {
    try {
      const res = await fetch(`${API_BASE}/tipos-lavagem`, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar tipos");
      const data = await res.json();
      setTiposLavagem(data.tiposLavagem || []);
    } catch (err) {
      console.error("Erro ao carregar tipos:", err);
    }
  }

    async function loadFuncionarios() {
      try {
        const res = await fetch(`${API_BASE}/lavajatos/usuarios`, { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error("Erro ao carregar funcionários");

        const data = await res.json();

        if (Array.isArray(data)) {
            // AQUI ESTÁ O FILTRO
            // Mantém apenas quem NÃO for do tipo 'dono'
            const apenasFuncionarios = data.filter(usuario => usuario.tipo !== 'dono');
            setFuncionarios(apenasFuncionarios);
        } else {
            setFuncionarios([]);
        }

      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        setFuncionarios([]);
      }
  }


  // --- [NOVO] VERIFICAÇÃO DE REQUISITOS ---
  useEffect(() => {
    async function verificarRequisitos() {
      try {
        // 1. Verifica Tipos de Lavagem
        const resTipos = await fetch(`${API_BASE}/tipos-lavagem`, { credentials: "include" });
        const dataTipos = await resTipos.json();
        const qtdTipos = dataTipos.tiposLavagem?.length || 0;

        // 2. Verifica Funcionários
        const resFunc = await fetch(`${API_BASE}/lavajatos/usuarios`, { credentials: "include" });
        const dataFunc = await resFunc.json();
        const qtdFunc = Array.isArray(dataFunc) ? dataFunc.length : 0;

        // 3. Monta os avisos
        const novosAvisos = [];
        if (qtdTipos === 0) novosAvisos.push("Cadastre pelo menos um Tipo de Serviço (Aba Tipos de Serviços ou Minha Loja).");
        if (qtdFunc === 1) novosAvisos.push("Cadastre pelo menos um Funcionário (Aba Gestão de Usuários).");

        setAvisos(novosAvisos);
        setBloquearBotao(novosAvisos.length > 0);
      } catch (error) {
        console.error("Erro ao verificar requisitos:", error);
      }
    }
    verificarRequisitos();
  }, []);


  useEffect(() => {
    loadLavagens(1, true);
    loadFuncionarios();
  }, []);

  useEffect(() => {
    if (isAddOpen || isEditOpen) {
      loadTipos();
      loadFuncionarios();
    }
  }, [isAddOpen, isEditOpen]);

  // ============================
  // Filtragem
  // ============================
    async function aplicarFiltroData() {
    // Resetamos tudo para começar a busca do zero no banco
    setPagina(1);
    setTemMais(true);
    setLavagens([]); // Limpa a lista atual para mostrar os novos resultados

    // Chamamos a loadLavagens passando a página 1 e avisando que é um reset (isFirstLoad = true)
    // A função loadLavagens precisa ser ajustada para ler dataInicio e dataFim do estado
    await loadLavagens(1, true);
  }

  useEffect(() => {
    // Criamos um "debounce" (espera o usuário parar de digitar por 500ms)
    const delayDebounceFn = setTimeout(() => {
      setPagina(1);
      setTemMais(true);
      // Chamamos o servidor buscando pelo termo
      loadLavagens(1, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]); // Sempre que o 'search' mudar, ele busca no banco

  // ============================
  // Handlers Add / Edit
  // ============================
  const handleNovaChange = (field, value) =>
    setNovaLavagem((p) => ({ ...p, [field]: value }));

  const handleTipoSelectAdd = (tipoId) => {
    handleNovaChange("tipoLavagem", tipoId);
    const tipo = tiposLavagem.find((t) => String(t._id) === String(tipoId));
    const preco = extrairPrecoDoTipo(tipo);
    handleNovaChange("price", preco ?? "");
  };

  const handleEditChange = (field, value) =>
    setEditingLavagem((p) => ({ ...p, [field]: value }));

  const handleTipoSelectEdit = (tipoId) => {
    handleEditChange("tipoLavagem", tipoId);
    const tipo = tiposLavagem.find((t) => String(t._id) === String(tipoId));
    const preco = extrairPrecoDoTipo(tipo);
    handleEditChange("price", preco ?? editingLavagem.price ?? "");
  };

  // ============================
  // CRUD Actions
  // ============================
  async function criarLavagem(e) {
    e.preventDefault?.();
    try {
      // ... (suas validações iniciais permanecem iguais)
      if (!novaLavagem.tipoLavagem || !novaLavagem.placa) {
        alert("Preencha os campos obrigatórios (Placa, Nome, Serviço).");
        return;
      }

      // 1. PREPARAÇÃO DOS DADOS DO VEÍCULO (permanece igual)
      const dadosDoVeiculo = {
        marca: veiculoEncontrado?.marca || "",
        cor: veiculoEncontrado?.cor || "",
        ano: veiculoEncontrado?.ano || "",
        modelo: veiculoEncontrado?.modelo || novaLavagem.modelo || "",
        descricao: veiculoEncontrado?.display_name || novaLavagem.modelo || "Veículo não identificado"
      };

      // 2. MONTAGEM DO PAYLOAD (permanece igual)
      const payload = {
        placa: (novaLavagem.placa || "").toUpperCase(),
        nome: novaLavagem.nome,
        telefone: novaLavagem.telefone || null,
        tipoLavagem: novaLavagem.tipoLavagem,
        observacao: novaLavagem.observacao || "",
        funcionarioId: novaLavagem.funcionario || null,
        status: novaLavagem.status || "aguardando",
        price: novaLavagem.price || undefined,
        veiculo: dadosDoVeiculo.descricao,
        modelo: dadosDoVeiculo.modelo,
        marca: dadosDoVeiculo.marca,
        cor: dadosDoVeiculo.cor,
        ano: dadosDoVeiculo.ano,
        cidade: veiculoEncontrado?.cidade || "",
        formaPagamento: novaLavagem.formaPagamento,
        uf: veiculoEncontrado?.uf || ""
      };

      const res = await fetch(`${API_BASE}/lavagens`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Dados que serão enviados:", {
      placa: novaLavagem.placa,
      formaPagamento: novaLavagem.formaPagamento // Verifique se aparece 'pix', 'dinheiro' ou 'cartao'
    });

      if (!res.ok) {
        // Tenta ler o JSON de erro do backend
        const errData = await res.json().catch(() => ({}));

        // 1. VERIFICA SE É BLOQUEIO DE PLANO (Status 403)
        if (res.status === 403 || errData.upgrade === true) {
            setPlanAlertMessage({
                title: "Limite Atingido!",
                msg: errData.message || "Você atingiu o limite do seu plano gratuito."
            });
            setIsPlanAlertOpen(true);
            return; // 🛑 O return mata a execução aqui!
        }

        // 3. QUALQUER OUTRO ERRO (500, etc) VEM PRA CÁ
        // Se chegou até aqui, é porque não parou nos 'returns' acima.
        throw new Error(errData.error || errData.message || "Erro ao criar lavagem");
      }

      // ============================================================
      // SE PASSOU DAQUI, FOI SUCESSO
      // ============================================================

      // 1. Fecha o modal de formulário
      setIsAddOpen(false);

      // 2. Abre o Modal de Sucesso com os dados da lavagem
      setInfoSucesso({
        titulo: "Lavagem Registrada!",
        placa: payload.placa,
        veiculo: dadosDoVeiculo.descricao,
      });

      // 3. LIMPEZA DOS ESTADOS
      setVeiculoEncontrado(null);
      setNovaLavagem({
        placa: "",
        modelo: "",
        nome: "",
        telefone: "",
        veiculo: "",
        tipoLavagem: "",
        funcionario: "",
        price: "",
        observacao: "",
        status: "aguardando",
        formaPagamento: "pix",
      });

      // 4. ATUALIZA A LISTA
      setPagina(1);
      setTemMais(true);
      await loadLavagens(1, true);

    } catch (err) {
      console.error(err);
      // Aqui só exibe alertas de erros "comuns" (conexão, validação, etc)
      // O erro de plano já foi tratado acima e não chega aqui.
      alert("Erro: " + (err.message || err));
    }
}


// Função auxiliar para buscar o plano no servidor
const verificarPlanoUsuario = async () => {
  try {
    // A rota que você passou.
    // 'credentials: include' é O SEGREDO: faz o navegador enviar os cookies junto.
    const response = await fetch(`${API_BASE}/lavajatos/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error("Erro ao verificar plano:", response.status);
      return null;
    }

    const dados = await response.json();

    // LOG DE DEBUG: Abra o console (F12) para ver exatamente o que chega aqui!
    // console.log("Resposta da API /lavajatos/me:", dados);

    // Tenta encontrar o plano em vários lugares comuns (ajuste conforme seu JSON real)
    // Ex: pode vir como { plano: 'pro' } ou { assinatura: { nome: 'pro' } } etc.
    // Agora ele procura o plano no lugar certo: dentro de dados.lavajato
    const plano = dados?.lavajato?.plano || dados.plano;

    // E mantemos aquela dica do .trim() por segurança!
    return plano ? String(plano).toLowerCase().trim() : 'gratis';

  } catch (error) {
    console.error("Erro na requisição:", error);
    return 'erro';
  }
};

// Geração de Recibo em PDF (Agora é ASYNC!)
  // Geração de Recibo em PDF (Agora com Modal Bonito!)
  const gerarReciboPDF = async (lavagem) => {

    // 1. Extrai o ID de dentro do objeto que o botão enviou
    const lavagemId = lavagem._id || lavagem.id;

    if (!lavagemId) {
       console.error("ID da lavagem não encontrado.");
       return;
    }

    try {
      // 2. Faz a requisição para a sua nova rota no Back-end
      const response = await fetch(`${API_BASE}/lavagens/${lavagemId}/recibo`, {
        method: 'GET',
        credentials: 'include', // Garante o envio dos cookies de autenticação
      });


      if (response.status === 403) {
        const errorData = await response.json();

        setPlanAlertMessage({
          title: "Período de Teste",
          msg: errorData.error || "A geração de recibos em PDF não está disponível no plano Trial.\n\nAtualize seu plano para liberar."
        });
        setIsPlanAlertOpen(true);
        return; // Para aqui e não faz o download
      }

      // Se der outro erro (ex: 401, 404, 500)
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      // 4. Se passou pela trava, o Back-end mandou o arquivo PDF!
      const blob = await response.blob();

      // Cria o link e força o download com o nome da placa
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Recibo_${lavagem.placa || 'Lavagem'}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Limpeza de memória
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao tentar gerar/baixar o PDF:", error);
      alert("Erro ao conectar com o servidor para gerar o PDF.");
    }
  };


  const openEditLavagem = (id) => {
    // 1. Alterado de 'todasLavagens' para 'lavagens'
    const lav = lavagens.find((l) => String(l._id) === String(id));

    if (!lav) {
      return alert("Lavagem não encontrada no histórico carregado.");
    }

    // 2. Mantemos sua lógica de extração de dados
    const funcValue = lav.funcionario?._id ?? lav.funcionario ?? "";

    let veiculoValue = "";
    if (lav.veiculo && typeof lav.veiculo === 'object') {
        veiculoValue = lav.veiculo.nome || "";
    } else {
        veiculoValue = lav.veiculo || "";
    }

    // 3. Preenche o formulário de edição
    setEditingLavagem({
      _id: lav._id,
      nome: lav.nome || "",
      telefone: lav.telefone || "",
      placa: lav.placa || "",
      veiculo: veiculoValue,
      modelo: lav.modelo || "",
      tipoLavagem: lav.tipoLavagem?._id ?? (lav.tipoLavagem || ""),
      price: lav.price ?? extrairPrecoDoTipo(lav.tipoLavagem) ?? "",
      funcionario: lav.funcionarioId?._id ?? funcValue,
      observacao: lav.observacao || "",
      status: lav.status || "aguardando",
    });

    setIsEditOpen(true);
  };

  async function salvarEdicaoLavagem(e) {
    e.preventDefault?.();
    try {
      const id = editingLavagem._id;
      const body = {
        nome: editingLavagem.nome,
        telefone: editingLavagem.telefone,
        placa: editingLavagem.placa,
        veiculo: editingLavagem.veiculo,
        modelo: editingLavagem.modelo,
        tipoLavagem: editingLavagem.tipoLavagem,
        status: editingLavagem.status,
        funcionarioId: editingLavagem.funcionario,
        observacao: editingLavagem.observacao,
        price: editingLavagem.price || undefined,
      };

      const res = await fetch(`${API_BASE}/lavagens/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao atualizar lavagem");

      setIsEditOpen(false);

      // 2. Abre o Modal de Sucesso (Reutilizado)
      // Passamos um título diferente e os dados que estavam sendo editados
      setInfoSucesso({
        titulo: "Lavagem Atualizada!", // Título personalizado
        placa: editingLavagem.placa,
        // Tenta mostrar o Modelo (ex: Corolla), se não tiver, mostra a Categoria (ex: Carro)
        veiculo: editingLavagem.modelo || editingLavagem.veiculo || "Veículo",
      });

      // 3. Atualiza a lista (mantido igual)
      setPagina(1);
      setTemMais(true);
      await loadLavagens(1, true);

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar: " + (err.message || err));
    }
  }

  function openConfirmDelete(lavagemId, lavagemNome) {
    setToDelete({ id: lavagemId, nome: lavagemNome });
    setIsDeleteOpen(true);
  }

    async function confirmarDelete() {
      try {
        const res = await fetch(`${API_BASE}/lavagens/${toDelete.id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!res.ok) throw new Error("Erro ao deletar");

        // 1. Fecha o modal de confirmação ("Tem certeza?")
        setIsDeleteOpen(false);

        // 2. Abre o Modal de Sucesso (Reutilizando o state)
        setInfoSucesso({
          titulo: "Lavagem Excluída!",
          subtitulo: "O registro foi removido do sistema.",
          placa: toDelete.placa,    // Pega do objeto que estava selecionado para deletar
          veiculo: toDelete.modelo || toDelete.veiculo || "Veículo",
          tipo: "delete" // Flag para mudarmos a cor do ícone se quiser
        })

        // RESET PARA ESCALABILIDADE:
        // Após deletar, precisamos que o banco de dados re-calcule a ordem
        // e nos mande a primeira página atualizada.
        setPagina(1);
        setTemMais(true);
        await loadLavagens(1, true); // Recarrega do zero de forma limpa

      } catch (err) {
        console.error("Erro ao deletar lavagem:", err);
        alert("Erro: " + (err.message || err));
      }
    }

    function limparFiltros() {

      setDataInicio("");

      setDataFim("");

      setSearch("");

      loadLavagens(1, true); // Recarrega tudo do zero

      }

      const formatarDataRelativa = (dataISO) => {
        if (!dataISO) return "";

        const data = new Date(dataISO);
        const hoje = new Date();

        // Zera as horas para comparar apenas os dias
        const dataSemHora = new Date(data.getFullYear(), data.getMonth(), data.getDate());
        const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

        const diffTime = hojeSemHora - dataSemHora;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Hoje";
        if (diffDays === 1) return "Ontem";

        // Se for antigo, retorna DD/MM
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      };




  // ============================
  // RENDER
  // ============================
  return (
    <div id="lavagens" className="tab-content max-w-7xl mx-auto p-6">

      {/* --- [NOVO] ALERTA AMARELO --- */}
      {avisos.length > 0 && (
        <div className="mb-6 bg-yellow-50  font-semibold border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 font-semibold text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Atenção! Antes de iniciar uma lavagem:
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
                {avisos.map((aviso, index) => (
                  <li key={index}>{aviso}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* ----------------------------- */}


      {/* MODAL DE SUCESSO E EXCLUSÃO (UNIFICADO) */}
      {infoSucesso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">

            {/* Círculo com Icone (Muda de cor se for delete) */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${
              infoSucesso.tipo === 'delete' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {infoSucesso.tipo === 'delete' ? (
                <Trash2 className="w-10 h-10 text-red-600" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-600" />
              )}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">{infoSucesso.titulo}</h3>

            {/* Subtitulo dinâmico (ex: "Adicionado à fila" ou "Removido do sistema") */}
            <p className="text-gray-500 mb-6">
              {infoSucesso.subtitulo || "Operação realizada com sucesso."}
            </p>

            {/* Area de Destaque (Placa e Veículo) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex flex-col items-center justify-center gap-1">

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Car className="w-3 h-3" /> Veículo
              </span>

              <div className="text-2xl font-black text-gray-800 tracking-widest uppercase">
                {infoSucesso.placa}
              </div>

              <div className="text-sm font-medium text-gray-500 truncate max-w-full px-2">
                {infoSucesso.veiculo}
              </div>
            </div>

            <button
              onClick={() => setInfoSucesso(null)}
              className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 ${
                  infoSucesso.tipo === 'delete'
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' // Botão neutro/escuro para fechar delete
                  : 'bg-green-600 hover:bg-green-700 shadow-green-600/20' // Botão verde para sucesso
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}


        {/* ================================================= */}
        {/* MODAL DE AVISO DE PLANO (PREMIUM)          */}
        {/* ================================================= */}
        {isPlanAlertOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

              {/* Cabeçalho Colorido */}
              <div className="bg-gradient-to-r bg-yellow-500 p-6 flex justify-center">
                <div className="bg-white/20 p-3 rounded-full">
                  <Lock className="text-white w-10 h-10" />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold  text-gray-800 mb-2">
                  {planAlertMessage.title}
                </h3>

                <p className="text-gray-600 font-semibold text-sm leading-relaxed whitespace-pre-line">
                  {planAlertMessage.msg}
                </p>

                {/* Botão de Ação */}
                <button
                  onClick={() => setIsPlanAlertOpen(false)}
                  className="mt-6 w-full py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Entendi
                </button>
              </div>

            </div>
          </div>
        )}

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center dark:text-gray-100">
          <Car className="mr-3 h-7 w-7 text-blue-600" />
          Gestão Completa de Lavagens
        </h2>

        {/* ÁREA DE CONTROLES (Filtros e Ações) */}
        <div className="flex flex-col gap-4">

          {/* --------------------------------------------------------- */}
          {/* LINHA 1: Filtros de Data e Botões de Ação (Filtrar/Limpar) */}
          {/* --------------------------------------------------------- */}
          <div className="flex flex-col md:flex-row gap-3 md:items-end">

            {/* Grupo de Datas */}
            <div className="flex flex-row gap-3 w-full md:w-auto">
              <label className="flex flex-col w-1/2 md:w-auto text-sm font-semibold text-gray-500 dark:text-gray-300">
                Data Início:
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                />
              </label>

              <label className="flex flex-col w-1/2 md:w-auto text-sm font-semibold text-gray-500 dark:text-gray-300">
                Data Fim:
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                />
              </label>
            </div>

            {/* Grupo de Botões (Filtrar / Limpar) */}
            {/* No mobile: lado a lado (flex-row). No desktop: lado a lado também (removi o flex-col) */}
            <div className="flex flex-row gap-2 mt-2 md:mt-0 w-full md:w-auto">
              <button
                onClick={aplicarFiltroData}
                className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors h-[38px] flex items-center justify-center"
              >
                Filtrar
              </button>

              <button
                onClick={limparFiltros}
                className="flex-1 md:flex-none bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors h-[38px] flex items-center justify-center"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* LINHA 2: Barra de Busca e Botão Nova Lavagem */}
          {/* --------------------------------------------------------- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* Input de Busca */}
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="Buscar por Cliente/Placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700 transition-all"
              />
            </div>

            {/* Botão Nova Lavagem */}
            <button
              onClick={() => !bloquearBotao && setIsAddOpen(true)}
              disabled={bloquearBotao}
              className={`font-bold px-6 py-2.5 rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap shadow-sm
                ${bloquearBotao
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
              <Plus size={20} />
              <span>Nova Lavagem</span>
            </button>
          </div>

        </div>
      </div>

            {/* ================= BARRA DE AÇÕES E BOTÃO DE SELEÇÃO ================= */}
      <div className="flex justify-between items-center mb-4">
        {/* Seus filtros ou título existentes estariam aqui à esquerda... */}
        <div className="flex-1"></div>

        {/* BOTÃO PARA ATIVAR SELEÇÃO (VISÍVEL NO DESKTOP OU QUANDO NÃO ESTÁ EM MODO SELEÇÃO) */}
        {!isSelectionMode && lavagensFiltradas.length > 0 && (
          <button
            onClick={toggleSelectionMode}
            className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            Selecionar Vários
          </button>
        )}
      </div>

      {/* BARRA DE AÇÕES QUANDO SELECIONADO (OVERLAY) */}
      {isSelectionMode && (
        <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 fade-in duration-300">

          {/* LADO ESQUERDO: CONTADOR + BOTÃO SELECIONAR TUDO (MOBILE) */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">

            {/* Ícone e Contador */}
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <div className="bg-blue-200 p-1.5 rounded-md">
                <CheckSquare className="w-5 h-5 text-blue-700" />
              </div>
              <span>{selectedIds.length} selecionado(s)</span>
            </div>

            {/* --- AQUI ESTÁ O BOTÃO QUE FALTAVA --- */}
            <button
              onClick={toggleSelectAll}
              className="md:hidden text-sm font-bold text-blue-600 underline active:text-blue-800"
            >
              {lavagensFiltradas.length > 0 && selectedIds.length === lavagensFiltradas.length
                ? 'Desmarcar Tudo'
                : 'Selecionar Tudo'}
            </button>
          </div>

          {/* LADO DIREITO: BOTÕES DE AÇÃO (CANCELAR / EXCLUIR) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={toggleSelectionMode} // Botão Cancelar
              className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition border border-transparent hover:border-gray-200"
            >
              Cancelar
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeletingBatch}
                className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDeletingBatch ? 'Excluindo...' : 'Excluir'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= TABLE (DESKTOP) ================= */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-600">
            <tr>
              {/* COLUNA CHECKBOX (Só aparece no modo seleção) */}
              {isSelectionMode && (
                <th className="px-4 py-3 text-left w-10 transition-all duration-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={lavagensFiltradas.length > 0 && selectedIds.length === lavagensFiltradas.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Veículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Serviço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Funcionário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {lavagensFiltradas.map((lavagem) => {
              const status = lavagem.status || "Em Lavagem";
              const statusClasses = status.toLowerCase() === "finalizada" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
              const preco = lavagem.price ?? (lavagem.tipoLavagem ? extrairPrecoDoTipo(lavagem.tipoLavagem) : lavagem.preco) ?? "";
              const funcNome = lavagem.funcionarioId?.nome || lavagem.funcionarioNome || "-";
              const dataTexto = formatarDataRelativa ? formatarDataRelativa(lavagem.dataCadastro) : new Date(lavagem.dataCadastro).toLocaleDateString('pt-BR');


              // Verifica se está selecionado
              const isSelected = selectedIds.includes(lavagem._id);

              return (
                <tr
                  key={lavagem._id}
                  // Lógica de seleção ao clicar na linha (opcional)
                  onClick={() => isSelectionMode && toggleSelect(lavagem._id)}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >

                  {/* CELULA CHECKBOX */}
                  {isSelectionMode && (
                    <td className="px-4 py-4 transition-all duration-300">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelect(lavagem._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  <td className="px-6 py-4">
                    {/* SUA PLACA PERSONALIZADA */}
                    <div className="inline-flex flex-col w-28 border-2 border-gray-800 rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/10">
                      <div className="bg-[#003399] h-3 w-full flex items-center justify-between px-1">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 bg-white rounded-full opacity-80"></div>
                          <div className="w-1 h-1 bg-white rounded-full opacity-80"></div>
                        </div>
                        <span className="text-[6px] text-white font-bold leading-none">PLACA</span>
                        <div className="w-2 h-1.5 bg-green-600 rounded-sm opacity-80"></div>
                      </div>
                      <div className="flex items-center justify-center py-1 bg-gray-50">
                        <span className="text-sm font-bold tracking-widest text-gray-900 uppercase font-mono">
                          {lavagem.placa || "-"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-200">
                    <div className="flex flex-col justify-center">
                      <strong className="whitespace-nowrap">{lavagem.nome || "-"}</strong>
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-400 whitespace-nowrap">
                        {lavagem.telefone || ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {(lavagem.veiculo || "-").toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{lavagem.tipoLavagem?.nome || lavagem.tipoLavagemNome || "Sem Tipo"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{funcNome}</td>
                  <td className="text-sm font-bold"><span className="px-1 py-0.5 text-green-700 dark:text-green-400 rounded-lg bg-green-100 dark:bg-green-900/30">{formatarPreco(preco)} </span></td>
                  <td className="px-6 py-4">
                  <div className="flex flex-col">
                    {/* Status Badge (adicionei w-fit para ajustar ao tamanho do texto) */}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full w-fit ${statusClasses}`}>
                      {status}
                    </span>

                    {/* Data logo abaixo */}
                    <span className="text-[11px] text-gray-800  mt-1 font-medium dark:text-gray-300">
                      {dataTexto}
                    </span>
                  </div>
                </td>

                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center">
                      {/* IMPORTANTE: Adicionei e.stopPropagation() em todos os botões para não ativar a seleção ao clicar neles */}
                      <button onClick={(e) => {e.stopPropagation(); gerarReciboPDF(lavagem)}} className="text-green-600 hover:text-green-900 mr-2" title="Gerar Recibo">
                        <Printer className="h-5 w-5" />
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); openEditLavagem(lavagem._id)}} className="text-blue-600 hover:text-blue-900 mr-2">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); openConfirmDelete(lavagem._id, lavagem.nome)}} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {lavagensFiltradas.length === 0 && <tr><td colSpan={isSelectionMode ? 9 : 8} className="px-6 py-6 text-center text-gray-500">Nenhuma lavagem encontrada.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE LIST (COM LONG PRESS + SEU DESIGN) ================= */}
      <div className="md:hidden space-y-4 select-none">
       {lavagensFiltradas.map((lavagem) => {
        const funcNome = lavagem.funcionarioId?.nome || lavagem.funcionarioNome || "-";
        const preco = lavagem.price ?? (lavagem.tipoLavagem ? extrairPrecoDoTipo(lavagem.tipoLavagem) : lavagem.preco) ?? "";
        const dataTexto = formatarDataRelativa(lavagem.dataCadastro);
        const isSelected = selectedIds.includes(lavagem._id);


        return (
          <div
            key={lavagem._id}

            // --- EVENTOS DO LONG PRESS ---
            onTouchStart={() => startPress(lavagem._id)}
            onTouchEnd={endPress}
            onTouchMove={endPress}
            onMouseDown={() => startPress(lavagem._id)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onClick={() => handleCardClick(lavagem._id)}

            // Estilos condicionais de seleção
            className={`bg-white p-4 rounded-lg shadow dark:bg-gray-800 mb-4 relative transition-all duration-200
              ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700/80 transform scale-[0.98]' : ''}`}
          >

             {/* CHECKBOX FLUTUANTE (Só aparece se estiver em modo seleção) */}
             {isSelectionMode && (
                <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10 animate-in fade-in zoom-in duration-200">
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                      {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                   </div>
                </div>
              )}

            {/* WRAPPER DE CONTEÚDO (Empurra tudo pra direita se tiver checkbox) */}
            <div className={`${isSelectionMode ? 'pl-8' : ''} transition-all duration-200`}>

              {/* --- CABEÇALHO DO CARD (Placa + Data) --- */}
              <div className="flex justify-between items-start mb-2">
                <div className="inline-flex flex-col w-28 border-[1.5px] border-gray-700 rounded-md overflow-hidden bg-white shadow-sm">
                  <div className="bg-[#003399] h-2.5 w-full flex items-center justify-center relative px-1">
                    <span className="text-[7px] text-white font-bold tracking-tight scale-90">PLACA</span>
                    <div className="absolute right-1 w-1.5 h-1 bg-green-600 rounded-[1px] opacity-80"></div>
                  </div>
                  <div className="flex items-center justify-center py-0.5 bg-gray-50/50">
                    <h3 className="text-base font-extrabold tracking-widest text-gray-900 uppercase font-mono leading-tight">
                      {lavagem.placa || "---"}
                    </h3>
                  </div>
                </div>

                <span className="text-xs font-medium text-gray-200 uppercase tracking-wide bg-blue-600  dark:text-gray-200 px-2 py-1 rounded-md">
                  {dataTexto}
                </span>
              </div>

              {/* --- INFORMAÇÕES DO VEÍCULO --- */}
              <p className="text-base font-semibold text-gray-600 dark:text-gray-200">
                Veiculo: {(lavagem.veiculo || "-").toUpperCase()}
              </p>
              <p className="text-base text-gray-600 font-semibold dark:text-gray-200">Cliente: {lavagem.nome || "-"}</p>
              <p className="text-base font-semibold text-gray-500 dark:text-gray-400">Func: {funcNome}</p>
              <p className="text-base font-semibold text-gray-500 dark:text-gray-400">Serviço: {lavagem.tipoLavagem?.nome || lavagem.tipoLavagemNome || "Sem Tipo"}</p>

              {/* --- RODAPÉ DO CARD (Preço + Botões) --- */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="px-2 py-1 text-sm font-bold text-green-700 dark:text-green-400 rounded-lg bg-green-100 dark:bg-green-900/30">
                  {formatarPreco(preco)}
                </span>

                <div className="flex space-x-4">
                  {/* IMPORTANTE: e.stopPropagation() aqui também */}
                  <button onClick={(e) => {e.stopPropagation(); gerarReciboPDF(lavagem)}} className="text-green-600 hover:text-green-900" title="Gerar Recibo">
                    <Printer className="h-5 w-5" />
                  </button>

                  <button onClick={(e) => {e.stopPropagation(); openEditLavagem(lavagem._id)}} className="text-blue-600 hover:text-blue-800">
                    <Edit className="h-5 w-5" />
                  </button>

                  <button onClick={(e) => {e.stopPropagation(); openConfirmDelete(lavagem._id, lavagem.nome)}} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

            </div> {/* Fim do Wrapper de Conteúdo */}

          </div>
        );
      })}
    </div>

      {/* ================= PAGINAÇÃO / CARREGAR MAIS ================= */}
      <div className="flex flex-col items-center justify-center my-8 gap-2">
        {temMais && !carregando && (
          <button
            onClick={() => loadLavagens(pagina + 1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Carregar mais (Exibindo {lavagens.length} de {totalRegistros})
          </button>
        )}
        {carregando && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando mais...</span>
          </div>
        )}
        {!temMais && lavagens.length > 0 && (
          <span className="text-gray-400 text-sm italic">
            Você visualizou todas as {lavagens.length} lavagens.
          </span>
        )}
      </div>

     {/* ================= MODAL ADICIONAR ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative dark:bg-gray-800 flex flex-col max-h-[90vh]">

            {/* Header - (Fica fixo no topo porque não está dentro da área de scroll) */}
            <div className="bg-blue-600 p-4 md:p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Car className="w-5 h-5" /> Nova Lavagem
              </h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-6 h-6 text-white/70 hover:text-white" />
              </button>
            </div>

            <form onSubmit={criarLavagem} className="flex flex-col h-full overflow-hidden">

              <div className="overflow-y-auto p-4 md:p-6 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                  {/* ================= COLUNA 1: DADOS DO CLIENTE E VEÍCULO ================= */}
                  <div className="flex flex-col gap-4">

                    {/* 1. Input Placa com Botão de Busca */}
                    <div>
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Placa do Veículo</label>
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          required
                          value={novaLavagem.placa}
                          maxLength={7}
                          onChange={(e) => {
                            let valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                            handleNovaChange("placa", valor);
                            if (valor.length < 7) {
                              setMostrarManual(false);
                              setVeiculoEncontrado(null);
                            }
                          }}
                          placeholder="ABC1234"
                          className={`${modernInputClass} uppercase pl-4 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700 font-mono tracking-widest`}
                        />
                        <button
                          type="button"
                          onClick={buscarDadosPlaca}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition flex items-center justify-center shadow-sm"
                        >
                          {isLoadingPlaca ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {!veiculoEncontrado && !mostrarManual && (
                        <button
                          type="button"
                          onClick={() => setMostrarManual(true)}
                          className="text-xs text-blue-600 underline mt-2 hover:text-blue-800 transition bg-transparent border-none cursor-pointer"
                        >
                          Não buscar, preencher manualmente
                        </button>
                      )}
                    </div>

                    {/* 2. CARD DE SUCESSO DA API */}
                      {veiculoEncontrado && (
                      <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg shadow-blue-100/50 dark:shadow-none animate-in slide-in-from-top-3 fade-in duration-500">

                        {/* Faixa decorativa lateral para dar peso visual */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-blue-600"></div>

                        <div className="p-5 pl-7">
                          {/* CABEÇALHO DO CARD */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 items-center">
                              <div className="p-2.5 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-slate-600">
                                <Car className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                    {veiculoEncontrado.modelo || veiculoEncontrado.display_name}
                                  </h4>
                                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Validado
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                  {veiculoEncontrado.marca}
                                </p>
                              </div>
                            </div>

                            {/* Botão de Edição mais discreto e elegante */}
                            <button
                              type="button"
                              onClick={() => setMostrarManual(true)}
                              className="group flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-slate-700"
                            >
                              <Edit3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />

                            </button>
                          </div>

                          <hr className="border-gray-100 dark:border-slate-700 mb-4" />

                          {/* GRID DE DADOS RICOS - Onde o dinheiro está */}
                          <div className="mt-4">

                            {/* Estrutura Flex: Mobile = Coluna / Desktop = Linha separada */}
                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

                              {/* GRUPO 1: DADOS TÉCNICOS (Fica à esquerda no Desktop) */}
                              <div className="flex items-center gap-6 sm:gap-8 border-t sm:border-t-0 border-gray-100 dark:border-slate-700 pt-3 sm:pt-0">

                                {/* ANO */}
                                <div className="flex flex-col">
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Ano
                                  </p>
                                  <p className="font-bold text-gray-700 dark:text-gray-200 text-base">
                                    {veiculoEncontrado.ano || veiculoEncontrado.ano_modelo || '-'}
                                  </p>
                                </div>

                                {/* Separador vertical apenas visual */}
                                <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>

                                {/* COR */}
                                <div className="flex flex-col">
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5">
                                    <Droplets className="w-3.5 h-3.5" /> Cor
                                  </p>
                                  <p className="font-bold text-gray-700 dark:text-gray-200 text-base capitalize">
                                    {veiculoEncontrado.cor || '-'}
                                  </p>
                                </div>
                              </div>



                            </div>
                          </div>

                          {/* Rodapé opcional de feedback positivo */}
                          <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-slate-700">
                            <p className="text-[10px] text-blue-500 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Dados recuperados em tempo real da base nacional.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. INPUTS MANUAIS */}
                    {mostrarManual && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 animate-in fade-in slide-in-from-top-2">
                        <div className="col-span-2 text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                          Dados do Veículo
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Marca"
                            className={`${modernInputClass} text-sm py-2 dark:bg-slate-700 dark:text-gray-300`}
                            value={novaLavagem.marca || (veiculoEncontrado?.marca || '')}
                            onChange={(e) => handleNovaChange("marca", e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Cor"
                            className={`${modernInputClass} text-sm py-2 dark:bg-slate-700 dark:text-gray-300`}
                            value={novaLavagem.cor || (veiculoEncontrado?.cor || '')}
                            onChange={(e) => handleNovaChange("cor", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Modelo"
                            className={`${modernInputClass} text-sm py-2 dark:bg-slate-700 dark:text-gray-300`}
                            value={novaLavagem.modelo || (veiculoEncontrado?.modelo || '')}
                            onChange={(e) => handleNovaChange("modelo", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. Nome do Cliente */}
                    <div>
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Nome do Cliente</label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={50}
                          value={novaLavagem.nome}
                          onChange={(e) => handleNovaChange("nome", formatarNomeCapitalizado(e.target.value))}
                          className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                          placeholder="Ex: João da Silva"
                        />
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                        <span className="text-[10px] text-gray-400 font-medium">
                          {(novaLavagem.nome || "").length}/50
                        </span>
                      </div>
                    </div>

                    {/* 5. Telefone */}
                    <div>
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Telefone</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={novaLavagem.telefone}
                          placeholder="(99) 99999-9999"
                          maxLength={15}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            v = v.slice(0, 11);
                            if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                            else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                            else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                            else v = v.replace(/^(\d*)/, "($1");
                            handleNovaChange("telefone", v);
                          }}
                          className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ================= COLUNA 2: SERVIÇO E STATUS ================= */}
                  <div>
                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Funcionário Responsável</label>
                      <div className="relative">
                        <select
                          value={novaLavagem.funcionario}
                          onChange={(e) => handleNovaChange("funcionario", e.target.value)}
                          className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                          required
                        >
                          <option value="">Selecione o Lavador</option>
                          {funcionarios.length === 0 && <option disabled>Carregando...</option>}
                          {funcionarios.map((f) => {
                            if (!f._id) return null;
                            return <option key={f._id} value={f._id}>{f.nome}</option>;
                          })}
                        </select>
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-4 pointer-events-none" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Serviço</label>
                      <select required value={novaLavagem.tipoLavagem} onChange={(e) => handleTipoSelectAdd(e.target.value)} className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}>
                        <option value="">Selecione</option>
                        {tiposLavagem.map((t) => {
                          const p = extrairPrecoDoTipo(t);
                          return <option key={t._id} value={t._id}>{p ? `${t.nome} - R$ ${Number(p).toFixed(2)}` : t.nome}</option>;
                        })}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Status</label>
                      <select
                        value={novaLavagem.status || "aguardando"}
                        onChange={(e) => handleNovaChange("status", e.target.value)}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      >
                        <option value="aguardando">Aguardando</option>
                        <option value="em lavagem">Em Lavagem</option>
                        <option value="finalizada">Finalizada</option>
                      </select>
                    </div>

                    {/* === COLE O CÓDIGO DA FORMA DE PAGAMENTO AQUI === */}
                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300 mb-3 block`}>
                        Forma de Pagamento
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'pix', label: 'Pix', icon: <QrCode className="w-4 h-4" /> },
                          { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
                          { id: 'cartao', label: 'Cartão', icon: <CreditCard className="w-4 h-4" /> }
                        ].map((metodo) => (
                          <label
                            key={metodo.id}
                            className={`
                              flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                              ${novaLavagem.formaPagamento === metodo.id
                                ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 dark:bg-slate-700 dark:border-slate-700 dark:text-gray-400"}
                            `}
                          >
                            <input
                              type="radio"
                              name="formaPagamento"
                              value={metodo.id}
                              checked={novaLavagem.formaPagamento === metodo.id}
                              onChange={(e) => handleNovaChange("formaPagamento", e.target.value)}
                              className="sr-only"
                            />
                            <div className={`mb-1 ${novaLavagem.formaPagamento === metodo.id ? "scale-110" : ""} transition-transform`}>
                              {metodo.icon}
                            </div>
                            <span className="text-xs font-bold uppercase">{metodo.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Observações</label>
                      <textarea rows="3" maxLength={500}  value={novaLavagem.observacao} onChange={(e) => handleNovaChange("observacao", e.target.value)} className={`${modernInputClass} dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`} />
                       <span className="text-[10px] text-gray-400 font-medium">
                          {(novaLavagem.observacao || "").length}/500
                        </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* ALTERAÇÃO 4: Footer (Botões) Fixo
                Esta div fica fora do 'overflow-y-auto', então sempre aparece no rodapé do modal.
              */}
              <div className="flex gap-3 p-4 md:p-6 border-t border-gray-100 dark:border-gray-700 mt-auto bg-white dark:bg-gray-800 shrink-0">
                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL EDITAR ================= */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* 1. Container Principal: max-h-[90vh] e flex-col */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative dark:bg-gray-800 flex flex-col max-h-[90vh]">

            {/* 2. Header Fixo (shrink-0 impede que ele seja esmagado) */}
            <div className="bg-white p-4 md:p-5 border-b border-gray-100 flex justify-between items-center dark:bg-blue-600 dark:border-gray-700 shrink-0">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-white">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                  <Edit className="w-5 h-5" />
                </div>{" "}
                Editar Lavagem
              </h3>
              <button onClick={() => setIsEditOpen(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-white/70 dark:hover:text-white" />
              </button>
            </div>

            {/* 3. Form com flex-col e overflow-hidden para conter o scroll interno */}
            <form onSubmit={salvarEdicaoLavagem} className="flex flex-col h-full overflow-hidden">

              {/* 4. Área de Conteúdo Rolável (overflow-y-auto) */}
              <div className="overflow-y-auto p-4 md:p-6 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Coluna 1 */}
                  <div>
                    <div className="mb-4">
                      <label className={modernLabelClass}>Nome do Cliente</label>
                      <input
                        type="text"
                        maxLength={50}
                        value={editingLavagem.nome}
                        onChange={(e) => handleEditChange("nome", formatarNomeCapitalizado(e.target.value))}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      />
                      <span className="text-[10px] text-gray-400 font-medium">
                          {(novaLavagem.nome || "").length}/50
                      </span>
                    </div>
                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Telefone</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={editingLavagem.telefone}
                          placeholder="(99) 99999-9999"
                          maxLength={15}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            v = v.slice(0, 11);
                            if (v.length === 0) {
                              handleEditChange("telefone", "");
                              return;
                            }
                            if (v.length > 10) {
                              v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                            } else if (v.length > 6) {
                              v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                            } else if (v.length > 2) {
                              v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                            } else {
                              v = v.replace(/^(\d*)/, "($1");
                            }
                            handleEditChange("telefone", v);
                          }}
                          className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-4 pointer-events-none" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className={modernLabelClass}>Placa</label>
                      <input
                        type="text"
                        required
                        value={editingLavagem.placa}
                        onChange={(e) => handleEditChange("placa", e.target.value.toUpperCase())}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      />
                    </div>
                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Veículo</label>
                      <select
                        required
                        value={editingLavagem.veiculo || ""}
                        onChange={(e) => setEditingLavagem({ ...editingLavagem, veiculo: e.target.value })}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700 `}
                      >
                        <option value="">Selecione</option>
                        {editingLavagem.veiculo &&
                          !["Carro", "SUV", "Moto", "Van", "Caminhão"].includes(editingLavagem.veiculo) && (
                            <option value={editingLavagem.veiculo}>{editingLavagem.veiculo}</option>
                          )}
                        <option value="Carro">Carro de Passeio</option>
                        <option value="SUV">SUV / Picape</option>
                        <option value="Moto">Moto</option>
                        <option value="Van">Van / Micro-ônibus</option>
                        <option value="Caminhão">Caminhão</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className={`${modernLabelClass} text-blue-600 dark:text-gray-300`}>Modelo (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Corolla, Titan, Gol..."
                        value={editingLavagem.modelo || ""}
                        onChange={(e) => setEditingLavagem({ ...editingLavagem, modelo: e.target.value })}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      />
                    </div>
                  </div>

                  {/* Coluna 2 */}
                  <div>
                    <div className="mb-4">
                      <label className={modernLabelClass}>Funcionário Responsável</label>
                      <div className="relative">
                        <select
                          value={editingLavagem.funcionario}
                          onChange={(e) => handleEditChange("funcionario", e.target.value)}
                          className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700 appearance-none`}
                        >
                          <option value="">Selecione o Lavador</option>
                          {Array.isArray(funcionarios) &&
                            funcionarios.map((f) => {
                              if (!f._id) return null;
                              return (
                                <option key={f._id} value={f._id}>
                                  {f.nome}
                                </option>
                              );
                            })}
                        </select>
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-4 pointer-events-none" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={modernLabelClass}>Serviço</label>
                      <select
                        required
                        value={editingLavagem.tipoLavagem}
                        onChange={(e) => handleTipoSelectEdit(e.target.value)}
                        className={`${modernInputClass} dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      >
                        <option value="">Carregando...</option>
                        {tiposLavagem.map((t) => {
                          const p = extrairPrecoDoTipo(t);
                          return (
                            <option key={t._id} value={t._id}>
                              {p ? `${t.nome} - R$ ${Number(p).toFixed(2)}` : t.nome}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className={modernLabelClass}>Status Atual</label>
                      <select
                        required
                        value={editingLavagem.status}
                        onChange={(e) => handleEditChange("status", e.target.value)}
                        className={`${modernInputClass} pl-10 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      >
                        <option value="aguardando">Em Lavagem / Pendente</option>
                        <option value="em lavagem">Em Lavagem em Andamento</option>
                        <option value="finalizada">Finalizada / Concluída</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className={modernLabelClass}>Observações</label>
                      <textarea
                        rows="3"
                        maxLength={500}
                        value={editingLavagem.observacao}
                        onChange={(e) => handleEditChange("observacao", e.target.value)}
                        className={`${modernInputClass} dark:bg-slate-700 dark:text-gray-300 dark:border-gray-700`}
                      />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {(novaLavagem.observacao || "").length}/500
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Footer (Botões) Fixo no fundo */}
              <div className="flex gap-3 p-4 md:p-6 border-t border-gray-100 mt-auto bg-white dark:bg-gray-800 dark:border-gray-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETAR */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center dark:bg-gray-800">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Confirmar Exclusão</h3>
            <p className="text-gray-500 mb-8 dark:text-gray-200">Tem certeza que deseja excluir a lavagem de <strong className="text-gray-800">{toDelete.nome}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
              <button onClick={confirmarDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" /> Excluir</button>
            </div>
          </div>
        </div>
      )}


    </div>

  );
}
