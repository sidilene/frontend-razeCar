import React, { useEffect, useState } from "react";
import { API_BASE } from "../../services/api";
import {
  LayoutDashboard,
  ArrowUp,
  LineChart,
  PieChart,
  CalendarCheck,
  DollarSign,
  Car,
  Eye,
  EyeOff,
  Users,
  QrCode,
  CreditCard,
  Banknote,

} from "lucide-react";
import { Chart, registerables } from "chart.js";


// Registra os componentes necessários do Chart.js
Chart.register(...registerables);

export default function Dashboard() {
  // Estado para armazenar os dados da API
  const [dashboardData, setDashboardData] = useState(null);
  // Estado para controlar o tema atual
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Monitora a troca de classe 'dark' no HTML/Body
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Checa ao montar
    checkDarkMode();

    // Cria observador para mudanças futuras na classe do HTML
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // 2. Busca dados da API (apenas uma vez)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/dashboard`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
      }
    }
    fetchData();
  }, []);

  // 3. Renderiza os gráficos (sempre que os dados ou o tema mudarem)
  useEffect(() => {
    if (!dashboardData) return;

    // Destrói gráficos antigos para não sobrepor
    Object.values(Chart.instances).forEach((instance) => instance.destroy());

    renderCharts(dashboardData, isDarkMode);

    return () => {
      Object.values(Chart.instances).forEach((instance) => instance.destroy());
    };
  }, [dashboardData, isDarkMode]);

  // --- Função que desenha os gráficos ---
  function renderCharts(data, isDark) {
    const textColor = isDark ? "#e5e7eb" : "#374151";

    // LOGICA DAS LINHAS: Brancas no dark, Pretas (padrão) no light
    const gridColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)";

    const getCommonOptions = () => ({
      responsive: true,
      color: textColor,
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        },
        y: {
          ticks: { color: textColor },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        }
      }
    });

    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const getMonthName = (num) => monthNames[num - 1] || num;

    // --- Gráfico 1: Faturamento Semanal ---
    const ctxWeeklyRevenue = document.getElementById("weeklyRevenueChart");
    if (ctxWeeklyRevenue) {
      const options = getCommonOptions();
      options.scales.y.ticks.callback = (value) => new window.Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      options.plugins.tooltip = {
          callbacks: { label: (context) => new window.Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw) }
      };

      new Chart(ctxWeeklyRevenue, {
        type: "line",
        data: {
          labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
          datasets: [{
            label: "Faturamento (R$)",
            data: data?.charts?.faturamentoSemanal?.map(d => d.total) ?? [],
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            tension: 0.4,
            fill: true
          }]
        },
        options: options
      });
    }

    // --- Gráfico 2: Distribuição de Serviços ---
    const ctxWashType = document.getElementById("washTypeChart");
    if (ctxWashType) {
      new Chart(ctxWashType, {
        type: "doughnut",
        data: {
          labels: data?.charts?.distribuicaoServicos?.map(d => d.nome) ?? [],
          datasets: [{
            data: data?.charts?.distribuicaoServicos?.map(d => d.total) ?? [],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
            borderColor: isDark ? "#1f2937" : "#ffffff",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
              legend: { labels: { color: textColor } }
          }
        }
      });
    }

    // --- Gráfico 3: Lavagens por mês ---
    const ctxMonthlyWashes = document.getElementById("monthlyWashesChart");
    if (ctxMonthlyWashes) {
      new Chart(ctxMonthlyWashes, {
        type: "bar",
        data: {
          labels: data?.charts?.lavagensPorMes?.map(d => getMonthName(d._id)) ?? [],
          datasets: [{ label: "Lavagens", data: data?.charts?.lavagensPorMes?.map(d => d.total) ?? [], backgroundColor: "rgba(16, 185, 129, 0.7)"  }]

        },
        options: getCommonOptions()
      });
    }

    // --- Gráfico 4: Receita por mês ---
    const ctxMonthlyRevenue = document.getElementById("monthlyRevenueChart");
    if (ctxMonthlyRevenue) {
      const options = getCommonOptions();
      options.scales.y.ticks.callback = (value) => new window.Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      new Chart(ctxMonthlyRevenue, {
        type: "bar",
        data: {
          labels: data?.charts?.receitaPorMes?.map(d => getMonthName(d._id)) ?? [],
          datasets: [{ label: "R$", data: data?.charts?.receitaPorMes?.map(d => d.total) ?? [], backgroundColor: "rgba(245, 158, 11, 0.7)" }]
        },
        options: options
      });
    }

    // --- Gráfico 5: Veículos por Categoria ---


    const ctxVehicle = document.getElementById("vehicleCategoryChart");

    if (ctxVehicle) {
      // 1. Prepara os dados (Top 5)
      const top5Veiculos = data?.charts?.veiculosPorCategoria?.slice(0, 5) ?? [];

      // 2. Verifica se o modo Dark está ativo (supondo uso de Tailwind com classe 'dark' no html)
      const isDark = document.documentElement.classList.contains('dark');

      // Define as cores baseadas no tema
      const textColor = isDark ? '#e5e7eb' : '#374151'; // (Gray-200 no dark, Gray-700 no light)
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

      new Chart(ctxVehicle, {
        type: "bar",
        data: {
          labels: top5Veiculos.map(d => d._id),
          datasets: [{
            label: "Total",
            data: top5Veiculos.map(d => d.total),
            backgroundColor: [
              "rgba(59,130,246,0.8)", // Aumentei um pouco a opacidade para ficar mais vibrante
              "rgba(249,115,22,0.8)",
              "rgba(22,163,74,0.8)",
              "rgba(147,51,234,0.8)",
              "rgba(234,179,8,0.8)"
            ],
            // --- ESTILO MODERNO ---
            borderRadius: 6,         // Arredonda os cantos superiores
            barPercentage: 0.6,      // Deixa a barra mais fina (0.5 a 0.7 é o ideal moderno)
            categoryPercentage: 0.8, // Espaçamento entre as categorias
            borderSkipped: false,    // Opcional: arredonda levemente a base também se desejar
          }]
        },
        options: {
          ...getCommonOptions(),

          // Removemos as linhas de grade do eixo X para limpar o visual
          scales: {
            x: {
              ticks: {
                display: false
              },
              grid: {
                display: false,
                drawBorder: false // Remove a linha de base do eixo X para um look mais "flutuante"
              }
            },
            y: {
              ticks: {
                color: textColor, // <--- APLICA A COR BRANCA/CINZA AQUI
                font: {
                    size: 11,
                    family: "'Inter', sans-serif" // Se estiver usando fonte Inter/Roboto
                }
              },
              grid: {
                color: gridColor, // Ajusta a cor das linhas de grade para ficarem sutis no dark mode
                borderDash: [5, 5] // (Opcional) Deixa as linhas tracejadas (muito usado em dashboards modernos)
              },
              border: {
                display: false // Remove a linha vertical do eixo Y (limpeza visual)
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 24, 39, 0.9)', // Tooltip invertido (fundo claro no dark, fundo escuro no light)
              titleColor: isDark ? '#111827' : '#ffffff',
              bodyColor: isDark ? '#111827' : '#ffffff',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                title: function(tooltipItems) {
                  return tooltipItems[0].label;
                }
              }
            }
          }
        }
      });
    }

    // --- Gráficos 6 & 7: Funcionários ---
    const createHorizontalChart = (ctxId, chartData, color, borderColor) => {
        const ctx = document.getElementById(ctxId);
        if(!ctx) return;
        const options = getCommonOptions();
        options.indexAxis = 'y';

        new Chart(ctx, {
            type: "bar",
            data: {
              labels: chartData?.map(d => d.nome) ?? [],
              datasets: [{
                label: "Lavagens",
                data: chartData?.map(d => d.total) ?? [],
                backgroundColor: color,
                borderColor: borderColor,
                borderWidth: 1
              }]
            },
            options: options
        });
    };

    createHorizontalChart("employeeWeeklyChart", data?.charts?.lavagensPorFuncionarioSemanal, "rgba(99, 102, 241, 0.7)", "rgba(99, 102, 241, 1)");
    createHorizontalChart("employeeMonthlyChart", data?.charts?.lavagensPorFuncionarioMensal, "rgba(236, 72, 153, 0.7)", "rgba(236, 72, 153, 1)");
  }

  // Valores dos cards
  const lavagens = dashboardData?.cards?.lavagensMes ?? 0;
  const receita = dashboardData?.cards?.receitaTotalMes ?? 0;
  const usuarios = dashboardData?.cards?.usuariosAtivos ?? 0;
  const [showValues, setShowValues] = useState(true);

  const annualRevenue = dashboardData?.charts?.receitaPorMes?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  // 2. Formatador de moeda
  const formatCurrency = (value) =>
    new window.Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // 3. Data atual para labels
  const currentYear = new Date().getFullYear();

  return (
    <main className="container mx-auto p-2 md:p-6 lg:p-8 bg-gray-100 min-h-screen dark:bg-gray-900 transition-colors duration-300">
      <div className="tab-content p-2 md:p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-gray-100">
          <LayoutDashboard className="mr-3 h-7 w-7 text-blue-600" />
          Dashboard & Estatísticas
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-blue-500 dark:bg-slate-800 flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-white">Lavagens Concluídas (Mês)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-200">{lavagens}</p>
            <p className="text-xs text-green-500 mt-2 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" /> + Lavagens este mês
            </p>
          </div>

          {/* --- Card 1: Receita Mensal (Atualizado com Olho) --- */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-green-500 dark:bg-slate-800 transition-all hover:shadow-xl flex flex-col justify-center">
              <div className="flex justify-between items-start">
                  <div className="w-full">
                      {/* Cabeçalho com Título e Botão do Olho */}
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Receita Total (Mês)
                          </p>
                          <button
                              onClick={() => setShowValues(!showValues)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                              title={showValues ? "Ocultar valores" : "Mostrar valores"}
                          >
                              {showValues ? (
                                  <Eye size={28} className="text-gray-400 dark:text-gray-500" />
                              ) : (
                                  <EyeOff size={28} className="text-gray-400 dark:text-gray-500" />
                              )}
                          </button>
                      </div>

                      {/* Valor Ocultável */}
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {showValues ? formatCurrency(receita) : "R$ ••••••"}
                      </p>

                      <p className="text-xs text-green-500 mt-2 flex items-center font-medium">
                          <ArrowUp className="h-3 w-3 mr-1" /> + Receita computada
                      </p>
                  </div>
              </div>
          </div>

          {/* --- Card 2: Receita Anual (Novo) --- */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-blue-500 dark:bg-slate-800 transition-all hover:shadow-xl flex flex-col justify-center">
              <div className="flex justify-between items-start">
                  <div className="w-full">
                      {/* Cabeçalho com Título e Botão do Olho */}
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Acumulado Anual ({currentYear})
                          </p>
                          <button
                              onClick={() => setShowValues(!showValues)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                          >
                              {showValues ? (
                                  <Eye size={28} className="text-gray-400 dark:text-gray-500" />
                              ) : (
                                  <EyeOff size={28} className="text-gray-400 dark:text-gray-500" />
                              )}
                          </button>
                      </div>

                      {/* Valor Ocultável */}
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {showValues ? formatCurrency(annualRevenue) : "R$ ••••••"}
                      </p>

                      <p className="text-xs text-blue-500 mt-2 flex items-center font-medium">
                          <DollarSign className="h-3 w-3 mr-1" /> Total consolidado
                      </p>
                  </div>
              </div>
          </div>

          {/* --- Card 4: Usuários Ativos --- */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 dark:bg-slate-800 flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-white">Usuários Ativos</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-200">{usuarios}</p>
            <p className="text-xs text-gray-400 mt-2">Colaboradores no sistema</p>
          </div>
          {/* --- Card 5: Volume por Pagamento --- */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-purple-500 dark:bg-slate-800 transition-all hover:shadow-xl">

            {/* Cabeçalho com Título e Olho */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Volume por Pagamento Neste Mês
              </p>
              <button
                onClick={() => setShowValues(!showValues)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                {showValues ? (
                  <Eye size={28} className="text-gray-400 dark:text-gray-500" />
                ) : (
                  <EyeOff size={28} className="text-gray-400 dark:text-gray-500" />
                )}
              </button>
            </div>

            {/* Corpo do Card: Valores */}
            <div className="space-y-3">
              {/* Linha PIX */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-teal-100 p-2 rounded-full mr-3 dark:bg-teal-900/30">
                    <QrCode size={16} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Pix</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {showValues ? formatCurrency(dashboardData?.cards?.totalPix || 0) : "R$ ••••••"}
                </span>
              </div>

              {/* Linha CARTÃO */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 dark:bg-blue-900/30">
                    <CreditCard size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Cartão</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {showValues ? formatCurrency(dashboardData?.cards?.totalCartao || 0) : "R$ ••••••"}
                </span>
              </div>

              {/* Linha DINHEIRO */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3 dark:bg-green-900/30">
                    <Banknote size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Dinheiro</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {showValues ? formatCurrency(dashboardData?.cards?.totalDinheiro || 0) : "R$ ••••••"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos Linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <LineChart className="h-5 w-5 mr-2 text-blue-600" /> Faturamento Semanal
            </h3>
            <canvas id="weeklyRevenueChart" className="w-full h-full block"></canvas>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <PieChart className="h-5 w-5 mr-2 text-blue-600" /> Distribuição de Serviços (Mês)
            </h3>
            <div className="w-full xl:w-[55%] mx-auto">
              <canvas id="washTypeChart" className="w-full h-full block"></canvas>
            </div>
          </div>
        </div>

        {/* Gráficos Linha 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <CalendarCheck className="h-5 w-5 mr-2 text-blue-600" /> Lavagens por Mês
            </h3>
            <canvas id="monthlyWashesChart"></canvas>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" /> Faturamento (R$)
            </h3>
            <canvas id="monthlyRevenueChart"></canvas>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <Car className="h-5 w-5 mr-2 text-blue-600" /> Veículos por Categoria
            </h3>
            <canvas id="vehicleCategoryChart"></canvas>
          </div>
        </div>

        {/* Gráficos Linha 3 (Funcionários) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <Users className="h-5 w-5 mr-2 text-indigo-600" /> Produtividade: Funcionários (Semanal)
            </h3>
            <canvas id="employeeWeeklyChart"></canvas>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center dark:text-gray-300">
              <Users className="h-5 w-5 mr-2 text-pink-600" /> Produtividade: Funcionários (Mensal)
            </h3>
            <canvas id="employeeMonthlyChart"></canvas>
          </div>
        </div>

      </div>
    </main>
  );
}
