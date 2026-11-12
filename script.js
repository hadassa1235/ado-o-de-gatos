
// LAÇOS PATAS - Sistema de adoção de gatos (versao java)

const firebaseConfig = {
  apiKey: "AIzaSyCMmjr1V9QIkaXRe1Pr4_-nSwtDuDCDkHA",
  authDomain: "lacos-patas.firebaseapp.com",
  projectId: "lacos-patas",
  storageBucket: "lacos-patas.firebasestorage.app",
  messagingSenderId: "1005477688960",
  appId: "1:1005477688960:web:974cd13036924b7c3bd865"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const gatosRef = db.collection("gatos");

let gatos = [];

// Elementos do site
const listaGatos = document.getElementById("lista-gatos");
const contadorGatos = document.getElementById("contador-gatos");
const filtroStatus = document.getElementById("filtro-status");
const seletorGato = document.getElementById("seletor-gato");

// Classes do sistema
class Animal {
  constructor(nome, idade, pelagem) {
    this.nome = nome;
    this.idade = idade;
    this.pelagem = pelagem;
  }
}

class Gato extends Animal {
  constructor(nome, idade, pelagem, castrado) {
    super(nome, idade, pelagem);
    this.castrado = castrado;
    this.adotado = false;
  }
}

class Adotante {
  constructor(nome, cpf, telefone) {
    this.nome = nome;
    this.cpf = cpf;
    this.telefone = telefone;
  }
}
// Classe principal do sistema
class SistemaAdocaoGatos {

  async cadastrarGato(gato) {
    try {
      await gatosRef.add({
        nome: gato.nome,
        idade: Number(gato.idade),
        pelagem: gato.pelagem,
        castrado: gato.castrado,
        adotado: false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Gatinho cadastrado com sucesso!");
    } catch (erro) {
      console.error("Erro ao cadastrar gato:", erro);
      alert("Não foi possível cadastrar o gatinho.");
    }
  }

  async atualizarAdocao(gatoId, adotado) {
    try {
      await gatosRef.doc(gatoId).update({
        adotado: adotado
      });

      alert("Status da adoção atualizado!");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao atualizar adoção.");
    }
  }

  async cadastrarAdotante(adotante) {
    const adotantes = JSON.parse(
      localStorage.getItem("adotantes") || "[]"
    );

    adotantes.push({
      nome: adotante.nome,
      cpf: adotante.cpf,
      telefone: adotante.telefone
    });

    localStorage.setItem(
      "adotantes",
      JSON.stringify(adotantes)
    );

    alert("Cadastro realizado com sucesso!");
  }
}

const sistema = new SistemaAdocaoGatos();

// Carregar gatos em tempo real do Firebase
function carregarGatos() {
  gatosRef.onSnapshot((snapshot) => {
    gatos = [];

    snapshot.forEach((documento) => {
      gatos.push({
        id: documento.id,
        ...documento.data()
      });
    });

    gatos.sort((a, b) =>
      (a.nome || "").localeCompare(b.nome || "")
    );

    mostrarGatos();
    atualizarContador();
    atualizarSeletor();
  }, (erro) => {
    console.error("Erro ao carregar gatos:", erro);
  });
} 
// Mostrar os gatos na página
function mostrarGatos() {
  if (!listaGatos) return;

  const filtro = filtroStatus ? filtroStatus.value : "todos";

  let gatosFiltrados = gatos;

  if (filtro === "disponiveis") {
    gatosFiltrados = gatos.filter(gato => !gato.adotado);
  }

  if (filtro === "adotados") {
    gatosFiltrados = gatos.filter(gato => gato.adotado);
  }

  listaGatos.innerHTML = "";

  if (gatosFiltrados.length === 0) {
    listaGatos.innerHTML = "<p>Nenhum gatinho encontrado.</p>";
    return;
  }

  gatosFiltrados.forEach(gato => {
    const card = document.createElement("div");
    card.className = "card-gato";
    const foto = document.createElement("img");
  
   foto.src = gato.fotoUrl || "";
   foto.alt = "Foto de " + (gato.nome || "gatinho");
   foto.style.width = "100%";
   foto.style.maxWidth = "250px";
   foto.style.borderRadius = "12px";
   foto.style.objectFit = "cover";

    const nome = document.createElement("h3");
    nome.textContent = gato.nome || "Sem nome";

    const idade = document.createElement("p");
    idade.textContent = "Idade: " + (gato.idade ?? "Não informada");

    const pelagem = document.createElement("p");
    pelagem.textContent = "Pelagem: " + (gato.pelagem || "Não informada");

    const castrado = document.createElement("p");
    castrado.textContent = gato.castrado ? "Castrado" : "Não castrado";

    const status = document.createElement("p");
    status.textContent = gato.adotado ? "Adotado ❤️" : "Disponível para adoção 🐾";

    card.append(fotos, nome, idade, pelagem, castrado, status);
    listaGatos.appendChild(card);
  });
}

// Atualizar contador
function atualizarContador() {
  if (!contadorGatos) return;

  const disponiveis = gatos.filter(gato => !gato.adotado).length;
  contadorGatos.textContent = disponiveis;
}

// Atualizar opções de gatos no formulário
function atualizarSeletor() {
  if (!seletorGato) return;

  seletorGato.innerHTML = '<option value="">Selecione um gatinho</option>';

  gatos.filter(gato => !gato.adotado).forEach(gato => {
    const opcao = document.createElement("option");
    opcao.value = gato.id;
    opcao.textContent = gato.nome;
    seletorGato.appendChild(opcao);
  });
}

// Filtro de gatos
if (filtroStatus) {
  filtroStatus.addEventListener("change", mostrarGatos);
}

// Formulário de cadastro de gatos
const formGato = document.getElementById("form-gato");

if (formGato) {
  formGato.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = new FormData(formGato);

    const gato = new Gato(
      dados.get("nome"),
      dados.get("idade"),
      dados.get("pelagem"),
      dados.get("castrado") === "on" ||
      dados.get("castrado") === "true"
    );

    await sistema.cadastrarGato(gato);
    formGato.reset();
  });
}

// Formulário de cadastro de adotantes
const formAdotante = document.getElementById("form-adotante");

if (formAdotante) {
  formAdotante.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = new FormData(formAdotante);

    const adotante = new Adotante(
      dados.get("nome"),
      dados.get("cpf"),
      dados.get("telefone")
    );

    await sistema.cadastrarAdotante(adotante);
    formAdotante.reset();
  });
}

// Formulário de adoção
const formAdocao = document.getElementById("form-adocao");

if (formAdocao) {
  formAdocao.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = new FormData(formAdocao);
    const gatoId = dados.get("gatoId");

    if (!gatoId) {
      alert("Selecione um gatinho.");
      return;
    }

    await sistema.atualizarAdocao(gatoId, true);
    formAdocao.reset();
  });
}

// Autenticação anônima e inicialização
auth.signInAnonymously()
  .then(() => {
    console.log("Conectado ao Firebase!");
    carregarGatos();
  })
  .catch((erro) => {
    console.error("Erro na autenticação:", erro);
    alert("Não foi possível conectar ao banco de dados.");
  });
