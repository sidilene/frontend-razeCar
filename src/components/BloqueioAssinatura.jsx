import React, { useState, useEffect } from 'react';

export const BloqueioAssinatura = () => {
  const [bloqueado, setBloqueado] = useState(false);
  const [isDono, setIsDono] = useState(false);

  useEffect(() => {
    // CORREÇÃO AQUI: O nome deve ser EXATAMENTE igual ao do index.js
    const handleBloqueio = () => {
      // Movemos a verificação para CAIR AQUI DENTRO!
      // Agora ele lê a informação fresquinha na hora exata do bloqueio.
      try {
        const userInfoString = localStorage.getItem('user_info');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          if (userInfo.tipo === "dono") {
            setIsDono(true);
          } else {
            setIsDono(false); // Garante que zera se logar com outra conta
          }
        }
      } catch (error) {
        console.error(error);
      }

      setBloqueado(true);
    };

    window.addEventListener('ASSINATURA_VENCIDA', handleBloqueio);

    return () => window.removeEventListener('ASSINATURA_VENCIDA', handleBloqueio);
  }, []);

  if (!bloqueado) return null;

  return (
    // Z-INDEX 99999 para garantir que fique na frente de qualquer toast ou alert
    <div className="fixed inset-0 z-[00000] bg-slate-600/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border-t-8 border-red-600 animate-pulse">
        <div className="text-6xl mb-4">🛑</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Acesso Suspenso</h2>
        <p className="text-gray-600 mt-2 mb-8 text-lg">
          Identificamos uma pendência na sua assinatura.
        </p>

        {/* O botão protegido pela lógica */}
        {isDono && (
          <button
            onClick={() => window.location.href = '/planos'}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-lg text-xl"
          >
            Regularizar Agora
          </button>
        )}

        {/* Novo botão: Já paguei / Deslogar */}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full bg-gray-100 text-gray-700 font-bold py-3 mt-4 rounded-xl hover:bg-gray-200 transition text-lg"
        >
          Já paguei (Sair)
        </button>

      </div>
    </div>
  );
};
