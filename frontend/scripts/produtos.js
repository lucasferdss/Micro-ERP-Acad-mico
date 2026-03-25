/**
 * ARQUIVO: produtos.js
 * PAPEL: Controlador da tela de "Gestão de Produtos" (Catálogo e Estoque).
 * FLUXO: Lista os produtos na tabela, controla a abertura e fechamento do formulário de cadastro,
 *        higieniza os valores (como o SKU) e envia comandos de salvar/atualizar para a API (Python).
 */

// Memória temporária da tela
let produtoEditandoId = null; // Guarda qual produto estamos editando no momento
let produtosCache = [];       // Cache de produtos para não recarregar do banco a cada clique

/**
 * FUNÇÃO ÚTIL: getPayloadProduto
 * PAPEL: Ler o formulário HTML e montar o pacote de dados (Payload) para o Backend.
 * SAÍDA: Objeto JSON higienizado.
 */
function getPayloadProduto() {
  return {
    sku: document.getElementById("sku").value.trim(),
    nome: document.getElementById("nome").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    unidade_medida: document.getElementById("unidade_medida").value.trim(),
    preco_custo: document.getElementById("preco_custo").value.trim(),
    preco_venda: document.getElementById("preco_venda").value.trim(),
    estoque_atual: document.getElementById("estoque_atual").value.trim(),
    estoque_minimo: document.getElementById("estoque_minimo").value.trim()
  };
}

/**
 * FUNÇÃO ÚTIL: preencherFormulario
 * PAPEL: Transporta os valores vindos do Banco de Dados para dentro das caixinhas visuais do HTML.
 */
function preencherFormulario(produto) {
  document.getElementById("sku").value = produto.sku || "";
  document.getElementById("nome").value = produto.nome || "";
  document.getElementById("descricao").value = produto.descricao || "";
  document.getElementById("unidade_medida").value = produto.unidade_medida || "UN";
  
  // Tratamento de conversão para string pra exibir nas caixas numéricas
  document.getElementById("preco_custo").value = produto.preco_custo ?? "0.00";
  document.getElementById("preco_venda").value = produto.preco_venda ?? "0.00";
  document.getElementById("estoque_atual").value = produto.estoque_atual ?? "0.000";
  document.getElementById("estoque_minimo").value = produto.estoque_minimo ?? "0.000";
}

/**
 * FUNÇÃO ÚTIL: limparFormulario
 * PAPEL: Zera os campos, retira a variável global de edição e recolhe o painel visual do formulário.
 */
function limparFormulario() {
  document.getElementById("produto-form").reset();
  
  // Zera os valores padrão manuais por garantia
  document.getElementById("unidade_medida").value = "UN";
  document.getElementById("preco_custo").value = "0.00";
  document.getElementById("preco_venda").value = "0.00";
  document.getElementById("estoque_atual").value = "0.000";
  document.getElementById("estoque_minimo").value = "0.000";
  
  produtoEditandoId = null; // Desliga o modo Edição
  document.getElementById("submit-button").textContent = "Salvar";
  document.getElementById("cancel-edit-button").style.display = "none";
  
  // Recolhe a "gaveta" (painel principal)
  const panel = document.getElementById("product-form-panel");
  if (panel) panel.classList.add("hidden");
}

/**
 * FUNÇÃO PRINCIPAL: iniciarEdicaoProduto
 * QUEM CHAMA: O clique no botão "Editar" de uma linha na tabela.
 */
function iniciarEdicaoProduto(id) {
  // Passo 1: Caça o produto no Cache local pelo ID
  const produto = produtosCache.find((item) => item.id === id);
  if (!produto) return;

  // Passo 2: Define estado de Edição
  produtoEditandoId = id;
  
  // Passo 3: Força a abertura visual da gaveta do Formulário e joga os dados nela
  openProductForm(true);
  preencherFormulario(produto);
  
  // Passo 4: Atualiza a estética do Painel indicando que estamos "Atualizando" em vez de Salvar
  document.getElementById("submit-button").textContent = "Atualizar";
  document.getElementById("cancel-edit-button").style.display = "inline-block";
  document.getElementById("form-status").textContent = `Editando produto #${id}`;
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * FUNÇÃO PRINCIPAL: alternarStatusProduto
 * PAPEL: Alternar um Produto entre Ativo e Inativo, sem afetar mais nada.
 */
async function alternarStatusProduto(id) {
  const status = document.getElementById("produtos-status");

  try {
    status.textContent = "Atualizando status...";
    // Faz a chamada silenciosa para o roteador PATCH na API Python
    await API.patch(`/api/produtos/${id}/toggle`);
    
    // Atualiza a tabela na tela para refletir a nova situação de Ativo/Inativo
    await carregarProdutos();
    status.textContent = "Status atualizado.";
  } catch (error) {
    console.error(error);
    status.textContent = error.message || "Erro ao atualizar status.";
  }
}

/**
 * FUNÇÃO PRINCIPAL: carregarProdutos (O ALIMENTADOR DA LISTAGEM)
 * FLUXO: Bate na porta da API Python (`/api/produtos`), baixa a lista de JSONs que o banco gerou, 
 *        e então pinta a tabela dinamicamente <tr>.
 */
async function carregarProdutos() {
  const tbody = document.getElementById("produtos-tbody");
  const status = document.getElementById("produtos-status");

  try {
    status.textContent = "Carregando produtos...";

    // Passo 1: Manda o navegador baixar os dados
    const produtos = await API.get("/api/produtos");
    produtosCache = Array.isArray(produtos) ? produtos : [];

    // Proteção: Banco de dados vazio
    if (produtosCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11">Nenhum produto cadastrado.</td></tr>`;
      status.textContent = "";
      return;
    }

    // Passo 2: Loop transformando dados estruturais (JSON) em Linhas de Tabela (HTML)
    tbody.innerHTML = produtosCache.map((produto) => `
      <tr>
        <td>${produto.id}</td>
        <td>${produto.sku ?? "-"}</td>
        <td>${produto.nome ?? "-"}</td>
        <td>${produto.unidade_medida ?? "-"}</td>
        <td>R$ ${(produto.preco_custo ?? 0).toFixed(2)}</td>
        <td>R$ ${(produto.preco_venda ?? 0).toFixed(2)}</td>
        <td>${(produto.margem_lucro ?? 0).toFixed(2)}%</td>
        <td>${produto.estoque_atual ?? 0}</td>
        <td>${produto.estoque_minimo ?? 0}</td>
        <td>${produto.ativo ? "Ativo" : "Inativo"}</td>
        <td>
          <button type="button" class="btn-secondary" onclick="iniciarEdicaoProduto(${produto.id})">Editar</button>
          <button type="button" class="btn-secondary" onclick="alternarStatusProduto(${produto.id})">
            ${produto.ativo ? "Desativar" : "Ativar"}
          </button>
        </td>
      </tr>
    `).join("");

    status.textContent = "";
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="11">Erro ao carregar produtos.</td></tr>`;
    status.textContent = "Falha ao buscar dados da API.";
  }
}

/**
 * FUNÇÃO PRINCIPAL: salvarProduto
 * QUEM CHAMA: Formulário quando clica em enviar/salvar
 * FLUXO: Define a rota (PUT/POST) baseada se existe um ID de edição, dispara pra API e recarrega.
 */
async function salvarProduto(event) {
  event.preventDefault(); // Impede o F5 da página

  const status = document.getElementById("form-status");
  const payload = getPayloadProduto();

  try {
    // Se o sistema sabe o ID, é para Sobrescrever os dados de um item antigo (PUT)
    if (produtoEditandoId) {
      status.textContent = "Atualizando produto...";
      await API.put(`/api/produtos/${produtoEditandoId}`, payload);
      status.textContent = "Produto atualizado com sucesso.";
    } 
    // Do contrário, vamo salvar algo totalmente Novo (POST)
    else {
      status.textContent = "Salvando produto...";
      await API.post("/api/produtos", payload);
      status.textContent = "Produto cadastrado com sucesso.";
    }

    // Fecha o formulário e Puxa os dados atualizados novamente para a tela refazer a Lista
    limparFormulario();
    await carregarProdutos();
  } catch (error) {
    console.error(error);
    status.textContent = error.message || "Erro ao salvar produto.";
  }
}

// Inicia as operações de engate dos gatilhos assim que a árvore do DOM (HTML) for finalizada
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("produto-form");
  const cancelBtn = document.getElementById("cancel-edit-button");

  if (form) form.addEventListener("submit", salvarProduto);
  if (cancelBtn) cancelBtn.addEventListener("click", limparFormulario);

  carregarProdutos(); // Acende os motores da Listagem
});

// Ancoramento nativo no Window para o HTML enxergar as funções nos eventos "onclick="
window.iniciarEdicaoProduto = iniciarEdicaoProduto;
window.alternarStatusProduto = alternarStatusProduto;

// ==============================================
// CONTROLES DE ANIMAÇÃO / GAVETA DO FORMULÁRIO
// ==============================================
const newProductButton = document.getElementById("new-product-button");
const productFormPanel = document.getElementById("product-form-panel");
const produtoForm = document.getElementById("produto-form");
const cancelEditButton = document.getElementById("cancel-edit-button");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");

/** Abre e inicializa a Gaveta visual */
function openProductForm(isEdit = false) {
  if (!productFormPanel) return;

  productFormPanel.classList.remove("hidden"); // Remove a invisibilidade

  // Prepara estado inicial limpo
  if (!isEdit && produtoForm) {
    produtoForm.reset();

    // Valores padrão úteis nos Produtos
    const unidade = document.getElementById("unidade_medida");
    const precoCusto = document.getElementById("preco_custo");
    const precoVenda = document.getElementById("preco_venda");
    const estoqueAtual = document.getElementById("estoque_atual");
    const estoqueMinimo = document.getElementById("estoque_minimo");

    if (unidade) unidade.value = "UN";
    if (precoCusto) precoCusto.value = "0.00";
    if (precoVenda) precoVenda.value = "0.00";
    if (estoqueAtual) estoqueAtual.value = "0.000";
    if (estoqueMinimo) estoqueMinimo.value = "0.000";
  }

  if (submitButton && !isEdit) submitButton.textContent = "Salvar produto";
  if (formStatus && !isEdit) formStatus.textContent = "Formulário pronto para um novo cadastro.";

  // Foco no input Código de Barras / SKU por padrão
  const firstField = document.getElementById("sku");
  if (firstField) firstField.focus();
}

/** Fecha a gaveta */
function closeProductForm() {
  if (!productFormPanel) return;

  productFormPanel.classList.add("hidden");

  if (produtoForm) produtoForm.reset();

  // Reset por segurança para evitar preenchimento fantasma no próximo cadastro
  const unidade = document.getElementById("unidade_medida");
  const precoCusto = document.getElementById("preco_custo");
  const precoVenda = document.getElementById("preco_venda");
  const estoqueAtual = document.getElementById("estoque_atual");
  const estoqueMinimo = document.getElementById("estoque_minimo");

  if (unidade) unidade.value = "UN";
  if (precoCusto) precoCusto.value = "0.00";
  if (precoVenda) precoVenda.value = "0.00";
  if (estoqueAtual) estoqueAtual.value = "0.000";
  if (estoqueMinimo) estoqueMinimo.value = "0.000";

  if (submitButton) submitButton.textContent = "Salvar produto";
  if (formStatus) formStatus.textContent = "";
}

if (newProductButton) {
  newProductButton.addEventListener("click", () => {
    openProductForm(false);
  });
}

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    closeProductForm();
  });
}

window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
