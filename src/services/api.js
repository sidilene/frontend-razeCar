// Pega o "endereço atual" do navegador (seja localhost, IP local ou Vercel)
const hostname = window.location.hostname;

// Verifica se está rodando na sua máquina ou no Wi-Fi de casa (iniciando com 192.168)
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

// Lógica "Camaleão" 2.0:
export const API_BASE = isLocal
  ? `http://${hostname}:3333` // Se for local/celular, continua como antes
  : 'https://api.razecar.com.br';





