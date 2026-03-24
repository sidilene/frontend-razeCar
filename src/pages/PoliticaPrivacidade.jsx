import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-800 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8 border-b pb-4">
          <Link to="/cadastro" className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1e3c72] flex items-center gap-2">
               Política de Privacidade
            </h1>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 inline-block">Em conformidade com a LGPD</span>
          </div>
        </div>

        {/* Conteúdo do Texto */}
        <div className="space-y-6 text-sm md:text-base leading-relaxed text-gray-600">

          <p><strong>Vigência:</strong> A partir de {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">1. Coleta de Dados</h2>
            <p>
              Para o funcionamento do sistema RazeCar, coletamos os seguintes dados pessoais do proprietário da conta (Controlador):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nome completo;</li>
              <li>CPF ou CNPJ;</li>
              <li>Endereço de e-mail;</li>
              <li>Número de telefone;</li>
              <li>Endereço do estabelecimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">2. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Processar seu cadastro e criar sua conta de acesso;</li>
              <li>Emitir cobranças e notas fiscais (quando aplicável);</li>
              <li>Enviar comunicações importantes sobre o sistema e suporte técnico;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">3. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados. Seus dados podem ser compartilhados apenas com terceiros estritamente necessários para a operação, como processadores de pagamento (gateways) e provedores de infraestrutura de servidor (nuvem), que também seguem normas rígidas de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">4. Seus Direitos (LGPD)</h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados;</li>
              <li>Corrigir dados incompletos ou desatualizados;</li>
              <li>Solicitar a exclusão de seus dados (caso não haja obrigação legal de retenção).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">5. Segurança</h2>
            <p>
              Adotamos medidas técnicas de segurança, como criptografia de senhas (bcrypt) e uso de conexões seguras (HTTPS/SSL), para proteger seus dados contra acessos não autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">6. Contato</h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato pelo e-mail: <strong>suporte@razecar.com.br</strong> (exemplo).
            </p>
          </section>

        </div>

        <div className="mt-10 text-center">
            <Link to="/cadastro" className="bg-[#1e3c72] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
                Voltar e Aceitar
            </Link>
        </div>

      </div>
    </div>
  );
}
