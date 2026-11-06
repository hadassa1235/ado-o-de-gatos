// Laços Patas - versão JavaScript do sistema original em Python.
// Os dados ficam salvos apenas neste navegador, usando localStorage.

class Animal {
  constructor(id, nome, idade) {
    this._id = id;
    this._nome = nome;
    this._idade = idade;
    this._adotado = false;
  }
  get id() { return this._id; }
  get nome() { return this._nome; }
  get idade() { return this._idade; }
  get adotado() { return this._adotado; }
  marcarComoAdotado() { this._adotado = true; }
  emitirSom() { throw new Error("Método deve ser implementado pela subclasse."); }
  exibirDetalhes() { throw new Error("Método deve ser implementado pela subclasse."); }
}

class Gato extends Animal {
  constructor(id, nome, idade, pelagem, castrado, adotado = false) {
    super(id, nome, idade);
    this._pelagem = pelagem;
    this._castrado = castrado;
    this._adotado = adotado;
  }
  get pelagem() { return this._pelagem; }
  get castrado() { return this._castrado; }
  emitirSom() { return "Miau! 😸"; }
  exibirDetalhes() {
    return `Pelagem: ${this.pelagem} · Castrado: ${this.castrado ? "Sim" : "Não"}`;
  }
}

class Adotante {
  constructor(cpf, nome, telefone) {
    this._cpf = cpf;
    this._nome = nome;
    this._telefone = telefone;
  }
  get cpf() { return this._cpf; }
  get nome() { return this._nome; }
  get telefone() { return this._telefone; }
}

class SistemaAdocaoGatos {
  constructor() {
    this.gatos = this.carregar("lacosPatasGatos", [
      new Gato(1, "Mingau", 2, "Branca", true),
      new Gato(2, "Garfield", 4, "Laranja", false),
      new Gato(3, "Frajola", 1, "Preta e branca", true)
    ]);
    this.adotantes = this.carregar("lacosPatasAdotantes", []);
    this.proximoId = Math.max(0, ...this.gatos.map(g => g.id)) + 1;
  }
  carregar(chave, padrao) {
    try {
      const dados = JSON.parse(localStorage.getItem(chave));
      if (Array.isArray(dados)) {
        return chave === "lacosPatasGatos"
          ? dados.map(g => new Gato(g._id ?? g.id, g._nome ?? g.nome, g._idade ?? g.idade, g._pelagem ?? g.pelagem, g._castrado ?? g.castrado, g._adotado ?? g.adotado))
          : dados.map(a => new Adotante(a._cpf ?? a.cpf, a._nome ?? a.nome, a._telefone ?? a.telefone));
      }
    } catch (erro) { console.warn("Não foi possível carregar os dados salvos.", erro); }
    return padrao;
  }
  salvar() {
    localStorage.setItem("lacosPatasGatos", JSON.stringify(this.gatos));
    localStorage.setItem("lacosPatasAdotantes", JSON.stringify(this.adotantes));
  }
  cadastrarGato(nome, idade, pelagem, castrado) {
    const gato = new Gato(this.proximoId++, nome, idade, pelagem, castrado);
    this.gatos.push(gato); this.salvar(); return gato;
  }
  cadastrarAdotante(cpf, nome, telefone) {
    if (this.adotantes.some(a => a.cpf === cpf)) throw new Error("Já existe um cadastro com esse CPF.");
    const adotante = new Adotante(cpf, nome, telefone);
    this.adotantes.push(adotante); this.salvar(); return adotante;
  }
  listarGatosDisponiveis() { return this.gatos.filter(g => !g.adotado); }
  listarTodosGatos() { return this.gatos; }
  buscarGatoPorId(id) { return this.gatos.find(g => g.id === Number(id)) || null; }
  realizarAdocao(idGato, cpfAdotante) {
    const gato = this.buscarGatoPorId(idGato);
    const adotante = this.adotantes.find(a => a.cpf === cpfAdotante);
    if (!gato) throw new Error("Gato não encontrado.");
    if (gato.adotado) throw new Error(`${gato.nome} já foi adotado.`);
    if (!adotante) throw new Error("Adotante não encontrado. Cadastre-o primeiro.");
    gato.marcarComoAdotado(); this.salvar();
    return { gato, adotante };
  }
}

const sistema = new SistemaAdocaoGatos();
const porId = id => document.getElementById(id);
const limparCpf = cpf => cpf.replace(/\D/g, "");
const escapar = texto => String(texto).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function mensagem(id, texto, erro = false) {
  const el = porId(id); el.textContent = texto; el.classList.toggle("erro", erro);
}
function renderizar() {
  const filtro = porId("filtro-status").value;
  const gatos = filtro === "todos" ? sistema.listarTodosGatos()
    : filtro === "adotados" ? sistema.gatos.filter(g => g.adotado)
    : sistema.listarGatosDisponiveis();
  porId("contador-gatos").textContent = `${gatos.length} ${gatos.length === 1 ? "gatinho" : "gatinhos"}`;
  porId("lista-gatos").innerHTML = gatos.length ? gatos.map(g => `
    <article class="cartao-gato">
      <div class="gato-foto" aria-hidden="true">🐱</div>
      <h3>${escapar(g.nome)}</h3>
      <p>${g.idade} ${g.idade === 1 ? "ano" : "anos"} de idade</p>
      <p>${escapar(g.exibirDetalhes())}</p>
      <span class="status ${g.adotado ? "adotado" : ""}">${g.adotado ? "Já adotado" : "Disponível para adoção"}</span>
    </article>`).join("") : '<div class="vazio">Nenhum gatinho encontrado nesta categoria.</div>';

  const disponiveis = sistema.listarGatosDisponiveis();
  porId("seletor-gato").innerHTML = '<option value="">Selecione um gato disponível</option>' +
    disponiveis.map(g => `<option value="${g.id}">${escapar(g.nome)} — ${g.idade} ano(s)</option>`).join("");
}
porId("filtro-status").addEventListener("change", renderizar);

porId("form-gato").addEventListener("submit", evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  const nome = form.nome.value.trim(), pelagem = form.pelagem.value.trim();
  const idade = Number(form.idade.value);
  if (!nome || !pelagem || !Number.isInteger(idade) || idade < 0) return mensagem("mensagem-gato", "Confira os dados do gato.", true);
  const gato = sistema.cadastrarGato(nome, idade, pelagem, form.castrado.checked);
  form.reset(); renderizar(); mensagem("mensagem-gato", `${gato.nome} foi cadastrado com sucesso!`);
});

porId("form-adotante").addEventListener("submit", evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  const cpf = limparCpf(form.cpf.value), nome = form.nome.value.trim(), telefone = form.telefone.value.trim();
  if (cpf.length !== 11) return mensagem("mensagem-adotante", "Informe um CPF com 11 números.", true);
  try {
    sistema.cadastrarAdotante(cpf, nome, telefone);
    form.reset(); mensagem("mensagem-adotante", `${nome} foi cadastrado com sucesso!`);
  } catch (erro) { mensagem("mensagem-adotante", erro.message, true); }
});

porId("form-adocao").addEventListener("submit", evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  const cpf = limparCpf(form.cpf.value);
  try {
    const { gato, adotante } = sistema.realizarAdocao(form.gatoId.value, cpf);
    form.reset(); renderizar();
    mensagem("mensagem-adocao", `🎉 ${gato.nome} foi adotado por ${adotante.nome}! ${gato.emitirSom()}`);
  } catch (erro) { mensagem("mensagem-adocao", erro.message, true); }
});

renderizar();
