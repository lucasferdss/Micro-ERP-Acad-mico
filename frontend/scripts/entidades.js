/**
 * ARQUIVO: entidades.js
 * PAPEL: Controlador da tela de "Gestão de Entidades" (Clientes e Fornecedores).
 * FLUXO: Ele cuida de listar as entidades na tabela, abrir o formulário lateral, preencher dados para edição
 *        e enviar o comando de salvar/atualizar para a API do Python.
 */

// Memória temporária da tela
let entidadeEditandoId = null; // Guarda o ID da entidade se o usuário estiver editando. Se for nulo, é um cadastro novo.
let entidadesCache = [];       // Guarda a lista de entidades para não precisarmos ir no banco toda hora que clicar em "Editar"

/**
 * FUNÇÃO ÚTIL: getPayloadFormulario
 * PAPEL: Vai nos campos de texto (inputs do HTML) e "varre" tudo o que o usuário digitou.
 * SAÍDA: Um dicionário (JSON) pronto para ser enviado para o Backend.
 */
function getPayloadFormulario() {
  return {
    tipo_entidade: document.getElementById("tipo_entidade").value.trim(),
    nome_razao_social: document.getElementById("nome_razao_social").value.trim(),
    nome_fantasia: document.getElementById("nome_fantasia").value.trim(),
    cpf_cnpj: document.getElementById("cpf_cnpj").value.trim(),
    inscricao_estadual: document.getElementById("inscricao_estadual").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    cep: document.getElementById("cep").value.trim(),
    logradouro: document.getElementById("logradouro").value.trim(),
    numero: document.getElementById("numero").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    cidade: document.getElementById("cidade").value.trim(),
    uf: document.getElementById("uf").value.trim()
  };
}

/**
 * FUNÇÃO ÚTIL: preencherFormulario
 * ENTRADA: Um objeto `entidade` com dados preenchidos.
 * PAPEL: Pega os dados que vieram do Banco e joga nos campinhos do HTML para o usuário poder editar.
 */
function preencherFormulario(entidade) {
  document.getElementById("tipo_entidade").value = entidade.tipo_entidade || "";
  document.getElementById("nome_razao_social").value = entidade.nome_razao_social || "";
  document.getElementById("nome_fantasia").value = entidade.nome_fantasia || "";
  document.getElementById("cpf_cnpj").value = entidade.cpf_cnpj || "";
  document.getElementById("inscricao_estadual").value = entidade.inscricao_estadual || "";
  document.getElementById("email").value = entidade.email || "";
  document.getElementById("telefone").value = entidade.telefone || "";
  document.getElementById("cep").value = entidade.cep || "";
  document.getElementById("logradouro").value = entidade.logradouro || "";
  document.getElementById("numero").value = entidade.numero || "";
  document.getElementById("bairro").value = entidade.bairro || "";
  document.getElementById("cidade").value = entidade.cidade || "";
  document.getElementById("uf").value = entidade.uf || "";
}

/**
 * FUNÇÃO ÚTIL: limparFormulario
 * PAPEL: Reseta o formulário, limpa a variável de edição e fecha o painel lateral ocultando ele (adicionando a classe 'hidden').
 */
function limparFormulario() {
  document.getElementById("entidade-form").reset();
  entidadeEditandoId = null; // Garante que o sistema saiba que o próximo "Salvar" será um cadastro novo
  document.getElementById("submit-button").textContent = "Salvar";
  document.getElementById("cancel-edit-button").style.display = "none";
  
  // Oculta o painel inteiro após salvar/cancelar
  const panel = document.getElementById("entity-form-panel");
  if (panel) panel.classList.add("hidden");
}

/**
 * FUNÇÃO PRINCIPAL: iniciarEdicao
 * QUEM CHAMA: O botão azul de "Editar" que fica no final de cada linha da tabela.
 * ENTRADA: O `id` do registro escolhido.
 */
function iniciarEdicao(id) {
  // Passo 1: Busca o registro na memória Cache (aquela lista que varremos na abertura da tela)
  const entidade = entidadesCache.find((item) => item.id === id);
  if (!entidade) return;

  // Passo 2: Define o modo do sistema como "Modo Edição"
  entidadeEditandoId = id;
  
  // Passo 3: Mostra o formulário escondido
  openEntityForm(true);
  
  // Passo 4: Joga os dados nos inputs
  preencherFormulario(entidade);
  
  // Passo 5: Atualiza a estética dos botões
  document.getElementById("submit-button").textContent = "Atualizar";
  document.getElementById("cancel-edit-button").style.display = "inline-block";
  document.getElementById("form-status").textContent = `Editando entidade #${id}`;
  
  // Rola a tela graciosamente para o topo onde está o formulário
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * FUNÇÃO PRINCIPAL: alternarStatus
 * QUEM CHAMA: O botão secundário ("Ativar"/"Desativar") na listagem da tabela.
 * PAPEL: Altera apenas um campo booleano (True/False) no banco de dados.
 */
async function alternarStatus(id) {
  const status = document.getElementById("entidades-status");

  try {
    status.textContent = "Atualizando status...";
    // Envia o pedido pra rota PATCH (Update Parcial) no Python
    await API.patch(`/api/entidades/${id}/toggle`);
    
    // Sucesso! Recarrega a tabela para mostrar o novo botão
    await carregarEntidades();
    status.textContent = "Status atualizado.";
  } catch (error) {
    console.error(error);
    status.textContent = error.message || "Erro ao atualizar status.";
  }
}

/**
 * FUNÇÃO PRINCIPAL: carregarEntidades (O MOTOR DA LISTAGEM)
 * PAPEL: Buscar no Python a lista completa de Clientes/Fornecedores e desenhar as Tags <tr> na tela (Tabela HTML).
 */
async function carregarEntidades() {
  const tbody = document.getElementById("entidades-tbody");
  const status = document.getElementById("entidades-status");

  try {
    status.textContent = "Carregando entidades...";

    // Passo 1: Busca os dados na API Segura (O Python fará o SELECT no Supabase)
    const entidades = await API.get("/api/entidades");
    // Guarda a resposta no Cache Global da tela
    entidadesCache = Array.isArray(entidades) ? entidades : [];

    // Tratativa: Se o banco estiver vazio...
    if (entidadesCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">Nenhuma entidade cadastrada.</td></tr>`;
      status.textContent = "";
      return;
    }

    // Passo 2: "Renderização". Desenha as linhas <tr> dinamicamente usando Templates String (`...`)
    tbody.innerHTML = entidadesCache.map((entidade) => `
      <tr>
        <td>${entidade.id}</td>
        <td>${entidade.tipo_entidade ?? "-"}</td>
        <td>${entidade.nome_razao_social ?? "-"}</td>
        <td>${entidade.cpf_cnpj ?? "-"}</td>
        <td>${entidade.email ?? "-"}</td>
        <td>${entidade.telefone ?? "-"}</td>
        <td>${entidade.ativo ? "Ativo" : "Inativo"}</td>
        <td>
          <button type="button" class="btn-secondary" onclick="iniciarEdicao(${entidade.id})">Editar</button>
          <button type="button" class="btn-secondary" onclick="alternarStatus(${entidade.id})">
            ${entidade.ativo ? "Desativar" : "Ativar"}
          </button>
        </td>
      </tr>
    `).join("");

    status.textContent = "";
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8">Erro ao carregar entidades.</td></tr>`;
    status.textContent = "Falha ao buscar dados da API.";
  }
}

/**
 * FUNÇÃO PRINCIPAL: salvarEntidade
 * QUEM CHAMA: O botão "Salvar" ou "Atualizar" de dentro do Formulário.
 * FLUXO: Lê os campos e decide se envia um POST (Novo Cadastro) ou um PUT (Atualização).
 */
async function salvarEntidade(event) {
  event.preventDefault(); // Impede f5 na página

  const status = document.getElementById("form-status");
  const payload = getPayloadFormulario();

  try {
    // Regra de Negócio: Se a variável 'entidadeEditandoId' estiver preenchida, é uma Edição
    if (entidadeEditandoId) {
      status.textContent = "Atualizando entidade...";
      await API.put(`/api/entidades/${entidadeEditandoId}`, payload);
      status.textContent = "Entidade atualizada com sucesso.";
    } 
    // Se não, é uma Inserção nova (Cadastro)
    else {
      status.textContent = "Salvando entidade...";
      await API.post("/api/entidades", payload);
      status.textContent = "Entidade cadastrada com sucesso.";
    }

    // Passo Final: Sucesso absoluto! Recolhe o formulário e recarrega a tabela atualizada
    limparFormulario();
    await carregarEntidades();
  } catch (error) {
    console.error(error);
    status.textContent = error.message || "Erro ao salvar entidade.";
  }
}

/** 
 * EVENTO DE INICIALIZAÇÃO
 * Tudo o que estiver aqui dentro liga no exato instante em que o HTML da página termina de desenhar na tela.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("entidade-form");
  const cancelBtn = document.getElementById("cancel-edit-button");

  // Amarramos as funções aos cliques dos botões
  if (form) form.addEventListener("submit", salvarEntidade);
  if (cancelBtn) cancelBtn.addEventListener("click", limparFormulario);

  // Gatilho inicial: Carrega a tabela assim que a tela abre
  carregarEntidades();
});

// Como transformamos isso de script inline em um arquivo modular,
// precisamos colar essas funções na "Janela do Navegador" (window) para que o "onclick=..." do HTML ainda as ache.
window.iniciarEdicao = iniciarEdicao;
window.alternarStatus = alternarStatus;

// ==============================================
// CONTROLE DE INTERFACE (UI) DO PAINEL LATERAL
// ==============================================
const newEntityButton = document.getElementById("new-entity-button");
const entityFormPanel = document.getElementById("entity-form-panel");
const entidadeForm = document.getElementById("entidade-form");
const cancelEditButton = document.getElementById("cancel-edit-button");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");

/** Abre (Expande) o Painel Oculto */
function openEntityForm(isEdit = false) {
  if (!entityFormPanel) return;
  
  // Tira a capa de invisibilidade
  entityFormPanel.classList.remove("hidden");

  // Se for Cadastro Novo, garante que todos os campos estão limpos
  if (!isEdit && entidadeForm) entidadeForm.reset();
  if (submitButton && !isEdit) submitButton.textContent = "Salvar entidade";
  if (formStatus && !isEdit) formStatus.textContent = "Formulário pronto para um novo cadastro.";

  // Foca o mouse automaticamente no primeiro campo para agilizar a digitação
  const firstField = document.getElementById("tipo_entidade");
  if (firstField) firstField.focus();
}

/** Esconde (Fecha) o Painel */
function closeEntityForm() {
  if (!entityFormPanel) return;
  entityFormPanel.classList.add("hidden");

  if (entidadeForm) entidadeForm.reset();
  if (submitButton) submitButton.textContent = "Salvar entidade";
  if (formStatus) formStatus.textContent = "";
}

// Botões fixos do Topo (Novo Cadastro) e Rodapé (Fechar)
if (newEntityButton) {
  newEntityButton.addEventListener("click", () => {
    openEntityForm(false);
  });
}

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    closeEntityForm();
  });
}

window.openEntityForm = openEntityForm;
window.closeEntityForm = closeEntityForm;
