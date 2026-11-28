// Projeto acadêmico: alterações ficam na memória da página.
// Esta conta fictícia é recriada com os dados abaixo a cada carregamento.
const usuarios = [{
  nome: 'Cliente Teste',
  email: 'clienteteste@gmail.com',
  senha: 'Teste12@',
  cpf: '52998224725',
  telefone: '11999999999',
  nascimento: '2000-01-01'
}, {
  nome: 'Administrador Teste', email: 'adminteste@example.com', senha: 'Admin12@',
  cpf: '11144477735', telefone: '11988888888', nascimento: '1990-01-01', papel: 'admin'
}];
let usuarioLogado = null;
let tempoAviso;
let retornoLogin = 'perfil';

function selecionar(seletor) {
  return document.querySelector(seletor);
}

// NAVEGAÇÃO ENTRE AS TELAS
function fecharMenu() {
  selecionar('#navigation').classList.remove('open');
  selecionar('.menu-button').setAttribute('aria-expanded', 'false');
}

function mostrarTela(moverFoco = true) {
  const telas = ['inicio', 'cadastro', 'sitio', 'login', 'recuperar', 'perfil', 'historico', 'disponibilidade', 'aluguel-dados', 'aluguel-revisao', 'aluguel-confirmacao', 'aluguel-detalhe', 'pagamento', 'pagamento-resultado', 'admin', 'admin-pedidos', 'admin-agenda', 'admin-adicionais', 'admin-disponibilidade'];
  let tela = location.hash.replace('#', '').split('/')[0] || 'inicio';
  // Mantém links antigos funcionando, mas o histórico agora fica dentro do perfil.
  if (tela === 'historico') { location.hash = '#perfil/alugueis'; return; }
  if (tela === 'conteudo') {
    selecionar('#conteudo').focus();
    return;
  }
  if (!telas.includes(tela)) tela = 'inicio';
  if (tela.startsWith('admin') && !ehAdministrador()) {
    retornoLogin = tela;
    location.hash = usuarioLogado ? '#perfil' : '#login';
    return;
  }
  const protegidas = ['perfil', 'historico', 'aluguel-dados', 'aluguel-revisao', 'aluguel-confirmacao', 'aluguel-detalhe', 'pagamento', 'pagamento-resultado'];
  if (protegidas.includes(tela) && !usuarioLogado) {
    retornoLogin = location.hash.slice(1);
    location.hash = '#login';
    tela = 'login';
  }
  if (typeof prepararTela === 'function' && prepararTela(tela) === false) return;
  document.querySelectorAll('[data-view]').forEach(function (secao) {
    secao.hidden = secao.dataset.view !== tela;
  });
  document.querySelectorAll('[data-nav]').forEach(function (link) {
    if (link.dataset.nav === tela) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titulos = { pagamento: 'Pagamento', 'pagamento-resultado': 'Resultado do pagamento', inicio: 'Início', cadastro: 'Criar conta', sitio: 'Conhecer o sítio', login: 'Entrar', recuperar: 'Recuperar senha', perfil: 'Meu perfil', historico: 'Meus aluguéis', disponibilidade: 'Disponibilidade', 'aluguel-dados': 'Detalhes do aluguel', 'aluguel-revisao': 'Revisar solicitação', 'aluguel-confirmacao': 'Solicitação enviada', 'aluguel-detalhe': 'Detalhes da solicitação', 'admin-adicionais': 'Adicionais do aluguel', 'admin-disponibilidade': 'Disponibilidade administrativa' };
  document.title = (titulos[tela] || 'Administração') + ' · Sítio Raio de Sol';
  fecharMenu();
  if (tela !== 'login') selecionar('#login-password').value = '';
  if (tela !== 'cadastro') {
    selecionar('#password').value = '';
    atualizarRegrasSenha();
  }
  document.querySelectorAll('[data-password]').forEach(function (botao) {
    document.getElementById(botao.dataset.password).type = 'password';
    botao.textContent = 'Mostrar';
    botao.setAttribute('aria-label', 'Mostrar senha');
    botao.setAttribute('aria-pressed', 'false');
  });
  if (moverFoco) {
    window.scrollTo(0, 0);
    selecionar('#conteudo').focus({ preventScroll: true });
  }
}
window.addEventListener('hashchange', function () { mostrarTela(); });
selecionar('.menu-button').addEventListener('click', function () {
  const aberto = selecionar('#navigation').classList.toggle('open');
  this.setAttribute('aria-expanded', String(aberto));
});
document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') fecharMenu();
});
function mostrarAviso(texto) {
  selecionar('#toast').textContent = texto;
  selecionar('#toast').hidden = false;
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(function () { selecionar('#toast').hidden = true; }, 5500);
}

// VALIDAÇÃO DE IDADE, SENHA E CPF
function maiorDeIdade(nascimento, hoje = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return false;
  const partes = nascimento.split('-').map(Number);
  const ano = partes[0], mes = partes[1], dia = partes[2];
  const data = new Date(ano, mes - 1, dia);
  if (ano < 1900 || data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 || data.getDate() !== dia) return false;
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() < mes - 1 ||
      (hoje.getMonth() === mes - 1 && hoje.getDate() < dia)) idade--;
  return idade >= 18;
}
function regrasSenha(senha) {
  return {
    length: senha.length >= 8 && senha.length <= 30,
    upper: /[A-Z]/.test(senha),
    lower: /[a-z]/.test(senha),
    special: /[^\p{L}\p{N}\s]/u.test(senha)
  };
}
function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  // Calcula os dois dígitos verificadores do CPF.
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}
function validarCadastro(usuario) {
  const erros = {};
  if (usuario.nome.length < 3 || usuario.nome.length > 120)
    erros.name = 'Informe seu nome completo (de 3 a 120 caracteres).';
  if (!/^[1-9]{2}\d{8,9}$/.test(usuario.telefone))
    erros.phone = 'Informe um telefone com DDD (10 ou 11 dígitos).';
  if (!cpfValido(usuario.cpf)) erros.cpf = 'Informe um CPF válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email) || usuario.email.length > 254)
    erros.email = 'Informe um e-mail válido.';
  if (!maiorDeIdade(usuario.nascimento))
    erros.birth = 'Você precisa ter pelo menos 18 anos. Confira a data.';
  const regras = regrasSenha(usuario.senha);
  if (!regras.length || !regras.upper || !regras.lower || !regras.special)
    erros.password = 'Use de 8 a 30 caracteres, uma maiúscula, uma minúscula e um caractere especial.';
  return erros;
}
function mostrarErros(erros) {
  ['name', 'phone', 'cpf', 'email', 'birth', 'password'].forEach(function (campo) {
    selecionar('#' + campo + '-error').textContent = erros[campo] || '';
    selecionar('#' + campo).setAttribute('aria-invalid', String(Boolean(erros[campo])));
  });
  const primeiro = Object.keys(erros)[0];
  if (primeiro) selecionar('#' + primeiro).focus();
}

// MÁSCARAS DOS CAMPOS E EXIBIÇÃO DA SENHA
selecionar('#cpf').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
});
selecionar('#phone').addEventListener('input', function () {
  const numeros = this.value.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 2) { this.value = numeros; return; }
  const separacao = numeros.length > 10 ? 7 : 6;
  this.value = '(' + numeros.slice(0, 2) + ') ' + numeros.slice(2, separacao);
  if (numeros.length > separacao) this.value += '-' + numeros.slice(separacao);
});
document.querySelectorAll('[data-password]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    const campo = document.getElementById(botao.dataset.password);
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    botao.setAttribute('aria-pressed', String(mostrar));
  });
});
function atualizarRegrasSenha() {
  const regras = regrasSenha(selecionar('#password').value);
  document.querySelectorAll('[data-rule]').forEach(function (item) {
    item.classList.toggle('valid', regras[item.dataset.rule]);
  });
}
selecionar('#password').addEventListener('input', atualizarRegrasSenha);

// CADASTRO DE DEMONSTRAÇÃO: GUARDA OS DADOS EM UM ARRAY
selecionar('#register-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const mensagem = selecionar('#register-message');
  mensagem.textContent = '';
  const usuario = {
    nome: selecionar('#name').value.trim(),
    telefone: selecionar('#phone').value.replace(/\D/g, ''),
    cpf: selecionar('#cpf').value.replace(/\D/g, ''),
    email: selecionar('#email').value.trim().toLowerCase(),
    nascimento: selecionar('#birth').value,
    senha: selecionar('#password').value
  };
  const erros = validarCadastro(usuario);
  mostrarErros(erros);
  if (Object.keys(erros).length > 0) {
    mensagem.textContent = 'Confira os campos indicados antes de continuar.';
    return;
  }
  const duplicado = usuarios.some(function (existente) {
    return existente.email === usuario.email || existente.cpf === usuario.cpf;
  });
  if (duplicado) {
    mensagem.textContent = 'Já existe um cadastro com este e-mail ou CPF nesta demonstração.';
    mensagem.focus();
    return;
  }
  usuarios.push(usuario);
  this.reset();
  atualizarRegrasSenha();
  selecionar('#login-email').value = usuario.email;
  selecionar('#login-message').textContent = 'Cadastro realizado! Entre com seu e-mail e senha, sem recarregar a página.';
  selecionar('#login-message').classList.add('success');
  location.hash = '#login';
});

// LOGIN: COMPARA O E-MAIL E A SENHA COM O ARRAY DE CADASTROS
function atualizarConta() {
  const conectado = usuarioLogado !== null;
  selecionar('#nav-login').hidden = conectado;
  selecionar('#nav-register').hidden = conectado;
  selecionar('#account').hidden = !conectado;
  selecionar('#account-name').textContent = conectado ? 'Olá, ' + usuarioLogado.nome.split(' ')[0] : '';
  document.querySelectorAll('[data-client]').forEach(function (link) { link.hidden = !conectado; });
  document.querySelectorAll('[data-admin]').forEach(function (link) { link.hidden = !ehAdministrador(); });
}
selecionar('#login-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const email = selecionar('#login-email').value.trim().toLowerCase();
  const senha = selecionar('#login-password').value;
  const mensagem = selecionar('#login-message');
  mensagem.textContent = '';
  mensagem.classList.remove('success');
  const encontrado = usuarios.find(function (usuario) {
    return usuario.email === email && usuario.senha === senha;
  });
  if (!encontrado) {
    mensagem.textContent = 'E-mail ou senha incorretos. Use um cadastro feito nesta página, sem recarregá-la.';
    mensagem.focus();
    return;
  }
  usuarioLogado = encontrado;
  atualizarConta();
  this.reset();
  location.hash = '#' + (ehAdministrador() && retornoLogin === 'perfil' ? 'admin' : retornoLogin);
  retornoLogin = 'perfil';
  mostrarAviso('Bem-vindo, ' + encontrado.nome.split(' ')[0] + '! Login de demonstração realizado.');
});
selecionar('#logout').addEventListener('click', function () {
  if (typeof limparSessao === 'function') limparSessao();
  usuarioLogado = null;
  atualizarConta();
  location.hash = '#inicio';
  mostrarTela();
  mostrarAviso('Você saiu da conta. Até logo!');
});

// PERFIL, RECUPERAÇÃO E ALUGUEL — Dados na memória do navegador, sem servidor.
// A recuperação mostra um código de teste; nenhum e-mail é enviado.
let recuperacao = null;
let rascunhoAluguel = null;
const alugueis = [];
// Valor fictício em centavos, definido ANTES da solicitação.
// A área administrativa altera a diária para novas seleções de datas.
const configuracaoAluguel = { diariaCentavos: 50000, fimSemanaCentavos: null, feriadoCentavos: null, datas: {}, pessoaCentavos: 0, limpezaCentavos: 0, saidaEstendidaPercentual: 0 };
function formatarValor(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function calcularPreco(inicio, fim, pessoas = 1, limpeza = false, saidaEstendida = false) {
  const dias = [];
  for (let dia = inicio; dia <= fim; dia = deslocarDia(dia, 1)) {
    dias.push({ data: dia, ...precoDoDia(dia) });
  }
  const diariaUnica = dias.every(function (dia) { return dia.centavos === dias[0].centavos; });
  const subtotalCentavos = dias.reduce(function (total, dia) { return total + dia.centavos; }, 0);
  const pessoasExtras = Math.max(0, pessoas - 15);
  const adicionalPessoasCentavos = pessoasExtras * configuracaoAluguel.pessoaCentavos;
  const limpezaCentavos = limpeza ? configuracaoAluguel.limpezaCentavos : 0;
  const ultimoDia = dias[dias.length - 1];
  const saidaEstendidaPercentual = saidaEstendida ? configuracaoAluguel.saidaEstendidaPercentual : 0;
  const saidaEstendidaCentavos = saidaEstendida && ultimoDia
    ? Math.round(ultimoDia.centavos * saidaEstendidaPercentual / 100)
    : 0;
  return {
    subtotalCentavos: subtotalCentavos,
    pessoasExtras: pessoasExtras,
    valorPessoaCentavos: configuracaoAluguel.pessoaCentavos,
    adicionalPessoasCentavos: adicionalPessoasCentavos,
    limpezaCentavos: limpezaCentavos,
    saidaEstendidaPercentual: saidaEstendidaPercentual,
    saidaEstendidaCentavos: saidaEstendidaCentavos,
    diariaCentavos: diariaUnica && dias.length ? dias[0].centavos : null,
    dias: dias,
    totalCentavos: subtotalCentavos + adicionalPessoasCentavos + limpezaCentavos + saidaEstendidaCentavos
  };
}
function textoPreco(preco) {
  return (preco.diariaCentavos === null ? 'Diárias conforme as datas' : formatarValor(preco.diariaCentavos) + ' por dia') + ' · Total: ' + formatarValor(preco.totalCentavos);
}
// Datas civis ao meio-dia evitam deslocamentos de fuso ao somar dias.
function deslocarDia(texto, quantidade) {
  const data = lerData(texto);
  data.setDate(data.getDate() + quantidade);
  return dataISO(data);
}
// Calendário federal: nove datas fixas e Paixão de Cristo (Páscoa menos dois dias).
// Fonte: https://agenciagov.ebc.com.br/noticias/202512/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026
function nomeFeriado(texto) {
  const fixos = { '01-01': 'Confraternização Universal', '04-21': 'Tiradentes', '05-01': 'Dia do Trabalho', '09-07': 'Independência do Brasil', '10-12': 'Nossa Senhora Aparecida', '11-02': 'Finados', '11-15': 'Proclamação da República', '11-20': 'Consciência Negra', '12-25': 'Natal' };
  if (fixos[texto.slice(5)]) return fixos[texto.slice(5)];
  // Cálculo da Páscoa no calendário gregoriano (Meeus/Jones/Butcher).
  const ano = Number(texto.slice(0, 4));
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = (h + l - 7 * m + 114) % 31 + 1;
  const pascoa = dataISO(new Date(ano, mes - 1, dia, 12));
  return texto === deslocarDia(pascoa, -2) ? 'Paixão de Cristo' : '';
}
function precoDoDia(dia) {
  const config = configuracaoAluguel;
  if (Object.prototype.hasOwnProperty.call(config.datas, dia)) return { centavos: config.datas[dia], regra: 'Data específica' };
  const feriado = nomeFeriado(dia);
  if (feriado && config.feriadoCentavos !== null) return { centavos: config.feriadoCentavos, regra: feriado };
  const semana = lerData(dia).getDay();
  if ((semana === 0 || semana === 6) && config.fimSemanaCentavos !== null) return { centavos: config.fimSemanaCentavos, regra: 'Fim de semana' };
  return { centavos: config.diariaCentavos, regra: 'Diária padrão' };
}
function detalharDiarias(preco) {
  return (preco.dias || []).map(function (dia) { return formatarData(dia.data) + ': ' + formatarValor(dia.centavos) + ' · ' + dia.regra; }).join('\n');
}
let proximoProtocolo = 1;
let ultimoAluguel = null;
let cancelamentoSelecionado = null;
const hojeAgenda = new Date();
hojeAgenda.setHours(12, 0, 0, 0);
let mesAgenda = new Date(hojeAgenda.getFullYear(), hojeAgenda.getMonth(), 1, 12);
const limiteAgenda = new Date(hojeAgenda.getFullYear(), hojeAgenda.getMonth() + 12, 0, 12);

// Dias fictícios apenas para demonstrar os estados do calendário.
const diasExemplo = [
  dataISO(new Date(hojeAgenda.getFullYear(), hojeAgenda.getMonth() + 1, 10, 12)),
  dataISO(new Date(hojeAgenda.getFullYear(), hojeAgenda.getMonth() + 1, 11, 12)),
  dataISO(new Date(hojeAgenda.getFullYear(), hojeAgenda.getMonth() + 2, 17, 12))
];

function senhaValida(senha) {
  const regras = regrasSenha(senha);
  return regras.length && regras.upper && regras.lower && regras.special;
}
function exibirMensagem(id, texto, sucesso = false) {
  const elemento = selecionar('#' + id);
  elemento.textContent = texto;
  elemento.classList.toggle('success', sucesso);
  if (texto) elemento.focus();
}
function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}
function preencherDetalhes(id, pares) {
  const lista = selecionar('#' + id);
  lista.replaceChildren();
  pares.forEach(function (par) {
    const grupo = criarElemento('div');
    grupo.append(criarElemento('dt', par[0]), criarElemento('dd', par[1]));
    lista.append(grupo);
  });
}

// RECUPERAÇÃO: E-MAIL → CÓDIGO → NOVA SENHA
function etapaRecuperacao(etapa) {
  selecionar('#recovery-email-form').hidden = etapa !== 1;
  selecionar('#recovery-code-form').hidden = etapa !== 2;
  selecionar('#recovery-password-form').hidden = etapa !== 3;
  document.querySelectorAll('#recovery-steps li').forEach(function (item, indice) {
    if (indice === etapa - 1) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
}
function limparRecuperacao() {
  recuperacao = null;
  selecionar('#recovery-code-form').reset();
  selecionar('#recovery-password-form').reset();
  selecionar('#demo-code').textContent = '';
  selecionar('#recovery-message').textContent = '';
  etapaRecuperacao(1);
}
function gerarCodigo(usuario) {
  const numeros = new Uint32Array(1);
  crypto.getRandomValues(numeros);
  recuperacao = {
    email: usuario.email,
    codigo: String(numeros[0] % 1000000).padStart(6, '0'),
    validade: Date.now() + 5 * 60 * 1000,
    tentativas: 0,
    verificado: false
  };
  selecionar('#recovery-address').textContent = usuario.email;
  selecionar('#demo-code').textContent = recuperacao.codigo;
  selecionar('#recovery-code').value = '';
  selecionar('#recovery-password-form').reset();
  exibirMensagem('recovery-message', '');
  etapaRecuperacao(2);
  selecionar('#recovery-code').focus();
}
selecionar('#recovery-email-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const email = selecionar('#recovery-email').value.trim().toLowerCase();
  const usuario = usuarios.find(function (pessoa) { return pessoa.email === email; });
  if (!usuario) {
    limparRecuperacao();
    exibirMensagem('recovery-message', 'Não encontramos este e-mail nesta demonstração. Crie seu cadastro e tente novamente sem recarregar a página.');
    return;
  }
  gerarCodigo(usuario);
});
selecionar('#recovery-code-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!recuperacao) return;
  if (Date.now() >= recuperacao.validade) {
    exibirMensagem('recovery-message', 'Este código expirou. Gere outro código.');
    return;
  }
  if (recuperacao.tentativas >= 5) {
    exibirMensagem('recovery-message', 'Você atingiu 5 tentativas. Gere outro código.');
    return;
  }
  recuperacao.tentativas++;
  if (selecionar('#recovery-code').value !== recuperacao.codigo) {
    exibirMensagem('recovery-message', 'Código incorreto. Restam ' + (5 - recuperacao.tentativas) + ' tentativas.');
    return;
  }
  recuperacao.verificado = true;
  selecionar('#demo-code').textContent = '';
  etapaRecuperacao(3);
  exibirMensagem('recovery-message', '');
  selecionar('#recovery-password').focus();
});
selecionar('#resend-code').addEventListener('click', function () {
  if (!recuperacao) return;
  const usuario = usuarios.find(function (pessoa) { return pessoa.email === recuperacao.email; });
  if (usuario) gerarCodigo(usuario);
});
selecionar('#change-recovery-email').addEventListener('click', function () {
  limparRecuperacao();
  selecionar('#recovery-email').focus();
});
selecionar('#recovery-password-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!recuperacao || !recuperacao.verificado || Date.now() >= recuperacao.validade) {
    limparRecuperacao();
    exibirMensagem('recovery-message', 'A verificação expirou. Informe seu e-mail para gerar outro código.');
    return;
  }
  const senha = selecionar('#recovery-password').value;
  if (!senhaValida(senha)) {
    exibirMensagem('recovery-message', 'Use de 8 a 30 caracteres, uma maiúscula, uma minúscula e um caractere especial.');
    return;
  }
  if (senha !== selecionar('#recovery-confirm').value) {
    exibirMensagem('recovery-message', 'As senhas não coincidem.');
    return;
  }
  const usuario = usuarios.find(function (pessoa) { return pessoa.email === recuperacao.email; });
  if (!usuario) { limparRecuperacao(); return; }
  usuario.senha = senha;
  selecionar('#login-email').value = usuario.email;
  limparRecuperacao(); // O código é de uso único.
  usuarioLogado = null;
  atualizarConta();
  retornoLogin = 'perfil';
  selecionar('#login-message').textContent = 'Senha alterada! Entre com sua nova senha.';
  selecionar('#login-message').classList.add('success');
  location.hash = '#login';
});

// PERFIL: NUNCA COPIAMOS CPF OU E-MAIL DOS CAMPOS PARA O CADASTRO.
function preencherPerfil() {
  selecionar('#profile-name').value = usuarioLogado.nome;
  selecionar('#profile-phone').value = usuarioLogado.telefone;
  selecionar('#profile-birth').value = usuarioLogado.nascimento;
  selecionar('#profile-email').value = usuarioLogado.email;
  selecionar('#profile-cpf').value = usuarioLogado.cpf;
  selecionar('#profile-greeting').textContent = usuarioLogado.nome;
  selecionar('#profile-avatar').textContent = usuarioLogado.nome.charAt(0).toUpperCase();
}
selecionar('#profile-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado) { location.hash = '#login'; return; }
  const atualizado = {
    nome: selecionar('#profile-name').value.trim(),
    telefone: selecionar('#profile-phone').value.replace(/\D/g, ''),
    nascimento: selecionar('#profile-birth').value,
    cpf: usuarioLogado.cpf, email: usuarioLogado.email, senha: usuarioLogado.senha
  };
  const erros = validarCadastro(atualizado);
  if (Object.keys(erros).length) {
    exibirMensagem('profile-message', Object.values(erros).join(' '));
    return;
  }
  usuarioLogado.nome = atualizado.nome;
  usuarioLogado.telefone = atualizado.telefone;
  usuarioLogado.nascimento = atualizado.nascimento;
  preencherPerfil();
  atualizarConta();
  exibirMensagem('profile-message', 'Dados atualizados com sucesso.', true);
});
selecionar('#profile-password-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado) { location.hash = '#login'; return; }
  if (selecionar('#profile-current-password').value !== usuarioLogado.senha) {
    exibirMensagem('profile-password-message', 'A senha atual está incorreta.');
    return;
  }
  const senha = selecionar('#profile-new-password').value;
  if (!senhaValida(senha)) {
    exibirMensagem('profile-password-message', 'Use de 8 a 30 caracteres, uma maiúscula, uma minúscula e um caractere especial.');
    return;
  }
  if (senha !== selecionar('#profile-confirm-password').value) {
    exibirMensagem('profile-password-message', 'As senhas não coincidem.');
    return;
  }
  usuarioLogado.senha = senha;
  recuperacao = null;
  this.reset();
  exibirMensagem('profile-password-message', 'Senha atualizada com sucesso.', true);
});

// DATAS DO ALUGUEL: primeiro e último dia são incluídos.
function dataISO(data) {
  return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
}
function lerData(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const partes = texto.split('-').map(Number);
  const data = new Date(partes[0], partes[1] - 1, partes[2], 12);
  return dataISO(data) === texto ? data : null;
}
function formatarData(texto) {
  const data = lerData(texto);
  return data ? data.toLocaleDateString('pt-BR') : '—';
}
function quantidadeDias(inicio, fim) {
  const a = lerData(inicio), b = lerData(fim);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000) + 1;
}
function motivoOcupacao(dia, ignorarPedido) {
  const ativos = alugueis.filter(function (a) { return (!ignorarPedido || a.id !== ignorarPedido) && ['pendente', 'aprovada'].includes(a.status); });
  if (ativos.some(function (a) { return dia >= a.inicio && dia <= a.fim; })) return 'Reservado';
  if (ativos.some(function (a) { return dia === deslocarDia(a.inicio, -1) || dia === deslocarDia(a.fim, 1); })) return 'Limpeza';
  if (diasExemplo.includes(dia) || bloqueiosAgenda.some(function (b) { return dia >= b.inicio && dia <= b.fim; })) return 'Bloqueado';
  return '';
}
function diaOcupado(dia, ignorarPedido) {
  return Boolean(motivoOcupacao(dia, ignorarPedido));
}
function erroPeriodo(inicio, fim) {
  if (!lerData(inicio) || !lerData(fim)) return 'Escolha o primeiro e o último dia.';
  if (inicio < dataISO(hojeAgenda)) return 'Escolha uma data a partir de hoje.';
  if (fim < inicio) return 'O último dia não pode ser anterior ao primeiro.';
  if (fim > dataISO(limiteAgenda)) return 'Escolha datas até ' + formatarData(dataISO(limiteAgenda)) + '.';
  const dia = lerData(inicio);
  while (dataISO(dia) <= fim) {
    if (diaOcupado(dataISO(dia))) return 'O período inclui dias indisponíveis. Escolha outro intervalo.';
    dia.setDate(dia.getDate() + 1);
  }
  return '';
}
function textoPeriodo(inicio, fim) {
  const dias = quantidadeDias(inicio, fim);
  return formatarData(inicio) + ' a ' + formatarData(fim) + ' · ' + dias + (dias === 1 ? ' dia' : ' dias');
}
function atualizarSelecao() {
  const inicio = selecionar('#rental-start').value;
  const fim = selecionar('#rental-end').value;
  selecionar('#period-summary').textContent = inicio && fim && lerData(inicio) && lerData(fim) && fim >= inicio
    ? textoPeriodo(inicio, fim) : 'Escolha o primeiro e o último dia. Para um único dia, selecione a mesma data.';
  selecionar('#dates-message').textContent = inicio && fim ? erroPeriodo(inicio, fim) : '';
  selecionar('#dates-price').textContent = inicio && fim && !erroPeriodo(inicio, fim)
    ? textoPreco(calcularPreco(inicio, fim))
    : 'Diária padrão: ' + formatarValor(configuracaoAluguel.diariaCentavos) + '. Selecione as datas para calcular o total.';
  selecionar('#dates-breakdown').textContent = inicio && fim && !erroPeriodo(inicio, fim) ? detalharDiarias(calcularPreco(inicio, fim)) : '';
}
function renderizarCalendario() {
  const inicio = selecionar('#rental-start').value;
  const fim = selecionar('#rental-end').value;
  selecionar('#calendar-title').textContent = mesAgenda.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  selecionar('#previous-month').disabled = mesAgenda.getFullYear() === hojeAgenda.getFullYear() && mesAgenda.getMonth() === hojeAgenda.getMonth();
  selecionar('#next-month').disabled = mesAgenda.getFullYear() === limiteAgenda.getFullYear() && mesAgenda.getMonth() === limiteAgenda.getMonth();
  const grade = selecionar('#calendar-days');
  grade.replaceChildren();
  for (let vazio = 0; vazio < mesAgenda.getDay(); vazio++) {
    const espaco = criarElemento('span');
    espaco.setAttribute('aria-hidden', 'true');
    grade.append(espaco);
  }
  const quantidade = new Date(mesAgenda.getFullYear(), mesAgenda.getMonth() + 1, 0).getDate();
  for (let numero = 1; numero <= quantidade; numero++) {
    const dia = dataISO(new Date(mesAgenda.getFullYear(), mesAgenda.getMonth(), numero, 12));
    const ocupado = diaOcupado(dia);
    const passado = dia < dataISO(hojeAgenda);
    const selecionado = dia === inicio || dia === fim || (inicio && fim && dia > inicio && dia < fim);
    const botao = criarElemento('button', String(numero), 'calendar-day');
    botao.type = 'button';
    botao.disabled = passado || ocupado;
    botao.classList.toggle('selected', Boolean(selecionado));
    botao.classList.toggle('busy', ocupado);
    const motivo = motivoOcupacao(dia);
    botao.classList.toggle('cleaning', motivo === 'Limpeza');
    botao.setAttribute('aria-pressed', String(Boolean(selecionado)));
    const preco = precoDoDia(dia);
    const descricao = formatarData(dia) + (passado ? ', data passada' : ocupado ? ', ' + motivo : ', disponível, ' + formatarValor(preco.centavos) + ', ' + preco.regra) + (nomeFeriado(dia) ? ', ' + nomeFeriado(dia) : '');
    botao.setAttribute('aria-label', descricao);
    botao.title = descricao;
    if (!passado && !ocupado) botao.append(criarElemento('small', formatarValor(preco.centavos), 'day-price'));
    if (!passado && motivo === 'Limpeza') botao.append(criarElemento('small', 'Limpeza', 'day-price'));
    if (dia === dataISO(hojeAgenda)) botao.setAttribute('aria-current', 'date');
    botao.addEventListener('click', function () {
      if (!inicio || fim || dia < inicio) {
        selecionar('#rental-start').value = dia;
        selecionar('#rental-end').value = '';
      } else selecionar('#rental-end').value = dia;
      atualizarSelecao();
      renderizarCalendario();
    });
    grade.append(botao);
  }
}
selecionar('#previous-month').addEventListener('click', function () {
  mesAgenda.setMonth(mesAgenda.getMonth() - 1);
  renderizarCalendario();
});
selecionar('#next-month').addEventListener('click', function () {
  mesAgenda.setMonth(mesAgenda.getMonth() + 1);
  renderizarCalendario();
});
['rental-start', 'rental-end'].forEach(function (id) {
  const campo = selecionar('#' + id);
  campo.min = dataISO(hojeAgenda);
  campo.max = dataISO(limiteAgenda);
  campo.addEventListener('change', function () {
    if (lerData(campo.value) && campo.value >= dataISO(hojeAgenda) && campo.value <= dataISO(limiteAgenda)) {
      const data = lerData(campo.value);
      mesAgenda = new Date(data.getFullYear(), data.getMonth(), 1, 12);
    }
    atualizarSelecao();
    renderizarCalendario();
  });
});
selecionar('#clear-dates').addEventListener('click', function () {
  selecionar('#dates-form').reset();
  rascunhoAluguel = null;
  atualizarSelecao();
  renderizarCalendario();
});
selecionar('#dates-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const inicio = selecionar('#rental-start').value, fim = selecionar('#rental-end').value;
  const erro = erroPeriodo(inicio, fim);
  if (erro) { exibirMensagem('dates-message', erro); return; }
  rascunhoAluguel = { inicio: inicio, fim: fim, preco: calcularPreco(inicio, fim), detalhes: rascunhoAluguel ? rascunhoAluguel.detalhes : null };
  if (!usuarioLogado) {
    retornoLogin = 'aluguel-dados';
    selecionar('#login-message').classList.remove('success');
    selecionar('#login-message').textContent = 'Entre ou crie sua conta para continuar. Suas datas estão selecionadas.';
    location.hash = '#login';
  } else location.hash = '#aluguel-dados';
});

// DETALHES → REVISÃO → ENVIO, SEM COBRANÇA OU APROVAÇÃO AUTOMÁTICA.
function preencherFormularioAluguel() {
  const detalhes = rascunhoAluguel.detalhes;
  selecionar('#rental-name').value = usuarioLogado.nome;
  selecionar('#rental-email').value = usuarioLogado.email;
  selecionar('#rental-phone').value = detalhes ? detalhes.telefone : usuarioLogado.telefone;
  selecionar('#rental-guests').value = detalhes ? detalhes.pessoas : '';
  selecionar('#rental-cleaning').checked = Boolean(detalhes && detalhes.limpeza);
  selecionar('#rental-extended-exit').checked = Boolean(detalhes && detalhes.saidaEstendida);
  selecionar('#rental-extended-exit-time').value = detalhes ? detalhes.horarioSaidaEstendida || '' : '';
  selecionar('#extended-exit-time-field').hidden = !selecionar('#rental-extended-exit').checked;
  selecionar('#rental-purpose').value = detalhes ? detalhes.tipo : '';
  selecionar('#rental-notes').value = detalhes ? detalhes.observacoes : '';
  selecionar('#rental-period').textContent = textoPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  atualizarAdicionais();
}
function atualizarAdicionais() {
  if (!rascunhoAluguel) return;
  const pessoas = Number(selecionar('#rental-guests').value);
  selecionar('#rental-fees').textContent = 'Até 15 pessoas incluídas. A partir da 16ª: ' + formatarValor(configuracaoAluguel.pessoaCentavos) + ' por pessoa, uma vez por aluguel. Limpeza opcional: ' + formatarValor(configuracaoAluguel.limpezaCentavos) + ' por aluguel. Saída estendida: ' + configuracaoAluguel.saidaEstendidaPercentual + '% da diária do último dia.';
  if (!Number.isSafeInteger(pessoas) || pessoas < 1) {
    selecionar('#rental-costs').replaceChildren();
    selecionar('#rental-price').textContent = 'Informe a quantidade de pessoas para calcular o total.';
    return;
  }
  rascunhoAluguel.preco = calcularPreco(rascunhoAluguel.inicio, rascunhoAluguel.fim, pessoas, selecionar('#rental-cleaning').checked, selecionar('#rental-extended-exit').checked);
  selecionar('#rental-price').textContent = textoPreco(rascunhoAluguel.preco);
  preencherDetalhes('rental-costs', [
    ['Diárias', formatarValor(rascunhoAluguel.preco.subtotalCentavos)],
    ['Pessoas adicionais (' + rascunhoAluguel.preco.pessoasExtras + ')', formatarValor(rascunhoAluguel.preco.adicionalPessoasCentavos)],
    ['Limpeza opcional', formatarValor(rascunhoAluguel.preco.limpezaCentavos)],
    ['Saída estendida (' + rascunhoAluguel.preco.saidaEstendidaPercentual + '% da última diária)', formatarValor(rascunhoAluguel.preco.saidaEstendidaCentavos)]
  ]);
}
selecionar('#rental-guests').addEventListener('input', atualizarAdicionais);
selecionar('#rental-cleaning').addEventListener('change', function () {
  if (this.checked && !window.confirm('Ao contratar a limpeza, a equipe do Sítio Raio de Sol ficará responsável pela limpeza do local após o aluguel. Deseja continuar?')) {
    this.checked = false;
  }
  atualizarAdicionais();
});
selecionar('#rental-extended-exit').addEventListener('change', function () {
  if (this.checked && !window.confirm('A saída estendida permite permanecer até as 10h do dia seguinte ao término do aluguel. Após esse horário, será cobrada uma diária adicional. Deseja solicitar a saída estendida?')) {
    this.checked = false;
  }
  const solicitado = this.checked;
  selecionar('#extended-exit-time-field').hidden = !solicitado;
  selecionar('#rental-extended-exit-time').required = solicitado;
  if (!solicitado) selecionar('#rental-extended-exit-time').value = '';
  atualizarAdicionais();
});
selecionar('#rental-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado || !rascunhoAluguel) { location.hash = '#disponibilidade'; return; }
  if (!selecionar('#rental-cleaning').checked && !window.confirm('Sem contratar a taxa de limpeza, você será totalmente responsável por entregar o sítio nas mesmas condições em que o recebeu. Deseja continuar sem o serviço de limpeza?')) return;
  const telefone = selecionar('#rental-phone').value.replace(/\D/g, '');
  const pessoas = Number(selecionar('#rental-guests').value);
  if (!/^[1-9]{2}\d{8,9}$/.test(telefone)) {
    exibirMensagem('rental-message', 'Informe um telefone válido com DDD.');
    return;
  }
  if (!Number.isSafeInteger(pessoas) || pessoas < 1) {
    exibirMensagem('rental-message', 'Informe uma quantidade inteira de pessoas, a partir de 1.');
    return;
  }
  const saidaEstendida = selecionar('#rental-extended-exit').checked;
  const horarioSaidaEstendida = selecionar('#rental-extended-exit-time').value;
  if (saidaEstendida && !horarioSaidaEstendida) {
    exibirMensagem('rental-message', 'Informe o horário desejado para a saída estendida.');
    return;
  }
  const erro = erroPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  if (erro) { exibirMensagem('rental-message', erro); return; }
  rascunhoAluguel.detalhes = {
    nome: usuarioLogado.nome, email: usuarioLogado.email, telefone: telefone,
    limpeza: selecionar('#rental-cleaning').checked,
    saidaEstendida: saidaEstendida, horarioSaidaEstendida: horarioSaidaEstendida,
    pessoas: pessoas, tipo: selecionar('#rental-purpose').value,
    observacoes: selecionar('#rental-notes').value.trim()
  };
  atualizarAdicionais();
  selecionar('#rental-acknowledgement').checked = false;
  location.hash = '#aluguel-revisao';
});
function paresAluguel(aluguel) {
  return [
    ['Período', textoPeriodo(aluguel.inicio, aluguel.fim)],
    ['Modalidade', 'Aluguel por dia'],
    ['Diárias do período', detalharDiarias(aluguel.preco)],
    ['Adicional por pessoas', formatarValor(aluguel.preco.adicionalPessoasCentavos || 0) + ' (' + (aluguel.preco.pessoasExtras || 0) + ' pessoas adicionais)'],
    ['Serviço de limpeza', aluguel.detalhes.limpeza ? formatarValor(aluguel.preco.limpezaCentavos || 0) : 'Cliente responsável pela limpeza'],
    ['Saída estendida', aluguel.detalhes.saidaEstendida ? 'Solicitada para ' + aluguel.detalhes.horarioSaidaEstendida + ' · ' + aluguel.preco.saidaEstendidaPercentual + '% da diária (' + formatarValor(aluguel.preco.saidaEstendidaCentavos) + ') · aguardando confirmação' : 'Não solicitada'],
    ['Pagamento', aluguel.pagamento ? 'Simulação concluída · ' + aluguel.pagamento.metodo : 'Aguardando pagamento após aprovação'],
    ['Total do período', formatarValor(aluguel.preco.totalCentavos)],
    ['Dias bloqueados para limpeza', formatarData(deslocarDia(aluguel.inicio, -1)) + ' e ' + formatarData(deslocarDia(aluguel.fim, 1))],
    ['Responsável', aluguel.detalhes.nome],
    ['E-mail', aluguel.detalhes.email],
    ['Telefone', aluguel.detalhes.telefone],
    ['Pessoas', String(aluguel.detalhes.pessoas)],
    ['Tipo de encontro', aluguel.detalhes.tipo],
    ['Observações', aluguel.detalhes.observacoes || 'Nenhuma observação.']
  ];
}
selecionar('#review-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado || !rascunhoAluguel || !rascunhoAluguel.detalhes) return;
  if (rascunhoAluguel.detalhes.email !== usuarioLogado.email) { location.hash = '#disponibilidade'; return; }
  if (!selecionar('#rental-acknowledgement').checked) return;
  const erro = erroPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  if (erro) { exibirMensagem('review-message', erro); return; }
  const aluguel = {
    id: 'RS-' + String(proximoProtocolo++).padStart(4, '0'),
    inicio: rascunhoAluguel.inicio, fim: rascunhoAluguel.fim,
    detalhes: { ...rascunhoAluguel.detalhes },
    preco: { ...rascunhoAluguel.preco }, // Guarda o preço que o cliente viu antes de enviar.
    status: 'pendente', criadoEm: new Date().toLocaleString('pt-BR')
  };
  alugueis.push(aluguel);
  ultimoAluguel = aluguel.id;
  rascunhoAluguel = null; // Impede duplicar o pedido com um segundo clique.
  selecionar('#dates-form').reset();
  selecionar('#rental-form').reset();
  location.hash = '#aluguel-confirmacao';
});

// HISTÓRICO E DETALHES: EXIBE SOMENTE PEDIDOS DO CLIENTE ATUAL.
function meusAlugueis() {
  return usuarioLogado ? alugueis.filter(function (aluguel) {
    return aluguel.detalhes.email === usuarioLogado.email;
  }) : [];
}
function meuAluguel(id) {
  return meusAlugueis().find(function (aluguel) { return aluguel.id === id; });
}
function textoStatus(status) {
  return { pendente: 'Aguardando aprovação', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada' }[status] || status;
}
function renderizarHistorico() {
  const lista = meusAlugueis();
  selecionar('#history-total').textContent = lista.length;
  selecionar('#history-pending').textContent = lista.filter(function (a) { return a.status === 'pendente'; }).length;
  selecionar('#history-cancelled').textContent = lista.filter(function (a) { return a.status === 'cancelada'; }).length;
  const filtro = selecionar('#history-filter').value;
  const visiveis = lista.filter(function (a) { return filtro === 'todos' || a.status === filtro; }).reverse();
  const destino = selecionar('#history-list');
  destino.replaceChildren();
  if (!visiveis.length) {
    const vazio = criarElemento('div', undefined, 'panel empty-state');
    vazio.append(criarElemento('span', '☀', 'empty-sun'), criarElemento('h2', lista.length ? 'Nenhuma solicitação neste filtro.' : 'Suas próximas memórias começam aqui.'), criarElemento('p', lista.length ? 'Escolha outro status para ver seus pedidos.' : 'Você ainda não solicitou um aluguel. Escolha suas datas e planeje seu encontro.'));
    const link = criarElemento('a', 'Ver dias disponíveis →', 'button');
    link.href = '#disponibilidade';
    vazio.append(link);
    destino.append(vazio);
  }
  visiveis.forEach(function (aluguel) {
    const card = criarElemento('article', undefined, 'panel rental-card');
    const info = criarElemento('div');
    info.append(criarElemento('span', aluguel.id, 'eyebrow'), criarElemento('h2', textoPeriodo(aluguel.inicio, aluguel.fim)), criarElemento('p', aluguel.detalhes.tipo + ' · ' + aluguel.detalhes.pessoas + ' pessoa(s)', 'muted'));
    const acoes = criarElemento('div', undefined, 'rental-card-actions');
    const link = criarElemento('a', 'Ver detalhes →', 'button outline');
    link.href = '#aluguel-detalhe/' + aluguel.id;
    acoes.append(criarElemento('span', textoStatus(aluguel.status), 'pill ' + aluguel.status), link);
    card.append(info, acoes);
    destino.append(card);
  });
}
selecionar('#history-filter').addEventListener('change', renderizarHistorico);
function renderizarDetalhe(aluguel) {
  selecionar('#detail-title').textContent = 'Solicitação ' + aluguel.id;
  selecionar('#detail-status').textContent = textoStatus(aluguel.status);
  selecionar('#detail-status').className = 'pill ' + aluguel.status;
  preencherDetalhes('rental-details', [['Registrada em', aluguel.criadoEm], ...paresAluguel(aluguel)]);
  selecionar('#payment-link').hidden = aluguel.status !== 'aprovada';
  selecionar('#payment-link').href = '#' + (aluguel.pagamento ? 'pagamento-resultado/' : 'pagamento/') + aluguel.id;
  selecionar('#payment-link').textContent = aluguel.pagamento ? 'Ver comprovante demonstrativo' : 'Ir para pagamento';
  selecionar('#cancel-rental').hidden = aluguel.status !== 'pendente';
  selecionar('#detail-message').textContent = aluguel.status === 'cancelada'
    ? 'Esta solicitação foi cancelada. Você pode escolher novas datas e criar outro pedido.'
    : aluguel.status === 'aprovada' ? 'Sua reserva foi aprovada. ' + (aluguel.motivo || '')
    : aluguel.status === 'recusada' ? 'Solicitação recusada. Motivo: ' + aluguel.motivo
    : 'Seu pedido aguarda análise. Você pode cancelar a solicitação enquanto estiver pendente.';
}
selecionar('#cancel-rental').addEventListener('click', function () {
  const aluguel = meuAluguel(location.hash.split('/')[1]);
  if (!aluguel || aluguel.status !== 'pendente') return;
  cancelamentoSelecionado = aluguel.id;
  selecionar('#cancel-dialog').showModal();
});
selecionar('#keep-rental').addEventListener('click', function () { selecionar('#cancel-dialog').close(); });
selecionar('#confirm-cancellation').addEventListener('click', function () {
  const aluguel = meuAluguel(cancelamentoSelecionado);
  if (aluguel && aluguel.status === 'pendente') {
    aluguel.status = 'cancelada';
    notificarCliente(aluguel, 'Solicitação cancelada. O período foi liberado.');
    renderizarDetalhe(aluguel);
    mostrarAviso('Solicitação cancelada. O período ficou disponível novamente.');
  }
  selecionar('#cancel-dialog').close();
  cancelamentoSelecionado = null;
});

// PREPARAÇÃO DAS TELAS E CONTROLE DA NAVEGAÇÃO
function limparSessao() {
  rascunhoAluguel = null;
  ultimoAluguel = null;
  cancelamentoSelecionado = null;
  limparRecuperacao();
  selecionar('#dates-form').reset();
  selecionar('#rental-form').reset();
  selecionar('#profile-password-form').reset();
  selecionar('#cancel-dialog').close();
  selecionar('#history-filter').value = 'todos';
  retornoLogin = 'perfil';
}
function prepararTela(tela) {
  if (tela === 'pagamento' || tela === 'pagamento-resultado') return prepararPagamento(tela);
  if (tela.startsWith('admin')) prepararAdministracao(tela);
  if (tela !== 'recuperar') limparRecuperacao();
  if (tela !== 'perfil') selecionar('#profile-password-form').reset();
  selecionar('#cancel-dialog').close();
  if (tela === 'perfil' && usuarioLogado) {
    preencherPerfil();
    const verAlugueis = location.hash === '#perfil/alugueis';
    const verNotificacoes = location.hash === '#perfil/notificacoes';
    selecionar('#profile-data').hidden = verAlugueis || verNotificacoes;
    selecionar('#profile-notifications').hidden = !verNotificacoes;
    selecionar('#profile-rentals').hidden = !verAlugueis;
    selecionar('#profile-data-link').removeAttribute('aria-current');
    selecionar('#profile-rentals-link').removeAttribute('aria-current');
    selecionar('#profile-notifications-link').removeAttribute('aria-current');
    selecionar(verNotificacoes ? '#profile-notifications-link' : verAlugueis ? '#profile-rentals-link' : '#profile-data-link').setAttribute('aria-current', 'page');
    if (verNotificacoes) renderizarNotificacoes();
    if (verAlugueis) {
      selecionar('#profile-password-form').reset();
      renderizarHistorico();
    }
    exibirMensagem('profile-message', '');
    exibirMensagem('profile-password-message', '');
  }
  if (tela === 'disponibilidade') { atualizarSelecao(); renderizarCalendario(); }
  if (tela === 'aluguel-dados' || tela === 'aluguel-revisao') {
    if (!usuarioLogado || !rascunhoAluguel || erroPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim)) {
      location.hash = '#disponibilidade';
      return false;
    }
    if (tela === 'aluguel-dados') {
      preencherFormularioAluguel();
      exibirMensagem('rental-message', '');
    } else {
      if (!rascunhoAluguel.detalhes || rascunhoAluguel.detalhes.email !== usuarioLogado.email) {
        location.hash = '#aluguel-dados';
        return false;
      }
      preencherDetalhes('review-details', paresAluguel(rascunhoAluguel));
      exibirMensagem('review-message', '');
    }
  }
  if (tela === 'aluguel-confirmacao') {
    const aluguel = meuAluguel(ultimoAluguel);
    if (!aluguel) { location.hash = '#perfil/alugueis'; return false; }
    preencherDetalhes('confirmation-details', [['Protocolo', aluguel.id], ['Período', textoPeriodo(aluguel.inicio, aluguel.fim)], ['Status', textoStatus(aluguel.status)], ['Total do período', formatarValor(aluguel.preco.totalCentavos)]]);
    selecionar('#confirmation-link').href = '#aluguel-detalhe/' + aluguel.id;
  }
  if (tela === 'aluguel-detalhe') {
    const aluguel = meuAluguel(location.hash.split('/')[1]);
    if (!aluguel) { location.hash = '#perfil/alugueis'; mostrarAviso('Solicitação não encontrada nesta conta.'); return false; }
    renderizarDetalhe(aluguel);
  }
  return true;
}

// ADMINISTRAÇÃO DEMONSTRATIVA — permissões e dados somente nesta página.
const bloqueiosAgenda = [];
const notificacoes = [];
function ehAdministrador() {
  return Boolean(usuarioLogado && usuarioLogado.papel === 'admin');
}
function notificarCliente(aluguel, texto) {
  notificacoes.unshift({ email: aluguel.detalhes.email, pedido: aluguel.id,
    texto: texto, data: new Date().toLocaleString('pt-BR') });
}
function renderizarNotificacoes() {
  const destino = selecionar('#notifications-list');
  destino.replaceChildren();
  const minhas = notificacoes.filter(function (item) { return usuarioLogado && item.email === usuarioLogado.email; });
  if (!minhas.length) destino.append(criarElemento('p', 'Você ainda não tem notificações.', 'panel'));
  minhas.forEach(function (item) {
    const card = criarElemento('article', undefined, 'panel');
    const link = criarElemento('a', 'Ver solicitação ' + item.pedido + ' →', 'back-link');
    link.href = '#aluguel-detalhe/' + item.pedido;
    card.append(criarElemento('small', item.data), criarElemento('p', item.texto), link);
    destino.append(card);
  });
}
function linkAdministrativo(texto, destino) {
  const link = criarElemento('a', texto, 'button outline');
  link.href = destino;
  return link;
}
function renderizarPainelAdmin() {
  selecionar('#admin-pending').textContent = alugueis.filter(function (a) { return a.status === 'pendente'; }).length;
  selecionar('#admin-approved').textContent = alugueis.filter(function (a) { return a.status === 'aprovada'; }).length;
  selecionar('#admin-rate').textContent = formatarValor(configuracaoAluguel.diariaCentavos);
  const proximos = alugueis.filter(function (a) { return a.status === 'aprovada' && a.fim >= dataISO(hojeAgenda); })
    .sort(function (a, b) { return a.inicio.localeCompare(b.inicio); });
  const lista = selecionar('#admin-upcoming');
  lista.replaceChildren();
  if (!proximos.length) lista.append(criarElemento('p', 'Nenhum aluguel aprovado por enquanto.', 'panel'));
  proximos.forEach(function (a) {
    const card = criarElemento('article', undefined, 'panel rental-card');
    card.append(criarElemento('p', a.detalhes.nome + ' · ' + textoPeriodo(a.inicio, a.fim)), linkAdministrativo(a.id + ' →', '#admin-pedidos/' + a.id));
    lista.append(card);
  });
}
function renderizarPedidosAdmin() {
  const filtro = selecionar('#admin-filter').value || 'todos';
  const lista = selecionar('#admin-orders');
  lista.replaceChildren();
  const pedidos = alugueis.filter(function (a) { return filtro === 'todos' || a.status === filtro; }).slice().reverse();
  if (!pedidos.length) lista.append(criarElemento('p', 'Nenhuma solicitação neste filtro.', 'panel'));
  pedidos.forEach(function (a) {
    const card = criarElemento('article', undefined, 'panel rental-card');
    const texto = criarElemento('div');
    texto.append(criarElemento('h2', a.id + ' · ' + a.detalhes.nome), criarElemento('p', textoPeriodo(a.inicio, a.fim)), criarElemento('p', textoPreco(a.preco)), criarElemento('span', textoStatus(a.status), 'pill ' + a.status));
    card.append(texto, linkAdministrativo('Analisar pedido →', '#admin-pedidos/' + a.id));
    lista.append(card);
  });
  const pedido = alugueis.find(function (a) { return a.id === location.hash.split('/')[1]; });
  selecionar('#admin-order-panel').hidden = !pedido;
  if (!pedido) return;
  selecionar('#admin-order-title').textContent = 'Solicitação ' + pedido.id;
  preencherDetalhes('admin-order-details', [['Status', textoStatus(pedido.status)], ...paresAluguel(pedido), ['Observação do administrador', pedido.motivo || '—']]);
  selecionar('#admin-decision-form').hidden = pedido.status !== 'pendente';
  selecionar('#admin-decision-form').reset();
  exibirMensagem('admin-decision-message', '');
}
// Toda alteração verifica o papel novamente, além da proteção das telas.
function decidirPedido(id, decisao, motivo) {
  if (!ehAdministrador()) return 'Acesso exclusivo do administrador.';
  const pedido = alugueis.find(function (a) { return a.id === id; });
  if (!pedido || pedido.status !== 'pendente') return 'Este pedido não está mais pendente.';
  if (!['aprovada', 'recusada'].includes(decisao)) return 'Escolha aprovar ou recusar.';
  motivo = motivo.trim();
  if (motivo.length > 500) return 'Use até 500 caracteres na observação.';
  if (decisao === 'recusada' && !motivo) return 'Informe o motivo da recusa.';
  if (decisao === 'aprovada') {
    if (pedido.inicio < dataISO(hojeAgenda)) return 'Não é possível aprovar um período passado.';
    for (let dia = pedido.inicio; dia <= pedido.fim; dia = deslocarDia(dia, 1)) {
      if (diaOcupado(dia, id)) return 'Há conflito de reserva, limpeza ou bloqueio. Revise a agenda antes de aprovar.';
    }
  }
  pedido.status = decisao;
  pedido.motivo = motivo;
  notificarCliente(pedido, 'Solicitação ' + id + ': ' + textoStatus(decisao) + (motivo ? '. ' + motivo : '.'));
  return '';
}
selecionar('#admin-decision-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const decisao = evento.submitter && evento.submitter.value;
  const erro = decidirPedido(location.hash.split('/')[1], decisao, selecionar('#admin-reason').value);
  if (erro) { exibirMensagem('admin-decision-message', erro); return; }
  renderizarPedidosAdmin();
  mostrarAviso('Decisão registrada. O cliente já pode acompanhar pelo perfil.');
});
selecionar('#admin-filter').addEventListener('change', function () { if (ehAdministrador()) renderizarPedidosAdmin(); });
function valorEmCentavos(texto, opcional = false) {
  if (opcional && texto.trim() === '') return null;
  const valor = Number(texto);
  if (!Number.isFinite(valor) || valor <= 0 || valor > 1000000 || Math.abs(valor * 100 - Math.round(valor * 100)) > 0.00001) return NaN;
  return Math.round(valor * 100);
}
selecionar('#admin-price-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!ehAdministrador()) return;
  const padrao = valorEmCentavos(selecionar('#admin-daily-price').value);
  const fimSemana = valorEmCentavos(selecionar('#admin-weekend-price').value, true);
  const feriado = valorEmCentavos(selecionar('#admin-holiday-price').value, true);
  if ([padrao, fimSemana, feriado].some(Number.isNaN)) {
    exibirMensagem('admin-price-message', 'Use valores positivos de até R$ 1.000.000,00, com no máximo duas casas decimais. Fim de semana e feriado podem ficar vazios.'); return;
  }
  configuracaoAluguel.diariaCentavos = padrao;
  configuracaoAluguel.fimSemanaCentavos = fimSemana;
  configuracaoAluguel.feriadoCentavos = feriado;
  exibirMensagem('admin-price-message', 'Regras salvas. Novas seleções usam esses preços; pedidos já enviados mantêm os valores registrados.', true);
});
function definirPrecoEspecifico(inicio, fim, valor) {
  if (!ehAdministrador()) return 'Acesso exclusivo do administrador.';
  if (!lerData(inicio) || !lerData(fim) || inicio < dataISO(hojeAgenda) || fim < inicio || fim > dataISO(limiteAgenda)) return 'Escolha um período válido entre hoje e ' + formatarData(dataISO(limiteAgenda)) + '.';
  const centavos = valorEmCentavos(valor);
  if (Number.isNaN(centavos)) return 'Informe um valor positivo de até R$ 1.000.000,00 com até duas casas decimais.';
  for (let dia = inicio; dia <= fim; dia = deslocarDia(dia, 1)) configuracaoAluguel.datas[dia] = centavos;
  return '';
}
selecionar('#admin-special-price-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const erro = definirPrecoEspecifico(selecionar('#admin-special-start').value, selecionar('#admin-special-end').value, selecionar('#admin-special-price').value);
  if (erro) { exibirMensagem('admin-special-message', erro); return; }
  renderizarPrecosEspecificos();
  exibirMensagem('admin-special-message', 'Preço aplicado às datas selecionadas. Pedidos existentes não foram alterados.', true);
});
function renderizarPrecosEspecificos() {
  const lista = selecionar('#admin-special-prices');
  lista.replaceChildren();
  const datas = Object.keys(configuracaoAluguel.datas).sort();
  if (!datas.length) lista.append(criarElemento('p', 'Nenhuma data com preço específico.'));
  datas.forEach(function (dia) {
    const item = criarElemento('div', undefined, 'panel rental-card');
    const editar = criarElemento('button', 'Editar', 'button outline');
    editar.type = 'button';
    editar.addEventListener('click', function () {
      if (!ehAdministrador()) return;
      selecionar('#admin-special-start').value = dia;
      selecionar('#admin-special-end').value = dia;
      selecionar('#admin-special-price').value = (configuracaoAluguel.datas[dia] / 100).toFixed(2);
      selecionar('#admin-special-price').focus();
    });
    const remover = criarElemento('button', 'Remover exceção', 'button outline');
    remover.type = 'button';
    remover.addEventListener('click', function () {
      if (!ehAdministrador()) return;
      delete configuracaoAluguel.datas[dia];
      renderizarPrecosEspecificos();
      exibirMensagem('admin-special-message', 'Exceção removida. A data volta a seguir as regras gerais.', true);
    });
    const acoes = criarElemento('div', undefined, 'actions');
    acoes.append(editar, remover);
    item.append(criarElemento('p', formatarData(dia) + ' · ' + formatarValor(configuracaoAluguel.datas[dia])), acoes);
    lista.append(item);
  });
}
function adicionarBloqueio(inicio, fim, motivo) {
  if (!ehAdministrador()) return 'Acesso exclusivo do administrador.';
  const erro = erroPeriodo(inicio, fim);
  if (erro) return erro;
  if (!motivo.trim() || motivo.trim().length > 200) return 'Informe um motivo com até 200 caracteres.';
  bloqueiosAgenda.push({ inicio: inicio, fim: fim, motivo: motivo.trim() });
  return '';
}
selecionar('#admin-block-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const erro = adicionarBloqueio(selecionar('#admin-block-start').value, selecionar('#admin-block-end').value, selecionar('#admin-block-reason').value);
  if (erro) { exibirMensagem('admin-block-message', erro); return; }
  this.reset();
  renderizarAgendaAdmin();
  exibirMensagem('admin-block-message', 'Período bloqueado para novos pedidos.', true);
});
function renderizarAgendaAdmin() {
  selecionar('#admin-daily-price').value = (configuracaoAluguel.diariaCentavos / 100).toFixed(2);
  selecionar('#admin-weekend-price').value = configuracaoAluguel.fimSemanaCentavos === null ? '' : (configuracaoAluguel.fimSemanaCentavos / 100).toFixed(2);
  selecionar('#admin-holiday-price').value = configuracaoAluguel.feriadoCentavos === null ? '' : (configuracaoAluguel.feriadoCentavos / 100).toFixed(2);
  selecionar('#admin-person-price').value = (configuracaoAluguel.pessoaCentavos / 100).toFixed(2);
  selecionar('#admin-cleaning-price').value = (configuracaoAluguel.limpezaCentavos / 100).toFixed(2);
  selecionar('#admin-extended-exit-percent').value = configuracaoAluguel.saidaEstendidaPercentual.toFixed(2);
  renderizarPrecosEspecificos();
  const lista = selecionar('#admin-blocks');
  lista.replaceChildren();
  function linha(texto, remover) {
    const card = criarElemento('div', undefined, 'panel rental-card');
    const botao = criarElemento('button', 'Liberar período', 'button outline');
    botao.type = 'button';
    botao.addEventListener('click', function () {
      if (!ehAdministrador()) return;
      remover(); renderizarAgendaAdmin(); mostrarAviso('Período liberado.');
    });
    card.append(criarElemento('p', texto), botao);
    lista.append(card);
  }
  bloqueiosAgenda.forEach(function (b) { linha(textoPeriodo(b.inicio, b.fim) + ' · ' + b.motivo, function () { bloqueiosAgenda.splice(bloqueiosAgenda.indexOf(b), 1); }); });
  diasExemplo.forEach(function (dia) { linha(formatarData(dia) + ' · Bloqueio de exemplo', function () { diasExemplo.splice(diasExemplo.indexOf(dia), 1); }); });
  if (!lista.children.length) lista.append(criarElemento('p', 'Nenhum bloqueio manual.'));
  const ocupados = selecionar('#admin-occupied');
  ocupados.replaceChildren();
  const ativos = alugueis.filter(function (a) { return ['pendente', 'aprovada'].includes(a.status) && deslocarDia(a.fim, 1) >= dataISO(hojeAgenda); })
    .sort(function (a, b) { return a.inicio.localeCompare(b.inicio); });
  ativos.forEach(function (a) { ocupados.append(linkAdministrativo(textoPeriodo(a.inicio, a.fim) + ' · Limpeza: ' + formatarData(deslocarDia(a.inicio, -1)) + ' e ' + formatarData(deslocarDia(a.fim, 1)) + ' · ' + textoStatus(a.status) + ' · ' + a.id, '#admin-pedidos/' + a.id)); });
  if (!ativos.length) ocupados.append(criarElemento('p', 'Nenhum período ocupado por solicitações.'));
}
function prepararAdministracao(tela) {
  if (!ehAdministrador()) return;
  document.querySelectorAll('[data-admin-nav]').forEach(function (link) {
    if (link.dataset.adminNav === tela) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (tela === 'admin') renderizarPainelAdmin();
  if (tela === 'admin-pedidos') renderizarPedidosAdmin();
  if (['admin-agenda', 'admin-adicionais', 'admin-disponibilidade'].includes(tela)) {
    renderizarAgendaAdmin();
    exibirMensagem('admin-price-message', '');
    exibirMensagem('admin-block-message', '');
    exibirMensagem('admin-special-message', '');
    ['admin-block-start', 'admin-block-end', 'admin-special-start', 'admin-special-end'].forEach(function (id) {
      selecionar('#' + id).min = dataISO(hojeAgenda);
      selecionar('#' + id).max = dataISO(limiteAgenda);
    });
  }
}
// Adicionais são cobrados uma única vez por aluguel.
selecionar('#admin-fees-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!ehAdministrador()) return;
  const valores = ['admin-person-price', 'admin-cleaning-price'].map(function (id) {
    const texto = selecionar('#' + id).value.trim();
    return texto !== '' && Number(texto) === 0 ? 0 : valorEmCentavos(texto);
  });
  if (valores.some(Number.isNaN)) {
    exibirMensagem('admin-fees-message', 'Informe valores de zero a R$ 1.000.000,00 com até duas casas decimais.');
    return;
  }
  const percentualSaida = Number(selecionar('#admin-extended-exit-percent').value);
  if (!Number.isFinite(percentualSaida) || percentualSaida < 0 || percentualSaida > 1000) {
    exibirMensagem('admin-fees-message', 'Informe uma porcentagem entre 0% e 1.000%.');
    return;
  }
  configuracaoAluguel.pessoaCentavos = valores[0];
  configuracaoAluguel.limpezaCentavos = valores[1];
  configuracaoAluguel.saidaEstendidaPercentual = percentualSaida;
  exibirMensagem('admin-fees-message', 'Adicionais salvos para as próximas solicitações.', true);
});

function prepararPagamento(tela) {
  const aluguel = meuAluguel(location.hash.split('/')[1]);
  if (!aluguel || aluguel.status !== 'aprovada') {
    location.hash = '#perfil/alugueis';
    return false;
  }
  if (tela === 'pagamento' && aluguel.pagamento) {
    location.hash = '#pagamento-resultado/' + aluguel.id;
    return false;
  }
  if (tela === 'pagamento-resultado' && !aluguel.pagamento) {
    location.hash = '#pagamento/' + aluguel.id;
    return false;
  }
  if (tela === 'pagamento') {
    preencherDetalhes('payment-summary', [['Pedido', aluguel.id], ...paresAluguel(aluguel)]);
    selecionar('#payment-back').href = '#aluguel-detalhe/' + aluguel.id;
    selecionar('#payment-method').value = 'pix';
    atualizarMetodoPagamento();
    exibirMensagem('payment-message', '');
  } else {
    preencherDetalhes('payment-receipt', [
      ['Pedido', aluguel.id], ['Valor', formatarValor(aluguel.preco.totalCentavos)],
      ['Forma de pagamento', aluguel.pagamento.metodo], ['Data da simulação', aluguel.pagamento.data]
    ]);
    selecionar('#receipt-back').href = '#aluguel-detalhe/' + aluguel.id;
  }
  return true;
}
function atualizarMetodoPagamento() {
  const pix = selecionar('#payment-method').value === 'pix';
  selecionar('#payment-instructions').textContent = pix
    ? 'No pagamento integrado, o QR Code e o código Pix aparecerão aqui. Nesta demonstração, use o botão abaixo para simular o resultado.'
    : 'No pagamento integrado, os dados do cartão serão preenchidos no ambiente seguro do provedor. Nesta demonstração, use o botão abaixo para simular o resultado.';
}
selecionar('#payment-method').addEventListener('change', atualizarMetodoPagamento);
selecionar('#payment-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const aluguel = meuAluguel(location.hash.split('/')[1]);
  const metodo = selecionar('#payment-method').value;
  if (!aluguel || aluguel.status !== 'aprovada' || aluguel.pagamento || !['pix', 'cartao'].includes(metodo)) return;
  aluguel.pagamento = { metodo: metodo === 'pix' ? 'Pix' : 'Cartão de crédito', data: new Date().toLocaleString('pt-BR') };
  notificarCliente(aluguel, 'Simulação de pagamento concluída.');
  location.hash = '#pagamento-resultado/' + aluguel.id;
});
selecionar('#payment-failure').addEventListener('click', function () {
  exibirMensagem('payment-message', 'Pagamento não concluído na simulação. Confira a forma escolhida e tente novamente.');
});
// Inicializa depois que todas as variáveis e eventos estão prontos.
mostrarTela(false);
atualizarConta();
