import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../services/api";
import {
  Car,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertCircle,
  Loader2,
  XCircle,
  Info
} from "lucide-react";


export default function ClientBooking() {
  const { slug } = useParams();

  // --- ESTADOS ---
  const [storeData, setStoreData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Estado para o Modal de Alerta Customizado
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "info" // 'info', 'warning', 'error'
  });

  const [bookingData, setBookingData] = useState({
    serviceId: null,
    serviceName: "",
    serviceImage: "",
    price: 0,
    date: "",
    time: "",
    clientName: "",
    clientPhone: "",
    vehicleModel: "",
    vehiclePlate: ""
  });

  // --- FUNÇÕES DE APOIO ---
  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ show: true, title, message, type });
  };

  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });

  // --- 1. BUSCAR DADOS DA API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!slug) throw new Error("Loja não especificada na URL.");

        const [storeRes, servicesRes] = await Promise.all([
          fetch(`${API_BASE}/public/lavajato/${slug}`),
          fetch(`${API_BASE}/public/tipos-lavagem/${slug}`)
        ]);

        if (!storeRes.ok) throw new Error("Lava Jato não encontrado.");

        const storeJson = await storeRes.json();
        const servicesJson = await servicesRes.json();

        setStoreData(storeJson);
        setServices(servicesJson.tiposLavagem || []);
      } catch (err) {
        console.error("Erro na API:", err);
        setError("Não foi possível carregar as informações.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // --- 2. LÓGICA DE HORÁRIOS ---
  useEffect(() => {
    if (bookingData.date && storeData?.horarios) {
      const [year, month, day] = bookingData.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayIndex = dateObj.getDay();

      const diasSemana = [
        "Domingo", "Segunda", "Terça", "Quarta",
        "Quinta", "Sexta", "Sábado"
      ];

      const selectedDayName = diasSemana[dayIndex];
      const rule = storeData.horarios.find(h => h.day === selectedDayName);

      if (rule && rule.active) {
        const slots = [];

        // Pega as horas e os minutos exatos do banco
        const [startHour, startMinute] = rule.start.split(':').map(Number);
        const [endHour, endMinute] = rule.end.split(':').map(Number);

        // Converte tudo para minutos totais (facilita a matemática)
        let currentMinutes = (startHour * 60) + (startMinute || 0);
        const totalEndMinutes = (endHour * 60) + (endMinute || 0);

        // INTERVALO DE AGENDAMENTO (De quanto em quanto tempo?)
        // Pode ser 30 (meia em meia hora) ou 60 (hora em hora).
        const intervaloMinutos = 30;

        // Loop para gerar os horários até chegar na hora final
        while (currentMinutes < totalEndMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;

          // Formata de volta para "HH:mm"
          const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          slots.push(formattedTime);

          // Pula para o próximo horário
          currentMinutes += intervaloMinutos;
        }

        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    }
  }, [bookingData.date, storeData]);

  // --- 3. ENVIO PARA O BACKEND ---
  const submitBooking = async () => {
    setSubmitting(true);
    try {
      const payload = {
        lavajatoId: storeData._id,
        nome: bookingData.clientName,
        telefone: bookingData.clientPhone,
        placa: bookingData.vehiclePlate,
        veiculo: bookingData.vehicleModel,
        tipoLavagem: bookingData.serviceId,
        dataHora: `${bookingData.date}T${bookingData.time}:00`,
        observacao: "Agendado via link público"
      };

      const response = await fetch(`${API_BASE}/public/agendar/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao criar agendamento.");
      }

      setStep(4);
    } catch (err) {
      showAlert("Ops!", err.message || "Erro ao conectar com o servidor.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !bookingData.serviceId) {
      return showAlert("Serviço", "Por favor, escolha um tipo de lavagem antes de continuar.", "warning");
    }

    if (step === 2 && (!bookingData.date || !bookingData.time)) {
      return showAlert("Data e Hora", "Selecione o melhor dia e horário para você.", "warning");
    }

    if (step === 3) {
      const { clientName, clientPhone, vehicleModel, vehiclePlate } = bookingData;

      // 1. Verifica se tem campo vazio (usando .trim() para evitar que enviem só "espaços")
      if (!clientName.trim() || !clientPhone.trim() || !vehicleModel.trim() || !vehiclePlate.trim()) {
        return showAlert("Dados Faltando", "Preencha todos os campos (nome, telefone, veículo e placa).", "warning");
      }

      // 2. Valida o Telefone (garante que tem pelo menos 10 números - ex: 1199999999)
      const apenasNumerosTelefone = clientPhone.replace(/\D/g, '');
      if (apenasNumerosTelefone.length < 10) {
        return showAlert("Telefone Inválido", "Digite um número de telefone válido com o DDD.", "warning");
      }

      // 3. Valida a Placa (padrão Brasil/Mercosul tem 7 caracteres)
      if (vehiclePlate.length < 7) {
        return showAlert("Placa Inválida", "A placa deve ter pelo menos 7 caracteres.", "warning");
      }

      // Se passou por tudo, envia!
      submitBooking();
      return;
    }

    setStep(step + 1);
  };

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push({
        fullDate: `${year}-${month}-${day}`,
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        dayNum: d.getDate()
      });
    }
    return dates;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-medium animate-pulse text-gray-500">Carregando unidade...</p>
    </div>
  );

  if (error || !storeData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Lava Jato não encontrado</h2>
      <p className="text-gray-500 mt-2">{error}</p>
    </div>
  );

  const primaryColorClass = storeData.tema?.color === 'blue' ? 'bg-blue-600' : 'bg-blue-600';
  const textPrimaryClass = storeData.tema?.color === 'blue' ? 'text-blue-600' : 'text-blue-600';
  const borderColorClass = storeData.tema?.color === 'blue' ? 'border-blue-600' : 'border-blue-600';

  // --- RENDERIZADORES DE ETAPAS ---
  const renderStep1 = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Escolha seu tratamento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((srv) => (
          <div
            key={srv._id}
            onClick={() => setBookingData({
              ...bookingData,
              serviceId: srv._id,
              serviceName: srv.nome,
              price: srv.precoPadrao,
              serviceImage: srv.imagemUrl
            })}
            className={`group rounded-xl border-2 overflow-hidden cursor-pointer transition-all relative ${bookingData.serviceId === srv._id ? `${borderColorClass} ring-2 ring-blue-100 shadow-md` : 'border-gray-100 hover:border-blue-300'}`}
          >
            <div className="h-32 overflow-hidden relative">
              <img src={srv.imagemUrl} alt={srv.nome} className="w-full h-full object-cover" />
              {bookingData.serviceId === srv._id && (
                <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center backdrop-blur-[2px]">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <div className="p-4 bg-white">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800 leading-tight">{srv.nome}</h3>
                <span className={`font-bold text-lg ${textPrimaryClass}`}>R${srv.precoPadrao}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{srv.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Escolha o dia</h2>
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {generateDates().map((date) => (
            <button
              key={date.fullDate}
              onClick={() => setBookingData({ ...bookingData, date: date.fullDate, time: "" })}
              className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${bookingData.date === date.fullDate ? `${primaryColorClass} text-white shadow-lg scale-105` : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'}`}
            >
              <span className="text-xs uppercase font-bold opacity-80">{date.dayName}</span>
              <span className="text-2xl font-bold">{date.dayNum}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Horários disponíveis</h2>
        {bookingData.date && availableSlots.length === 0 ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4"/> Não há horários disponíveis para este dia.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {availableSlots.map((time) => (
              <button
                key={time}
                onClick={() => setBookingData({ ...bookingData, time })}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${bookingData.time === time ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-50' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {time}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Seus dados</h2>
      <div className="space-y-3">

        {/* NOME: Limitado a 100 caracteres */}
        <input
          type="text"
          maxLength={100}
          value={bookingData.clientName}
          onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors shadow-sm"
          placeholder="Nome Completo"
        />

        {/* TELEFONE: Máscara automática (99) 99999-9999 e limite de 15 caracteres */}
        <input
          type="tel"
          maxLength={15}
          value={bookingData.clientPhone}
          onChange={(e) => {
            // Remove tudo que não for número
            let val = e.target.value.replace(/\D/g, '');
            // Aplica a máscara BR
            if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
            if (val.length > 9) val = `${val.slice(0, 10)}-${val.slice(10, 14)}`;

            setBookingData({ ...bookingData, clientPhone: val });
          }}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors shadow-sm"
          placeholder="WhatsApp (DDD)"
        />

        <div className="grid grid-cols-[2fr_1fr] gap-3">
           {/* MODELO DO CARRO: Limitado a 50 caracteres */}
           <input
             type="text"
             maxLength={50}
             value={bookingData.vehicleModel}
             onChange={(e) => setBookingData({ ...bookingData, vehicleModel: e.target.value })}
             className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors shadow-sm"
             placeholder="Modelo do Carro"
           />

           {/* PLACA: Limite de 7 a 10 caracteres, tudo maiúsculo e remove caracteres especiais */}
           <input
             type="text"
             maxLength={10}
             value={bookingData.vehiclePlate}
             onChange={(e) => {
               // Permite apenas letras e números (remove espaços, hífens, etc) e deixa maiúsculo
               const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
               setBookingData({ ...bookingData, vehiclePlate: val });
             }}
             className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors shadow-sm uppercase text-center font-mono"
             placeholder="Placa"
           />
        </div>
      </div>

      <div className="mt-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-4 items-center">
         <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 shadow-sm border border-white">
            {bookingData.serviceImage && <img src={bookingData.serviceImage} className="w-full h-full object-cover" alt="Srv" />}
         </div>
         <div className="flex-1">
             <p className="font-bold text-gray-800 text-sm leading-tight">{bookingData.serviceName}</p>
             <p className="text-xs text-blue-600 font-medium">{bookingData.date.split('-').reverse().join('/')} às {bookingData.time}</p>
         </div>
         <div className="text-right">
             <p className={`font-bold ${textPrimaryClass}`}>R$ {bookingData.price}</p>
         </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
       <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle className="w-12 h-12 text-green-600" />
       </div>
       <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado com Sucesso!</h2>
       <p className="text-gray-500 text-sm mb-8 px-6">Tudo pronto! Seu horário está garantido em <b>{storeData.nome}</b>. Aguardamos você!</p>
       <button onClick={() => window.location.reload()} className={`${primaryColorClass} text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform`}>Fazer outro agendamento</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans relative overflow-x-hidden">

      {/* MODAL DE FEEDBACK CUSTOMIZADO (ALERTS) */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className={`h-2 w-full ${
              alertConfig.type === 'warning' ? 'bg-yellow-400' :
              alertConfig.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`} />

            <div className="p-8 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                alertConfig.type === 'warning' ? 'bg-yellow-50 text-yellow-500' :
                alertConfig.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {alertConfig.type === 'warning' && <AlertCircle className="w-8 h-8" />}
                {alertConfig.type === 'error' && <XCircle className="w-8 h-8" />}
                {alertConfig.type === 'info' && <Info className="w-8 h-8" />}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{alertConfig.title}</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">{alertConfig.message}</p>

              <button
                onClick={closeAlert}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${primaryColorClass}`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-0 sm:h-auto sm:rounded-3xl sm:shadow-2xl sm:my-8 overflow-hidden flex flex-col relative border-x border-gray-100">
        {step < 4 && (
          <div className="relative">
            <div className="h-40 w-full overflow-hidden bg-gray-900">
              <img src={storeData.tema?.coverImage} className="w-full h-full object-cover opacity-70" alt="Capa" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 text-white flex items-end justify-between">
              <div>
                <h1 className="font-bold text-2xl leading-none mb-2">{storeData.nome}</h1>
                <p className="text-gray-300 text-xs flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> {storeData.endereco}</p>
              </div>
              <div className={`w-12 h-12 ${primaryColorClass} rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-xl backdrop-blur-sm`}>
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="bg-white px-8 pt-6 pb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-0 rounded-full"></div>
              <div className={`absolute left-0 top-1/2 h-1 ${primaryColorClass} -z-0 transition-all duration-500 rounded-full`} style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all duration-300 border-4 border-white shadow-sm ${step >= i ? `${primaryColorClass} text-white` : 'bg-gray-200 text-gray-400'}`}>
                  {step > i ? <CheckCircle className="w-6 h-6" /> : i}
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 p-8 pb-28 overflow-y-auto">
           {step === 1 && renderStep1()}
           {step === 2 && renderStep2()}
           {step === 3 && renderStep3()}
           {step === 4 && renderSuccess()}
        </main>

        {step < 4 && (
          <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-md p-6 border-t border-gray-100 flex justify-between items-center z-20">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-4 py-3 text-gray-500 font-bold flex items-center hover:bg-gray-50 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
              </button>
            ) : <div className="w-20"></div>}

            <button
              onClick={handleNext}
              disabled={submitting}
              className={`px-8 py-4 ${primaryColorClass} text-white rounded-2xl font-bold shadow-xl flex items-center transition-all active:scale-95 disabled:opacity-70`}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === 3 ? 'Confirmar Agendamento' : 'Continuar'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
