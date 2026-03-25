/**
 * ARQUIVO: api.js
 * PAPEL: Ferramenta central de comunicação (Cliente HTTP).
 * FLUXO: Todo e qualquer arquivo Javascript do Frontend que quiser falar com o Backend DEVE usar este arquivo.
 * COMO SE ENCAIXA: Ele envelopa a função nativa `fetch` do navegador em métodos mais simples (get, post, put).
 */

const API = {
  /**
   * FUNÇÃO PRINCIPAL: request
   * ENTRADA: a URL do backend (ex: '/api/produtos') e opções extras (como os dados do formulário).
   * PROCESSAMENTO: Dispara o pedido HTTP para o servidor Python (`server.py`). 
   *                Configura o "Accept: application/json" e anexa cookies automaticamente.
   * SAÍDA: Promessa com os dados já decodificados de JSON para um Objeto Javascript.
   */
  async request(url, options = {}) {
    // Passo 1: Chama a API do navegador para ir até a internet (ou localhost)
    const response = await fetch(url, {
      credentials: "include", // Garante que o cookie de sessão vá junto na requisição!
      headers: {
        "Accept": "application/json",
        // Se estiver mandando arquivos/texto no "body", diz que o formato é JSON
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      ...options
    });

    // Passo 2: Analisa a resposta física do Servidor
    const contentType = response.headers.get("content-type") || "";
    // Se o servidor devolveu JSON (que é o nosso padrão), extrai os dados. Senão, fica vazio.
    const payload = contentType.includes("application/json")
      ? await response.json()
      : null;

    // Passo 3: Tratamento de Erros (Se o Python devolveu 400, 401, 500...)
    if (!response.ok) {
        // Se a requisição falhou, "quebra" a execução devolvendo o erro lá do Python
      throw new Error(payload?.error || `Erro ${response.status} em ${url}`);
    }

    // Retorna os dados com sucesso para a tela que pediu
    return payload;
  },

  /** MÉTODOS FACILITADORES (Atalhos) */

  // GET: Usado para "Ler/Listar" dados do servidor
  get(url) {
    return this.request(url, { method: "GET" });
  },

  // POST: Usado para "Criar/Salvar" novos dados
  post(url, data) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // PUT: Usado para "Atualizar/Sobrescrever" dados existentes
  put(url, data) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  // PATCH: Usado para "Alterações Rápidas" (ex: Ativar/Inativar um registro)
  patch(url, data = null) {
    return this.request(url, {
      method: "PATCH",
      ...(data ? { body: JSON.stringify(data) } : {})
    });
  }
};