import React, { useState, useEffect } from "react";
import { API_BASE } from "../../services/api";
import {
  Store,
  LayoutGrid,
  Save,
  Trash2,
  Image as ImageIcon,
  Settings,
  Smartphone,
  Edit3,
  X,
  AlertTriangle,
  Copy,
  Upload,
  MapPin,
  CheckCircle,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

// --- CONFIGURAÇÃO DA API ---
const API_URL = API_BASE; // Ajuste conforme necessário



export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("services");
  const [expandHours, setExpandHours] = useState(false);
  const [loading, setLoading] = useState(false);
  const [infoSucesso, setInfoSucesso] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);



  // Armazena o ID do Lavajato logado para usar no PUT
  const [lavajatoId, setLavajatoId] = useState(null);

  // --- ESTADO: CONFIGURAÇÃO DA LOJA ---
  const [config, setConfig] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    color: "blue",
    coverImage: null, // URL da imagem (vinda do banco ou preview)
    coverFile: null,  // Arquivo real (File Object) para upload
    availability: [
      { day: "Segunda-feira", active: true, start: "08:00", end: "18:00" },
      { day: "Terça-feira", active: true, start: "08:00", end: "18:00" },
      { day: "Quarta-feira", active: true, start: "08:00", end: "18:00" },
      { day: "Quinta-feira", active: true, start: "08:00", end: "18:00" },
      { day: "Sexta-feira", active: true, start: "08:00", end: "18:00" },
      { day: "Sábado", active: true, start: "09:00", end: "14:00" },
      { day: "Domingo", active: false, start: "09:00", end: "12:00" },
    ]
  });

  const [copied, setCopied] = useState(false);

  // CORREÇÃO: Usar 'config' em vez de 'lavajato'
  // O uso do optional chaining (?.) evita erros antes do fetch terminar
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/agendar/${config.slug || 'carregando...'}`;

  const handleCopy = async () => {
    try {
      // Se não houver slug ainda, não copia ou copia o ID
      const textToCopy = config.slug ? publicUrl : "Link ainda não disponível";
      await navigator.clipboard.writeText(textToCopy);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  // --- ESTADO: SERVIÇOS ---
  const [services, setServices] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Estado do formulário de serviço
  const [currentService, setCurrentService] = useState({
    id: null,
    name: "",
    price: "",
    image: "",
    desc: "",
    fileObject: null
  });

  // --- EFEITO: CARREGAR DADOS AO ABRIR ---
  useEffect(() => {
    fetchServices();
    fetchConfig(); // Agora chamamos a configuração real
  }, []);

  // --- AÇÕES DE API ---

  // 1. Carregar Configurações da Loja (/lavajatos/me)
 const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/lavajatos/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Falha ao carregar loja");

      const data = await response.json();



      // 👉 1. Pegamos o ID de dentro da caixa 'lavajato'
      if (data.lavajato && data.lavajato._id) {
        setLavajatoId(data.lavajato._id);
      }

      // 👉 2. Preenchemos a tela acessando 'data.lavajato...'
      setConfig(prev => ({
        ...prev,
        // Atenção aqui: o seu backend chama de 'nomeLavajato'
        name: data.lavajato.nomeLavajato || "",
        slug: data.lavajato.slug || generateSlug(data.lavajato.nomeLavajato || ""),
        phone: data.lavajato.telefone || "",
        address: data.lavajato.endereco || "",
        color: data.lavajato.tema?.color || "blue",
        coverImage: data.lavajato.tema?.coverImage || null,
        coverFile: null,
        availability: (data.lavajato.horarios && data.lavajato.horarios.length > 0)
            ? data.lavajato.horarios
            : prev.availability
      }));

    } catch (error) {
      console.error("Erro ao buscar config:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/tipos-lavagem`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Falha ao buscar dados");

      const data = await response.json();

      // Mapeamento dos dados do backend para o front
      const mappedServices = data.tiposLavagem.map(item => ({
        id: item._id,
        name: item.nome,
        price: item.precoPadrao,
        image: item.imagemUrl,
        desc: item.descricao || ""
      }));

      setServices(mappedServices);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  // Upload Genérico (Funciona para Capa e Serviço)
  // Adicione esta função dentro do seu componente
  const handleFileUpload = (e, targetType) => {
      const file = e.target.files[0];

      if (file) {
        // --- VALIDAÇÃO DE TIPO ---
        // Lista de tipos permitidos (JPEG, PNG, WEBP)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

        if (!validTypes.includes(file.type)) {
          alert("Formato de arquivo inválido! Por favor, envie apenas imagens (JPG, PNG ou WEBP).");
          e.target.value = ""; // Limpa o input para permitir nova seleção
          return; // Para a execução aqui
        }

        // --- VALIDAÇÃO DE TAMANHO (OPCIONAL - Ex: Máx 5MB) ---
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
          alert("A imagem é muito grande! O tamanho máximo permitido é 5MB.");
          e.target.value = "";
          return;
        }

        // Se passou nas validações, continua o processo normal
        const reader = new FileReader();
        reader.onloadend = () => {
          if (targetType === 'cover') {
            setConfig(prev => ({
              ...prev,
              coverImage: reader.result,
              coverFile: file
            }));
          } else if (targetType === 'service') {
            setCurrentService(prev => ({
              ...prev,
              image: reader.result,
              fileObject: file
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    };

      const generateSlug = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos (á -> a)
        .trim()
        .replace(/\s+/g, '-')     // Substitui espaços por hífens
        .replace(/[^\w\-]+/g, '') // Remove caracteres especiais (ex: !, @, #)
        .replace(/\-\-+/g, '-');  // Remove hífens duplicados
    };

      const handleNameChange = (e) => {
      const newName = e.target.value;

      setConfig((prev) => {
        // Verifica se o slug está vazio ou se é igual ao gerado anteriormente pelo nome antigo
        // Se estiver vazio, gera um novo slug em tempo real
        const shouldUpdateSlug = !prev.slug || prev.slug.trim() === "";

        return {
          ...prev,
          name: newName,
          slug: shouldUpdateSlug ? generateSlug(newName) : prev.slug
        };
      });
    };

    // --- SALVAR CONFIGURAÇÃO DA LOJA ---
    const handleSaveConfig = async () => {
      if (!lavajatoId) {
          alert("Erro: ID da loja não carregado. Recarregue a página.");
          return;
      }

      setLoading(true);

      try {
          const formData = new FormData();

          // --- LÓGICA DO SLUG AUTOMÁTICO ---
          let finalSlug = config.slug;

          // Se o slug estiver vazio ou for só espaços em branco
          if (!finalSlug || finalSlug.trim() === "") {
              // Usa o nome para gerar o slug
              finalSlug = generateSlug(config.name);
          } else {
              // Mesmo se o usuário digitou, é bom garantir a formatação
              finalSlug = generateSlug(finalSlug);
          }
          // ---------------------------------

          // Campos de Texto
          formData.append("nomeLavajato", config.name);
          formData.append("slug", finalSlug); // <--- Usa a variável tratada aqui
          formData.append("address", config.address);
          formData.append("telefone", config.phone);
          formData.append("color", config.color);

          // Objeto complexo vira JSON string
          formData.append("availability", JSON.stringify(config.availability));

          // Arquivo de Imagem
          if (config.coverFile) {
              formData.append("capa", config.coverFile);
          }

          // Envia para PUT /lavajatos/:id
          const response = await fetch(`${API_URL}/lavajatos/${lavajatoId}`, {
              method: 'PUT',
              credentials: 'include',
              body: formData
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Erro ao salvar config");
          }

          const data = await response.json();

          // Atualiza estado com nova imagem se houver
          if (data.lavajato && data.lavajato.tema && data.lavajato.tema.coverImage) {
              setConfig(prev => ({
                  ...prev,
                  coverImage: data.lavajato.tema.coverImage,
                  coverFile: null
              }));
          }

          // Opcional: Atualizar o campo slug na tela para o usuário ver o que foi gerado
          setConfig(prev => ({ ...prev, slug: finalSlug }));

          setInfoSucesso({
            titulo: "Loja Atualizada!",
            mensagem: "As configurações e aparência da sua loja foram salvas.",
            dadoExtra: config.name // Mostra o nome da loja no modal
        });

      } catch (error) {
          alert("Erro ao salvar: " + error.message);
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const handleDayChange = (index, field, value) => {
    setConfig(prevConfig => {
      // 1. Criamos uma cópia PROFUNDA do array de availability usando map
      // Isso evita problemas de mutação direta do estado anterior.
      const newAvailability = prevConfig.availability.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value }; // Atualiza só o dia clicado
        }
        return item; // Mantém os outros dias intactos
      });

      // 2. Retorna o novo estado completo do config
      return {
        ...prevConfig,
        availability: newAvailability
      };
    });
  };

  // --- CRUD SERVIÇOS ---

  const handleEditService = (service) => {
    setCurrentService({
        id: service.id,
        name: service.name,
        price: service.price,
        image: service.image,
        desc: service.desc,
        fileObject: null
    });
    setIsEditing(true);
  };

  const handleNewService = () => {
    // Reseta completamente o estado
    setCurrentService({ id: null, name: "", price: "", image: "", desc: "", fileObject: null });
    setIsEditing(true);
  }

    // 1. Função chamada pelo botão na lista (apenas abre o modal)
  const handleRequestDelete = (id) => {
      setServiceToDelete(id);
      setShowDeleteModal(true);
  };

  // 2. Função que realmente deleta (chamada pelo botão do Modal)
  const confirmDelete = async () => {
      if (!serviceToDelete) return;

      try {
          const response = await fetch(`${API_URL}/tipos-lavagem/${serviceToDelete}`, {
              method: 'DELETE',
              credentials: 'include',
          });

          if (!response.ok) throw new Error("Erro ao deletar");

          // Atualiza a lista na tela
          setServices(prev => prev.filter(s => s.id !== serviceToDelete));

          // Fecha o modal e limpa o ID
          setShowDeleteModal(false);
          setServiceToDelete(null);

      } catch (err) {
          console.error(err);
          // Opcional: Aqui você pode colocar um toast/notificação de erro customizado
          // Se quiser manter o alert apenas para erro por enquanto:
          // alert("Erro ao excluir serviço.");
      }
  };

  const saveService = async () => {
    if (!currentService.name || !currentService.price) {
        alert("Por favor, preencha o nome e o preço.");
        return;
    }

    setLoading(true);

    try {
        const formData = new FormData();
        formData.append("nome", currentService.name);
        formData.append("precoPadrao", currentService.price);
        formData.append("descricao", currentService.desc || "");

        // Só envia imagem se o usuário selecionou uma nova
        if (currentService.fileObject) {
            formData.append("imagem", currentService.fileObject);
        }

        let url = `${API_URL}/tipos-lavagem`;
        let method = 'POST';

        if (currentService.id) {
            url = `${API_URL}/tipos-lavagem/${currentService.id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Erro ao salvar");
        }

        await fetchServices(); // Recarrega a lista
        setIsEditing(false); // Fecha o modal
        // --- AQUI É A MUDANÇA ---
        // Removemos o alert e ativamos o modal de sucesso
        setInfoSucesso({
            titulo: currentService.id ? "Atualizado!" : "Sucesso!",
            mensagem: "A operação foi realizada com sucesso.",
            dadoExtra: currentService.name // Vai aparecer na caixinha azul
        });

    } catch (error) {
        console.error(error);
        alert("Erro ao salvar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  {/*
  const themeColors = {
    blue: "bg-blue-600",
    red: "bg-red-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    black: "bg-gray-900",
  };
  */}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800 dark:bg-gray-900 dark:text-gray-200 ">

      {/* --- Sidebar --- */}
      <aside className="w-full md:w-64 bg-white  flex-shrink-0 rounded-2xl  dark:bg-gray-800">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
             <Settings size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Painel Admin</h1>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveTab("config")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'}`}
          >
            <Store size={18} /> Minha Loja
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'services' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'}`}
          >
            <LayoutGrid size={18} /> Serviços e Preços
          </button>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white text-center dark:from-blue-700 dark:to-gray-800">
              <p className="text-xs text-gray-400 mb-3 dark:text-gray-200">
                  Visualizar site do cliente
              </p>

              <div className="flex flex-col gap-2">
                  {/* Botão de Abrir */}
                  <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                      <Smartphone size={16} /> Abrir Link
                  </a>

                  {/* Botão de Copiar */}
                  <button
                      onClick={handleCopy}
                      className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          copied ? 'bg-green-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                      {copied ? (
                          <> <CheckCircle2 size={16} /> Copiado! </>
                      ) : (
                          <> <Copy size={16} /> Copiar Link </>
                      )}
                  </button>
          </div>
        </div>

      </div>
      </aside>

      {/* --- Área de Conteúdo --- */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* ================= MODAL DE SUCESSO (CONFIGURAÇÃO) ================= */}
        {infoSucesso && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">

                  {/* Ícone de Sucesso */}
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>

                  {/* Título e Mensagem */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {infoSucesso.titulo}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {infoSucesso.mensagem}
                  </p>

                  {/* Caixa Cinza com Detalhes da Loja */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-center flex-col gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          {/* Se não tiver importado Store, use Calendar mesmo */}
                          <Store className="w-3 h-3" /> Loja Configurada
                      </span>
                      <div className="text-lg font-bold text-blue-600 break-words w-full px-2">
                          {infoSucesso.dadoExtra}
                      </div>
                  </div>

                  {/* Botão Concluir */}
                  <button
                    onClick={() => setInfoSucesso(null)}
                    className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95"
                  >
                      Concluir
                  </button>
              </div>
          </div>
        )}

        {/* TAB: CONFIGURAÇÃO DA LOJA */}
        {activeTab === "config" && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-bold mb-1">Personalizar Loja</h2>
              <p className="text-gray-500 dark:text-gray-200">Altere como sua empresa aparece e funciona.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 dark:bg-gray-800 dark:border-gray-700">

               {/* Seção 1: Identidade */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1 dark:text-gray-200">Nome do Negócio</label>
                   <input
                     type="text"
                     value={config.name}
                     maxLength={100} // 👈 Limite Visual
                     onChange={handleNameChange} // <--- Use a nova função aqui
                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1 dark:text-gray-200">Link (Slug)</label>
                   <div className="flex items-center">
                       <span className="bg-gray-100 border border-r-0 rounded-l-lg p-2 text-gray-500 text-sm dark:bg-slate-700 dark:text-gray-200">agende.ai/</span>
                       <input
                         type="text"
                         value={config.slug}
                          maxLength={50} // 👈 Limite Visual
                         onChange={(e) => setConfig({ ...config, slug: generateSlug(e.target.value.slice(0, 50)) })}
                         className="w-full p-2 border rounded-r-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                       />
                   </div>
                 </div>
               </div>

               {/* Seção 2: Contato e Endereço */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-1 dark:text-gray-200">
                        <MapPin size={14}/> Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={config.address}
                      maxLength={200}
                      onChange={(e) => setConfig({...config, address: e.target.value.slice(0, 200)})}
                      placeholder="Rua, Número, Bairro - Cidade"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-1 dark:text-gray-200">
                        <Phone size={14}/> Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={config.phone}
                      maxLength={20} // 👈 Limite Visual
                      onChange={(e) => setConfig({...config, phone: e.target.value.slice(0, 20)})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
               </div>

               {/* Seção 3: Horários de Funcionamento */}
               <div className="border-t border-gray-400 pt-4">
                  <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 dark:text-gray-200 ">
                          <Clock size={14}/> Definição de Horários
                      </label>
                  </div>

                  <div className="space-y-3 animate-in fade-in">
                      {config.availability.map((item, index) => {
                          if (!expandHours && index >= 2) return null;
                          return (
                            <div key={item.day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${item.active ? 'bg-white border-gray-200 dark:bg-slate-700 dark:border-gray-700' : 'bg-gray-50 border-transparent dark:bg-gray-800'}`}>
                                <div className="flex items-center gap-3 mb-2 sm:mb-0 w-32">
                                    <button
                                      onClick={() => handleDayChange(index, 'active', !item.active)}
                                      className={`transition-colors ${item.active ? 'text-green-600' : 'text-gray-300 '}`}
                                    >
                                        {item.active ? <CheckCircle2 size={22} className="fill-green-100" /> : <Circle size={22} />}
                                    </button>
                                    <span className={`font-medium ${item.active ? 'text-gray-900 dark:text-gray-200 ' : 'text-gray-400'}`}>{item.day}</span>
                                </div>

                                {item.active ? (
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                                <span className="text-xs text-gray-400 font-semibold dark:text-green-500">Abre</span>
                                                <input
                                                  type="time"
                                                  value={item.start}
                                                  onChange={(e) => handleDayChange(index, 'start', e.target.value)}
                                                  className="bg-transparent font-medium text-sm focus:outline-none"
                                                />
                                            </div>
                                            <span className="text-gray-300">-</span>
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                                <span className="text-xs font-semibold text-gray-400 dark:text-red-400">Fecha</span>
                                                <input
                                                  type="time"
                                                  value={item.end}
                                                  onChange={(e) => handleDayChange(index, 'end', e.target.value)}
                                                  className="bg-transparent font-medium text-sm focus:outline-none "
                                                />
                                            </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 text-right text-sm text-gray-400 italic">
                                            Fechado
                                    </div>
                                )}
                            </div>
                          );
                      })}
                  </div>

                  <button
                    onClick={() => setExpandHours(!expandHours)}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 border-dashed"
                  >
                      {expandHours ? (
                        <>Recolher Horários <ChevronUp size={20}/></>
                      ) : (
                        <>Ver restante da semana (5 dias) <ChevronDown size={20}/></>
                      )}
                  </button>
               </div>

               {/*

               <div className="border-t border-gray-100 pt-4">
                 <label className="block text-xs font-bold uppercase text-gray-500 mb-2 dark:text-gray-200">Cor do Tema</label>
                 <div className="flex gap-3">
                    {Object.keys(themeColors).map((colorKey) => (
                        <button
                           key={colorKey}
                           onClick={() => setConfig({...config, color: colorKey})}
                           className={`w-10 h-10 rounded-full ${themeColors[colorKey]} ${config.color === colorKey ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''} transition-all`}
                        />
                    ))}
                 </div>
               </div>
               */}


               {/* Seção 5: Capa */}
               <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 dark:text-gray-200">Imagem de Capa</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors relative cursor-pointer">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                            onChange={(e) => handleFileUpload(e, 'cover')}
                            accept="image/*"
                        />

                        {config.coverImage ? (
                            <div className="w-full h-40 rounded-lg overflow-hidden relative group">
                                <img src={config.coverImage} className="w-full h-full object-cover" alt="Preview"/>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                                    <Upload size={20} className="mr-2"/> Trocar Imagem
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                                    <Upload size={24} />
                                </div>
                                <span className="text-sm text-gray-500">Clique para fazer upload da capa</span>
                            </div>
                        )}
                    </div>
               </div>
            </div>

            <button
                onClick={handleSaveConfig}
                disabled={loading}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {loading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        )}

        {/* TAB: GERENCIAR SERVIÇOS */}
        {activeTab === "services" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Meus Serviços</h2>
                    <p className="text-gray-500 dark:text-gray-200">Edite os serviços que você oferece.</p>
                </div>
                <button onClick={handleNewService} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-transform active:scale-95 dark:shadow-blue-900 flex items-center gap-2">
                    + Novo Serviço
                </button>
             </div>

             {/* Se estiver vazio */}
             {services.length === 0 && (
                <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed flex flex-col items-center">
                    <Store size={48} className="text-gray-200 mb-2"/>
                    Nenhum serviço cadastrado ainda.
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((srv) => (
                    <div key={srv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:shadow-md transition-all group dark:bg-gray-800 dark:border-gray-700">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
                             {srv.image ? (
                                <img src={srv.image} className="w-full h-full object-cover" alt={srv.name} />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon /></div>
                             )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1 break-all" title={srv.name}>
                                {srv.name}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1 dark:text-gray-100 break-all">
                                {srv.desc}
                                </p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-blue-600 text-lg">R$ {Number(srv.price).toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditService(srv)} className="p-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-500 transition-colors"><Edit3 size={16}/></button>
                                    <button onClick={() => handleRequestDelete(srv.id)} className="p-2 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 relative dark:bg-gray-800">

                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">
                    Confirmar Exclusão
                </h3>

                <p className="text-gray-500 mb-8 leading-relaxed dark:text-gray-300">
                    Tem certeza que deseja excluir este serviço? <br />
                    <span className="text-xs text-red-500">Essa ação não pode ser desfeita.</span>
                </p>

                <div className="flex gap-3">
                    <button
                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setServiceToDelete(null);
                        }}
                    >
                        Cancelar
                    </button>

                    <button
                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2"
                        onClick={confirmDelete}
                    >
                        <Trash2 size={18} />
                        <span>Excluir</span>
                    </button>
                </div>
            </div>
        </div>
    )}

      {/* --- MODAL DE EDIÇÃO DE SERVIÇO --- */}
      {isEditing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 dark:bg-gray-800">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 dark:bg-blue-700 ">
                      <h3 className="font-bold text-lg">{currentService.id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                      <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                  </div>

                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-gray-200">Nome do Serviço</label>
                          <input
                            type="text"
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                            value={currentService.name}
                            onChange={(e) => setCurrentService({...currentService, name: e.target.value.slice(0, 50)})}
                            placeholder="Ex: Lavagem Simples"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-gray-200">Preço (R$)</label>
                          <input
                            type="number"
                            min="0"
                            max="99999"
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none dark:bg-gray-700 dark:border-gray-600"
                            value={currentService.price}
                            onChange={(e) => {
                              let valorSeguro = e.target.value.replace("-", "").slice(0, 8);
                              setCurrentService({...currentService, price: valorSeguro});
                            }}
                            placeholder="0.00"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-gray-200">Imagem do Serviço</label>
                          <div className="flex gap-4 items-start">
                             <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition text-gray-500">
                                    <Upload size={20} />
                                    <span className="text-xs font-medium">Selecionar Foto</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'service')}
                                        accept="image/*"
                                    />
                                </div>
                             </label>

                             {currentService.image && (
                                 <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                     <img src={currentService.image} className="w-full h-full object-cover" alt="Preview" />
                                 </div>
                             )}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-gray-200">Descrição</label>
                          <textarea
                            maxLength={300}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none dark:bg-gray-700 dark:border-gray-600"
                            rows="3"
                            value={currentService.desc}
                            onChange={(e) => setCurrentService({...currentService, desc: e.target.value.slice(0, 300)})}
                            placeholder="Descreva o que está incluso neste serviço..."
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-200 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>

                      <button
                        onClick={saveService}
                        disabled={loading}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? 'Salvando...' : 'Salvar Serviço'}
                      </button>
                  </div>
              </div>
          </div>
      )}



      {infoSucesso && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300 relative">

                {/* Ícone */}
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

                {/* Detalhes */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-center flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Serviço Salvo
                    </span>
                    <div className="text-lg font-bold text-blue-600 break-words w-full px-2">
                        {infoSucesso.dadoExtra}
                    </div>
                </div>

                {/* Botão */}
                <button
                  onClick={() => setInfoSucesso(null)}
                  className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform active:scale-95"
                >
                    Concluir
                </button>
            </div>
      </div>
      )}
    </div>
  );
}
