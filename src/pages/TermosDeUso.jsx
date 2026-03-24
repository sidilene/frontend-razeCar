import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-800 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8 border-b pb-4">
          <Link to="/cadastro" className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-[#1e3c72]">Termos de Uso</h1>
        </div>

        {/* Conteúdo do Texto */}
        <div className="space-y-6 text-sm md:text-base leading-relaxed text-gray-600">

          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar o sistema <strong>RazeCar</strong>, você concorda integralmente com estes Termos de Uso.
              Se você não concordar com qualquer parte destes termos, você não deve utilizar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">2. O Serviço</h2>
            <p>
              A RazeCar é uma plataforma SaaS (Software as a Service) destinada à gestão de Lava Jatos,
              oferecendo funcionalidades como controle financeiro, agendamento e cadastro de clientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">3. Responsabilidades do Usuário</h2>
            <p>O usuário é responsável por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Manter a confidencialidade de sua senha e dados de acesso.</li>
              <li>Garantir que as informações fornecidas no cadastro (CPF/CNPJ, Telefone) sejam verdadeiras.</li>
              <li>Não utilizar o sistema para fins ilegais ou não autorizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">4. Planos e Pagamentos</h2>
            <p>
              O serviço é oferecido em modalidades de assinatura (Básico, Profissional, Enterprise).
              O não pagamento da mensalidade poderá resultar na suspensão temporária ou cancelamento do acesso ao sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">5. Cancelamento</h2>
            <p>
              Você pode cancelar sua assinatura a qualquer momento através do painel de configurações.
              Não há reembolso para períodos parciais não utilizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1e3c72] mb-2">6. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre alterações significativas através do e-mail cadastrado ou aviso no sistema.
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
