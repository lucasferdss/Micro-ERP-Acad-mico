/**
 * ARQUIVO: login.js
 * PAPEL: Controlador da tela de Login.
 * FLUXO: Lê os dados que o usuário digitou no HTML, envia para a API, e se der certo, joga ele pro Dashboard.
 */

async function fazerLogin(event) {
  // Impede que o formulário recarregue a página (comportamento padrão irritante do HTML antigo)
  event.preventDefault();

  const status = document.getElementById("login-status");

  // Passo 1: Coleta os dados digitados na Interface (DOM)
  const payload = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("senha").value
  };

  try {
    status.textContent = "Entrando...";

    // Passo 2: Envia a tentativa de login para a Rota Segura do Servidor Python
    // O servidor processará e, se a senha estiver certa, devolverá o Cookie de Sessão!
    await API.post("/api/login", payload);

    // Passo 3: SUCESSO!
    status.textContent = "Login realizado com sucesso.";
    
    // Regra de Negócio: Redireciona violentamente o usuário para dentro do sistema
    window.location.href = "/pages/dashboard";
  } catch (error) {
    // Passo 4: FALHA! (Senha errada ou usuário não existe)
    console.error(error);
    // Exibe o texto de erro devolvido pelo python na tela do usuário
    status.textContent = error.message || "Erro ao fazer login.";
  }
}

// Ouve o evento de quando o HTML da página termina de carregar
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (form) {
    // Amarramos o botão "Entrar" à função Javascript fazerLogin()
    form.addEventListener("submit", fazerLogin);
  }
});