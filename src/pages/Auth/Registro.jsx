import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/registro.css";

export default function Registro() {
  const [nomeLavajato, setNomeLavajato] = useState("");
  const [nomeDono, setNomeDono] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const navigate = useNavigate();

  // Igual ao login: adiciona fundo especial
  useEffect(() => {
    document.body.classList.add("registro-page");
    return () => {
      document.body.classList.remove("registro-page");
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    const dados = { nomeLavajato, nomeDono, email, senha };

    try {
      const resposta = await fetch("http://localhost:3333/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Erro no servidor");
      }

      alert("✅ Cadastro realizado com sucesso!");
      navigate("/"); // volta para o login
    } catch (erro) {
      console.error("❌ Erro ao cadastrar:", erro);
      alert("Falha ao cadastrar: " + erro.message);
    }
  };

  return (
    <div className="registro-container">
      <div className="bubbles"></div>

      <form onSubmit={handleRegister}>
        <h2>
          <i className="fas fa-car"></i> Cadastrar Lava-Jato
        </h2>

        <div className="input-group">
          <i className="fas fa-building icon"></i>
          <input
            type="text"
            id="nomeLavajato"
            placeholder="Nome do Lava-Jato"
            value={nomeLavajato}
            onChange={(e) => setNomeLavajato(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-user icon"></i>
          <input
            type="text"
            id="nomeDono"
            placeholder="Nome do Proprietário"
            value={nomeDono}
            onChange={(e) => setNomeDono(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-envelope icon"></i>
          <input
            type="email"
            id="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-lock icon"></i>
          <input
            type="password"
            id="senha"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-lock icon"></i>
          <input
            type="password"
            id="confirmarSenha"
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit">Cadastrar</button>

        <div className="extra-links">
          <a href="/">Já tem uma conta? Entrar</a>
        </div>
      </form>
    </div>
  );
}
