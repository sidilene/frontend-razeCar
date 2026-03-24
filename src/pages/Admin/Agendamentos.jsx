import React, { useState, useEffect } from "react";
import { API_BASE } from "../../services/api";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Car,
  Check,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  CheckCircle,
  Trash2,
  ExternalLink,
  Save,
  LayoutGrid,
  List,
  Calendar,
  XCircle,
  CarFront,
  Copy,
  Search,
  Loader2,
  DollarSign,
   // Ícone para o funcionário
} from "lucide-react";

export default function Agendamentos() {
  // Estados Gerais
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]); // <--- NOVO ESTADO
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lojaConfig, setLojaConfig] = useState(null);
  const [infoSucesso, setInfoSucesso] = useState(null);

  // Estados do Calendário e Visualização
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

  // Estados do Modal (Criar/Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [isLoadingPlaca, setIsLoadingPlaca] = useState(false);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isPlanAlertOpen, setIsPlanAlertOpen] = useState(false);
  const [planAlertMessage, setPlanAlertMessage] = useState({ title: "", msg: "" });

  const [formData, setFormData] = useState({
    cliente: "",
    telefone: "",
    veiculo: "",
    placa: "",
    servico: "",
    servico_id: "",
    funcionario_id: "", // <--- NOVO CAMPO NO FORM
    data: "",
    horario: "",
    valor: "",
    status: "pendente"
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicBookingLink = lojaConfig?.slug
    ? `${baseUrl}/agendar/${lojaConfig.slug}`
    : (lojaConfig?._id ? `${baseUrl}/agendar/${lojaConfig._id}` : "Carregando link...");

  const handleCopyLink = async () => {
    if (!lojaConfig) return; // Segurança

    try {
      await navigator.clipboard.writeText(publicBookingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  // --- 1. Carregamento Inicial ---
  useEffect(() => {
    fetchServicos();
    fetchFuncionarios(); // <--- BUSCA FUNCIONÁRIOS AO INICIAR
    fetchLojaConfig();
  }, []);

      async function fetchLojaConfig() {
      try {
        const res = await fetch(`${API_BASE}/lavajatos/me`, { credentials: "include" });
        if (!res.ok) throw new Error("Falha ao buscar dados da loja");

        const data = await res.json();

        // 👉 A MÁGICA AQUI: O seu backend manda os dados da loja dentro de "data.lavajato"
        if (data.lavajato) {
          setLojaConfig(data.lavajato);
        } else {
          setLojaConfig(data); // Fallback de segurança
        }

      } catch (error) {
        console.error("Erro ao carregar loja:", error);
      }
    }

  async function fetchServicos() {
    try {
      const res = await fetch(`${API_BASE}/tipos-lavagem`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar serviços");
      const data = await res.json();
      setServicos(data.tiposLavagem || []);
    } catch (error) {
      console.warn("Erro ao buscar serviços:", error);
      setServicos([]);
    }
  }

  // 1. Função para controlar o Input da Placa (Máscara)
  const handlePlacaChange = (e) => {
    // Remove tudo que não for letra ou número, joga pra maiúsculo e limita a 7 chars
    const valorLimpo = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    setFormData({ ...formData, placa: valorLimpo });

    // Se o usuário apagar a placa, limpamos o card do veículo encontrado
    if (valorLimpo.length < 7) {
      setVeiculoEncontrado(null);
    }
  };

  // 2. Função para remover o veículo selecionado (voltar a editar)
  const removerVeiculo = () => {
    setVeiculoEncontrado(null);
    setFormData(prev => ({ ...prev, veiculo: '', cor: '' })); // Opcional: limpar dados
  };

  // 3. Atualize sua função buscarDadosPlaca
  const buscarDadosPlaca = async () => {
    const placaLimpa = formData.placa?.replace(/[^a-zA-Z0-9]/g, '');

    if (!placaLimpa || placaLimpa.length < 7) return;

    setIsLoadingPlaca(true);

    try {
      const response = await fetch(`${API_BASE}/consultar/${placaLimpa}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) throw new Error("Erro na busca");

      const dados = await response.json();
      const veiculoFinal = dados.data || dados;

      if (veiculoFinal && (veiculoFinal.modelo || veiculoFinal.marca)) {
        // SUCESSO: Atualiza o card visual e o form
        setVeiculoEncontrado(veiculoFinal); // <--- Guarda o objeto completo aqui

        setFormData(prev => ({
          ...prev,
          veiculo: `${veiculoFinal.marca || ''} ${veiculoFinal.modelo || ''}`.trim(),
          // Se quiser salvar a cor na observação automaticamente:
          // observacao: `${prev.observacao || ''} [Cor: ${veiculoFinal.cor}]`
        }));
      } else {
        alert("Veículo não encontrado na base.");
      }

    } catch (error) {
      console.error(error);
      // Não usamos alert aqui para não ser intrusivo, apenas deixamos o usuário digitar
    } finally {
      setIsLoadingPlaca(false);
    }
  };

  // NOVA FUNÇÃO: BUSCAR FUNCIONÁRIOS
    async function fetchFuncionarios() {
    try {
      const res = await fetch(`${API_BASE}/lavajatos/usuarios`, { credentials: "include" });

      if (!res.ok) throw new Error("Falha ao buscar funcionários");

      const data = await res.json();

      if (Array.isArray(data)) {
        // Filtra para remover quem tiver o tipo 'dono'
        const apenasFuncionarios = data.filter(usuario => usuario.tipo !== 'dono');
        setFuncionarios(apenasFuncionarios);
      } else {
        setFuncionarios([]);
      }

    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      setFuncionarios([]);
    }
  }

  // --- Carregar agendamentos ---
  useEffect(() => {
    fetchAgendamentos();
  }, [currentDate, viewMode]);

  async function fetchAgendamentos() {
    setLoading(true);
    try {
      const mes = currentDate.getMonth() + 1;
      const ano = currentDate.getFullYear();

      const res = await fetch(`${API_BASE}/agendamentos?mes=${mes}&ano=${ano}`, {
        credentials: "include"
      });

      if (!res.ok) throw new Error(`Erro API: ${res.status}`);

      const data = await res.json();
      const listaBruta = data.agendamentos || [];

      // TRADUÇÃO SEGURA DOS DADOS
      const listaFormatada = listaBruta.map(item => {
        // 1. Proteção de Data
        let dataLocal = "Data Inválida";
        let horaLocal = "--:--";

        if (item.dataHora) {
          const dataObj = new Date(item.dataHora);
          const ano = dataObj.getFullYear();
          const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
          const dia = String(dataObj.getDate()).padStart(2, '0');
          dataLocal = `${ano}-${mes}-${dia}`;
          horaLocal = dataObj.getHours().toString().padStart(2, '0') + ':' +
                      dataObj.getMinutes().toString().padStart(2, '0');
        }

        // 2. Proteção de Serviço
        let nomeServico = "Serviço não identificado";
        let idServico = item.tipoLavagem;
        if (item.tipoLavagem && typeof item.tipoLavagem === 'object') {
           nomeServico = item.tipoLavagem.nome || "Sem Nome";
           idServico = item.tipoLavagem._id;
        } else if (typeof item.tipoLavagem === 'string') {
           const servicoEncontrado = servicos.find(s => s._id === item.tipoLavagem || s.id === item.tipoLavagem);
           if (servicoEncontrado) nomeServico = servicoEncontrado.nome;
        }

        // 3. Proteção de Funcionário (NOVO)
        let idFunc = "";
        if (item.funcionarioId) {
            idFunc = item.funcionarioId._id || item.funcionarioId;
        }

        return {
          id: item._id,
          cliente: item.nome || "Cliente sem nome",
          telefone: item.telefone || "",
          veiculo: item.veiculo || "",
          placa: item.placa || "",
          servico: nomeServico,
          servico_id: idServico,
          funcionario_id: idFunc, // <--- PREENCHE O ESTADO
          valor: item.price || 0,
          status: item.status || "pendente",
          data: dataLocal,
          horario: horaLocal,
          observacao: item.observacao || ""
        };
      });

      setAgendamentos(listaFormatada);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- API: Salvar ---
  async function handleSave(e) {
    e.preventDefault();

    if (!formData.cliente || !formData.data || !formData.horario || !formData.servico_id) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      let idParaEditar = null;
      if (modalMode === 'edit' && selectedAgendamento) {
          idParaEditar = selectedAgendamento.id || selectedAgendamento._id;
      }

      const url = modalMode === 'create' ? `${API_BASE}/agendamentos` : `${API_BASE}/agendamentos/${idParaEditar}`;
      const method = modalMode === 'create' ? "POST" : "PUT";

      const dataHoraCombinada = new Date(`${formData.data}T${formData.horario}:00`);

      const payload = {
        nome: formData.cliente,
        telefone: formData.telefone,
        placa: formData.placa,
        veiculo: formData.veiculo,
        tipoLavagem: formData.servico_id,
        funcionarioId: formData.funcionario_id || null, // <--- ENVIA O FUNCIONÁRIO
        dataHora: dataHoraCombinada.toISOString(),
        price: formData.valor,
        status: formData.status,
        observacao: formData.observacao || ""
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      // 4. VERIFICAÇÃO DE ERROS E PLANO
      if (!res.ok) {

        // A) Lógica de Bloqueio de Plano (Status 403)
        if (res.status === 403 || data.upgrade === true) {

            // Fecha o formulário atual
            closeModal();

            // Configura a mensagem do modal de bloqueio
            setPlanAlertMessage({
                title: "Limite Atingido 👑",
                msg: "Você atingiu o limite de agendamentos do seu plano atual.\n\nFaça um upgrade para continuar agendando."
            });

            // Abre o modal de bloqueio
            setIsPlanAlertOpen(true);

            // 🛑 PARA TUDO AQUI. Não lança erro.
            return;
        }

        // B) Outros erros (Validação, Banco de dados, etc)
        throw new Error(data.error || data.message || "Erro ao salvar agendamento");
      }

      // ==================================================================
      // 5. SUCESSO! (Se chegou aqui, deu tudo certo)
      // ==================================================================

      // Atualiza a lista na tela
      await fetchAgendamentos();

      // Fecha o formulário
      closeModal();

      // Formata dados para o feedback visual
      const diaFormatado = dataHoraCombinada.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const statusMap = {
        'pendente': 'agendado',
        'confirmado': 'confirmado',
        'em_andamento': 'iniciado',
        'concluido': 'concluído',
        'cancelado': 'cancelado'
      };

      const acaoRealizada = statusMap[formData.status] || 'atualizado';

      // Exibe o Modal de Sucesso (feedback verde)
      setInfoSucesso({
        titulo: modalMode === 'create' ? "Sucesso!" : "Atualizado!",
        mensagem: `O serviço do cliente foi ${acaoRealizada} com sucesso.`,
        dadoExtra: `${formData.cliente} • ${diaFormatado} às ${formData.horario}`
      });

    } catch (error) {
      console.error("Erro no handleSave:", error);
      // Aqui só chegam erros de conexão ou validação genérica
      alert(`Erro: ${error.message}`);
    }
  }

  // Função 1: Apenas abre o modal de confirmação
  function handleDeleteRequest() {
    setShowDeleteConfirm(true);
  }

  // --- API: Deletar ---
  // Função 2: Executa a exclusão de fato (conectada ao botão "Excluir" do Modal)
  async function handleConfirmDelete() {
    try {
      await fetch(`${API_BASE}/agendamentos/${selectedAgendamento.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      // Atualiza a lista removendo o item
      setAgendamentos(agendamentos.filter(a => a.id !== selectedAgendamento.id));

      // Fecha o modal de confirmação
      setShowDeleteConfirm(false);

      // Fecha o modal de detalhes (se houver um aberto por baixo)
      closeModal();

    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao excluir agendamento."); // Fallback caso dê erro
    }
  }

  // --- Utils e Navegação ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
      newDate.setDate(1);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNamesShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getWeekRange = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const start = new Date(curr.setDate(first));
    const end = new Date(curr.setDate(first + 6));
    return { start, end };
  };

  // --- Modal Utils ---
  const openNewModal = (dateStr = "") => {
    setModalMode("create");
    setSelectedAgendamento(null);
    setVeiculoEncontrado(null);
    setFormData({
      cliente: "",
      telefone: "",
      veiculo: "",
      placa: "",
      // Campos novos:
      marca: "",
      modelo: "",
      cor: "",
      ano: "",
      anoModelo: "",
      cidade: "",
      uf: "",

      servico: "",
      servico_id: "",
      funcionario_id: "",
      data: dateStr || new Date().toISOString().split('T')[0],
      horario: "08:00",
      valor: "",
      status: "pendente",
      observacao: "" // <-- Importante limpar a observação também
    });
    setIsModalOpen(true);
  };

  const openEditModal = (agendamento) => {
    setModalMode("edit");
    setSelectedAgendamento(agendamento);
    setFormData({ ...agendamento });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    const selectedService = servicos.find(s => (s._id || s.id) == selectedId);

    if (selectedService) {
      setFormData({
        ...formData,
        servico: selectedService.nome,
        servico_id: selectedService._id || selectedService.id,
        valor: selectedService.precoPadrao || selectedService.preco || ""
      });
    } else {
      setFormData({ ...formData, servico: "", servico_id: "", valor: "" });
    }
  };

  const getStatusColor = (status, type = 'bg') => {
    const colors = {
      pendente: { bg: "bg-yellow-50 text-yellow-700", border: "border-yellow-500", dot: "bg-yellow-500" },
      confirmado: { bg: "bg-blue-50 text-blue-700", border: "border-blue-500", dot: "bg-blue-500" },
      finalizado: { bg: "bg-green-50 text-green-700", border: "border-green-500", dot: "bg-green-500" },
      cancelado: { bg: "bg-red-50 text-red-700", border: "border-red-500", dot: "bg-red-500" }
    };
    const theme = colors[status] || colors.pendente;
    if (type === 'border') return theme.border;
    if (type === 'dot') return theme.dot;
    return `${theme.bg} ${theme.border}`;
  };

  const getStatusLabel = (status) => {
    const map = { pendente: "Agendado", confirmado: "Confirmado",  finalizado: "Finalizado", cancelado: "Cancelado" };
    return map[status] || status;
  };



  // --- Renderização do Calendário ---
  const renderDesktopCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let daysToRender = [];

    if (viewMode === 'month') {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      for (let i = 0; i < firstDay; i++) daysToRender.push({ day: null, key: `empty-${i}` });
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        daysToRender.push({ day, dateStr, key: day });
      }
    } else {
      const { start } = getWeekRange();
      const tempDate = new Date(start);
      for (let i = 0; i < 7; i++) {
        const d = new Date(tempDate);
        const dateStr = d.toISOString().split('T')[0];
        daysToRender.push({ day: d.getDate(), dateStr, key: i });
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    return daysToRender.map((item) => {
      if (!item.day) return <div key={item.key} className="bg-gray-50/50 min-h-[120px] border-b border-r border-gray-200 dark:bg-slate-400"></div>;
      const isToday = new Date().toISOString().split('T')[0] === item.dateStr;
      const events = agendamentos.filter(a => a.data === item.dateStr).sort((a, b) => a.horario.localeCompare(b.horario));

      return (
        <div key={item.key} onClick={() => openNewModal(item.dateStr)} className={`min-h-[120px] border-b border-r border-gray-200 p-2 transition-colors hover:bg-gray-50 cursor-pointer relative group dark:bg-slate-600 dark:border-gray-800 dark:hover:bg-slate-500 ${isToday ? 'bg-blue-50/30' : 'bg-white '}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white ' : 'text-gray-700 dark:text-gray-200'}`}>{item.day}</span>
            <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-100 p-1 rounded transition-all"><Plus className="w-3 h-3" /></button>
          </div>
          <div className="space-y-1">
            {events.map(event => (
              <div key={event.id} onClick={(e) => { e.stopPropagation(); openEditModal(event); }} className={`text-xs p-1.5 rounded shadow-sm border-l-4 cursor-pointer hover:brightness-95 truncate ${getStatusColor(event.status)}`} title={`${event.horario} - ${event.cliente}`}>
                <span className="font-bold mr-1">{event.horario}</span>{event.veiculo}
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  const renderMobileList = () => {
    const daysWithEvents = [];
    if (viewMode === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const events = agendamentos.filter(a => a.data === dateStr).sort((a, b) => a.horario.localeCompare(b.horario));
            if (events.length > 0) daysWithEvents.push({ day, dateStr, events, dateObj: new Date(year, month, day) });
        }
    } else {
        const { start } = getWeekRange();
        const tempDate = new Date(start);
        for (let i = 0; i < 7; i++) {
            const d = new Date(tempDate);
            const dateStr = d.toISOString().split('T')[0];
            const events = agendamentos.filter(a => a.data === dateStr).sort((a, b) => a.horario.localeCompare(b.horario));
            if (events.length > 0) daysWithEvents.push({ day: d.getDate(), dateStr, events, dateObj: d });
            tempDate.setDate(tempDate.getDate() + 1);
        }
    }

    if (daysWithEvents.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-gray-400"><CalendarIcon className="w-12 h-12 mb-3 opacity-20" /><p>Nenhum agendamento.</p></div>;

    return (
      <div className="space-y-6 pb-20 ">
        {daysWithEvents.map(({ day, dateStr, events, dateObj }) => (
          <div key={dateStr} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ">
            <div className="flex items-center mb-3 sticky top-0 bg-gray-100 z-10 py-2 dark:bg-gray-800">
              <div className="text-center px-3 py-1 rounded-lg mr-3 bg-white text-gray-700 border border-gray-200 "><span className="block text-xs font-medium uppercase">{dayNamesShort[dateObj.getDay()]}</span><span className="block text-xl font-bold leading-none">{day}</span></div>
              <div className="h-px bg-gray-300 flex-1 "></div>
            </div>
            <div className="space-y-3 pl-2">
              {events.map(event => (
                <div key={event.id} onClick={() => openEditModal(event)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform relative overflow-hidden dark:bg-slate-700 dark:border-gray-800">
                   <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(event.status, 'dot')}`}></div>
                   <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="font-bold text-gray-800 text-lg dark:text-white">{event.horario}</span></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${getStatusColor(event.status)}`}>{getStatusLabel(event.status)}</span>
                   </div>
                   <div className="pl-2">
                      <h4 className="font-semibold text-gray-900 truncate dark:text-white">{event.cliente}</h4>
                      <p className="text-base text-gray-500 truncate dark:text-white">{event.veiculo} • <span className="uppercase">{event.placa}</span></p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-base text-gray-400 block dark:text-gray-200">{event.servico}</span>
                        <span className="text-xs font-bold text-green-600 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 dark:text-green-400">R$ {event.valor ? parseFloat(event.valor).toFixed(2) : '0.00'}</span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPeriodTitle = () => {
      if (viewMode === 'month') {
          return <><h3 className="text-lg md:text-xl font-bold text-gray-800 capitalize dark:text-white">{monthNames[currentDate.getMonth()]}</h3><span className="text-xs md:text-sm text-gray-400 font-medium block -mt-1">{currentDate.getFullYear()}</span></>;
      }
      const { start, end } = getWeekRange();
      return <><h3 className="text-lg md:text-xl font-bold text-gray-800 capitalize dark:text-white">{start.getDate()} - {end.getDate()} {monthNames[end.getMonth()]}</h3><span className="text-xs md:text-sm text-gray-400 font-medium block -mt-1">Semana Atual</span></>;
  };

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-100 min-h-screen dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center text-gray-800 dark:text-gray-200"><CalendarIcon className="mr-3 h-7 w-7 text-blue-600 " /> Agendamentos</h2>
            <p className="text-sm text-gray-500 md:ml-10 dark:text-gray-200">Gerencie sua agenda.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm w-full md:w-auto">
                <button onClick={() => setViewMode('month')} className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'month' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /> Mês</button>
                <button onClick={() => setViewMode('week')} className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'week' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /> Semana</button>
             </div>
             <button onClick={() => openNewModal()} className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow items-center transition-colors"><Plus className="w-5 h-5 mr-2" /> Novo</button>
          </div>
        </div>

        {/* ================================================= */}
      {/* MODAL DE SUCESSO (Agendamento)                    */}
      {/* ================================================= */}
      {infoSucesso && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">

                {/* Ícone de Sucesso */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                {/* Textos */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {infoSucesso.titulo}
                </h3>
                <p className="text-gray-500 mb-6">
                  {infoSucesso.mensagem}
                </p>

                {/* Caixa Cinza com Detalhes */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-center flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Detalhes
                    </span>
                    <div className="text-lg font-bold text-blue-600 break-words w-full px-2">
                        {infoSucesso.dadoExtra}
                    </div>
                </div>

                {/* Botão de Fechar */}
                <button
                  onClick={() => setInfoSucesso(null)}
                  className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95"
                >
                    Concluir
                </button>
            </div>
      </div>
      )}

      {/* ================================================= */}
      {/* MODAL DE AVISO DE PLANO (PREMIUM / BLOQUEIO)      */}
      {/* ================================================= */}
      {isPlanAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

          {/* Overlay Escuro com Blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPlanAlertOpen(false)} // Fecha ao clicar fora (opcional)
          />

          {/* O Card do Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">

            {/* Cabeçalho com Degradê Dourado/Amarelo */}
            <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-6 flex justify-center">
              <div className="bg-white/25 p-4 rounded-full shadow-inner ring-4 ring-white/10 backdrop-blur-md">
                <Lock className="text-white w-8 h-8 drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>

            {/* Conteúdo de Texto */}
            <div className="p-6 text-center space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                {planAlertMessage.title || "Limite Atingido"}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {planAlertMessage.msg || "Você atingiu o limite do seu plano atual."}
              </p>

              {/* Botão de Ação */}
              <button
                onClick={() => setIsPlanAlertOpen(false)}
                className="w-full mt-2 py-3 bg-blue-700 text-white rounded-xl font-semibold
                           hover:bg-blue-800 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">

            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">
              Confirmar Exclusão
            </h3>

            <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
              Tem certeza que deseja excluir este agendamento?<br />
              <span className="text-xs text-red-500 font-semibold">
                Essa ação não pode ser desfeita.
              </span>
            </p>

            <div className="flex gap-3">
              {/* Botão Cancelar: Apenas fecha o modal */}
              <button
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition focus:ring-2 focus:ring-gray-300"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>

              {/* Botão Excluir: Chama a função que faz o FETCH */}
              <button
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-red-500"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={18} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Link Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl shadow-xl p-5 md:p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-10"><ExternalLink size={200} /></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left w-full">
              <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2"><ExternalLink className="w-5 h-5 md:hidden" /> Link de Agendamento</h3>
              <p className="text-blue-100 text-xs md:text-sm mb-4 md:max-w-xl hidden md:block">Envie este link para seus clientes agendarem sozinhos.</p>
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/20 w-full md:max-w-md backdrop-blur-sm">
                  <input
                    type="text"
                    readOnly
                    value={publicBookingLink}
                    className="bg-transparent border-none text-white text-xs md:text-sm px-3 py-2 w-full focus:ring-0 outline-none truncate placeholder-gray-400"
                  />
                  <button
                    onClick={handleCopyLink}
                    disabled={!lojaConfig} // Desabilita se não carregou
                    className={`font-bold px-4 py-2 rounded-lg text-xs md:text-sm flex items-center transition-all shadow-sm shrink-0 ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-white active:bg-blue-50 text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white md:rounded-xl shadow-lg md:border border-gray-200 min-h-[500px] md:overflow-hidden rounded-2xl dark:bg-gray-800 dark:border-gray-700 ">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white md:bg-gray-50 sticky top-0 z-20 md:static rounded-t-2xl dark:bg-gray-800 dark:border-gray-700 ">
            <div className="flex items-center gap-2 md:gap-4 w-full justify-between md:justify-start">
               <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-600 transition-colors "><ChevronLeft className="w-6 h-6" /></button>
               <div className="text-center min-w-[150px]">{renderPeriodTitle()}</div>
               <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-600 transition-colors"><ChevronRight className="w-6 h-6" /></button>
            </div>
            <button onClick={goToToday} className="hidden md:block text-sm text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg font-semibold border border-blue-200 transition-colors dark:bg-blue-700 dark:text-white">Hoje</button>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider text-center py-3 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
              </div>
              <div className="grid grid-cols-7 bg-gray-200 gap-px border-l border-t border-gray-200 dark:bg-slate-400">{renderDesktopCalendar()}</div>
            </div>
          </div>
          <div className="md:hidden p-4 bg-gray-50 min-h-[400px] dark:bg-slate-800">{renderMobileList()}</div>
        </div>
      </div>

      <button onClick={() => openNewModal()} className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-600/40 active:scale-90 transition-transform z-40"><Plus className="w-6 h-6" /></button>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom duration-300 md:fade-in md:zoom-in md:slide-in-from-bottom-0 h-[90vh] md:h-auto flex flex-col  dark:bg-gray-800">
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 dark:bg-gray-800 dark:border-gray-700">
              <div><h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{modalMode === 'create' ? "Novo Agendamento" : "Detalhes do Serviço"}</h3><p className="text-xs text-gray-500 dark:text-gray-200">Preencha as informações abaixo</p></div>
              <button onClick={closeModal} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-gray-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 dark:text-gray-200">Data e Hora</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative"><input required type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 text-sm font-medium appearance-none dark:bg-slate-700 dark:text-gray-300" /></div>
                  <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><input required type="time" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 pl-10 text-sm font-medium appearance-none dark:bg-slate-700 dark:text-gray-200" /></div>
                </div>
              </div>
              <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 dark:text-gray-200">Cliente</h4>
                  <div className="space-y-3">
                    <div className="relative"><User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" /><input required placeholder="Nome completo" type="text" maxLength={50} value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 pl-10 text-sm font-medium dark:bg-slate-700 dark:text-gray-300" /></div>
                    <input
                      placeholder="(DD) 99999-9999"
                      type="tel"
                      maxLength={15}
                      value={formData.telefone}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 11); // Remove letras e limita tamanho
                        v = v.replace(/^(\d{2})(\d)/, "($1) $2"); // Coloca parênteses no DDD
                        v = v.replace(/(\d)(\d{4})$/, "$1-$2");   // Coloca o hífen
                        setFormData({...formData, telefone: v});
                      }}
                      className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 text-sm dark:bg-slate-700 dark:text-gray-300"
                    />
                  </div>
              </div>

              {/* === BLOCO VEÍCULO + RESPONSÁVEL === */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 dark:text-gray-200">
                  Veículo & Equipe
                </h4>

                <div className="space-y-4">

                  {/* CONDIÇÃO: Se achou o veículo, mostra CARD. Se não, mostra INPUTS */}
                  {veiculoEncontrado ? (

                    // --- CARD DE VEÍCULO ENCONTRADO (A "telinha bonitinha") ---
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 dark:bg-slate-700 dark:border-slate-600">
                      <div className="flex items-center gap-4">
                        {/* Ícone ou Logo (Simulado) */}
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-slate-600 dark:text-blue-400">
                          <CarFront className="w-6 h-6" />
                        </div>

                        <div>
                          <h5 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                            {veiculoEncontrado.marca} {veiculoEncontrado.modelo}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-600 border border-gray-200 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300">
                              {formData.placa}
                            </span>
                            <span className="text-xs text-gray-500 capitalize dark:text-gray-400">
                              {veiculoEncontrado.cor || "Cor não inf."} • {veiculoEncontrado.ano || "Ano não inf."}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão para Remover/Trocar */}
                      <button
                        onClick={removerVeiculo}
                        type="button"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-slate-600"
                        title="Alterar veículo"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>

                  ) : (

                    // --- INPUTS PADRÃO (Se não achou ainda) ---
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">

                      {/* 1. PLACA (Agora vem primeiro para incentivar a busca) */}
                      <div className="relative flex items-center">
                        <input
                          placeholder="ABC1D23"
                          type="text"
                          maxLength={10}
                          // maxLength={7}  <-- O onChange já trata isso, mas pode manter
                          value={formData.placa}
                          onChange={handlePlacaChange} // <--- Usa a nova função com máscara
                          onBlur={() => {
                            if(formData.placa?.length === 7) buscarDadosPlaca();
                          }}
                          className={`w-full bg-gray-50 rounded-xl border focus:bg-white focus:ring-0 p-3 pr-10 text-sm font-bold uppercase text-center transition-all dark:bg-slate-700 dark:text-gray-300
                            ${formData.placa?.length === 7 ? 'border-green-300 text-green-700 focus:border-green-500' : 'border-transparent focus:border-blue-500'}
                          `}
                        />

                        {/* Botão de Busca */}
                        <button
                          type="button"
                          onClick={buscarDadosPlaca}
                          disabled={isLoadingPlaca || formData.placa?.length < 7}
                          className="absolute right-2 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                        >
                          {isLoadingPlaca ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* 2. MODELO (Preenchido auto ou manual) */}
                      <div className="relative">
                        <Car className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          required
                          placeholder="Modelo (ex: Gol)"
                          type="text"
                          maxLength={50}
                          value={formData.veiculo}
                          onChange={(e) => setFormData({ ...formData, veiculo: e.target.value })}
                          className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 pl-10 text-sm font-medium dark:bg-slate-700 dark:text-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* SELEÇÃO DE RESPONSÁVEL (Mantido fora da condição para aparecer sempre) */}
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.funcionario_id || ""}
                      onChange={(e) => setFormData({ ...formData, funcionario_id: e.target.value })}
                      className="w-full bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 p-3 pl-10 text-sm font-medium appearance-none dark:bg-slate-700 dark:text-gray-300"
                    >
                      <option value="">Selecione o Responsável...</option>
                      {Array.isArray(funcionarios) && funcionarios.map((f) => {
                        if (!f._id) return null;
                        return <option key={f._id} value={f._id}>{f.nome}</option>;
                      })}
                    </select>
                  </div>

                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 dark:bg-slate-600 dark:text-gray-300 ">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 dark:text-gray-200">Detalhes do Serviço</h4>
                <div className="space-y-4">
                  <select
                    className="w-full bg-white rounded-xl border-gray-200 p-3 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-300"
                    value={formData.servico_id || ""}
                    onChange={handleServiceChange}
                  >
                    <option value="">Selecione o serviço...</option>
                    {servicos.map((servico) => (
                      <option key={servico._id || servico.id} value={servico._id || servico.id}>
                        {servico.nome}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 ml-1 dark:text-gray-200">Valor (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-green-600" />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={formData.valor}
                              className="w-full bg-white rounded-xl border-gray-200 p-3 pl-10 text-sm font-bold text-green-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-green-400"
                            />
                        </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1 ml-1 dark:text-gray-200">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white rounded-xl border-gray-200 p-3 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-300">
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between sticky bottom-0 dark:bg-gray-800 dark:border-gray-700">
              {modalMode === 'edit' ? (<button type="button" onClick={handleDeleteRequest} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-xl text-sm font-medium transition-colors"><Trash2 className="w-5 h-5" /></button>) : <div></div>}
              <div className="flex gap-3 w-full justify-end">
                <button type="button" onClick={closeModal} className="text-gray-600 hover:bg-gray-200 px-6 py-3 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                <button type="submit" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center transition-all active:scale-95"><Save className="w-4 h-4 mr-2" /> Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}




