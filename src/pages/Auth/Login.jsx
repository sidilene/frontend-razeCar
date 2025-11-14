import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  // Função para criar bolhas decorativas
  useEffect(() => {
    const bubblesContainer = document.querySelector(".bubbles");
    if (!bubblesContainer) return;

    bubblesContainer.innerHTML = "";
    const bubbleCount = 30;

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement("div");
      bubble.classList.add("bubble");

      const size = Math.random() * 60 + 50;
      const duration = Math.random() * 5 + 5;
      const delay = Math.random() * 1;
      const position = Math.random() * 100;

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${position}%`;
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `${delay}s`;

      bubblesContainer.appendChild(bubble);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const dadosLogin = { email, senha };

    try {
      const resposta = await fetch("http://localhost:3333/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dadosLogin),
      });

      console.log("Status da resposta:", resposta.status);

      let dados;
      try {
        dados = await resposta.json();
      } catch (err) {
        console.error("Erro ao ler JSON:", err);
        alert("Resposta inválida do servidor.");
        return;
      }

      console.log("Dados recebidos:", dados);

      if (resposta.ok) {
        const funcaoNum = Number(dados.user.funcao);
        alert("✅ Login realizado com sucesso!");

        if (funcaoNum === 0) {
          navigate("/home");
        } else if (funcaoNum === 1) {
          navigate("/admin");
        } else {
          alert("Função de usuário desconhecida.");
        }
      } else {
        alert("Falha no login: " + (dados.error || "Erro desconhecido"));
      }
    } catch (erro) {
      console.error("Erro geral no fetch:", erro);
      alert("Erro ao tentar fazer login: " + erro.message);
    }
  };

  return (
    <div className="login-container">
      <div className="bubbles"></div>

      <form onSubmit={handleLogin}>
        <h2>
          <i className="fas fa-car"></i> LavaFácil Login
        </h2>

        <div className="input-group">
          <i className="fas fa-user icon"></i>
          <input
            type="email"
            id="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-lock icon"></i>
          <input
            type="password"
            id="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit">Entrar</button>

        <div className="extra-links">
          <a href="/cadastro">Não tem uma conta? Registre-se</a>
        </div>
      </form>
    </div>
  );
}
