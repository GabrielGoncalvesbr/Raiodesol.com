// Projeto acadêmico: alterações ficam na memória da página.
// Esta conta fictícia é recriada com os dados abaixo a cada carregamento.
const usuarios = [{
  nome: 'Cliente Teste',
  email: 'clienteteste@gmail.com',
  senha: 'Teste12@',
  cpf: '52998224725',
  telefone: '11999999999',
  nascimento: '2000-01-01'
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
  const telas = ['inicio', 'cadastro', 'sitio', 'login', 'recuperar', 'perfil', 'historico', 'disponibilidade', 'aluguel-dados', 'aluguel-revisao', 'aluguel-confirmacao', 'aluguel-detalhe'];
  let tela = location.hash.replace('#', '').split('/')[0] || 'inicio';
  if (tela === 'conteudo') {
    selecionar('#conteudo').focus();
    return;
  }
  if (!telas.includes(tela)) tela = 'inicio';
  const protegidas = ['perfil', 'historico', 'aluguel-dados', 'aluguel-revisao', 'aluguel-confirmacao', 'aluguel-detalhe'];
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
  const titulos = { inicio: 'Início', cadastro: 'Criar conta', sitio: 'Conhecer o sítio', login: 'Entrar', recuperar: 'Recuperar senha', perfil: 'Meu perfil', historico: 'Meus aluguéis', disponibilidade: 'Disponibilidade', 'aluguel-dados': 'Detalhes do aluguel', 'aluguel-revisao': 'Revisar solicitação', 'aluguel-confirmacao': 'Solicitação enviada', 'aluguel-detalhe': 'Detalhes da solicitação' };
  document.title = titulos[tela] + ' · Sítio Raio de Sol';
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
  location.hash = '#' + retornoLogin;
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
// Futuramente esta configuração virá da área administrativa.
const configuracaoAluguel = { diariaCentavos: 50000 };
function formatarValor(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function calcularPreco(inicio, fim) {
  return {
    diariaCentavos: configuracaoAluguel.diariaCentavos,
    totalCentavos: configuracaoAluguel.diariaCentavos * quantidadeDias(inicio, fim)
  };
}
function textoPreco(preco) {
  return formatarValor(preco.diariaCentavos) + ' por dia · Total: ' + formatarValor(preco.totalCentavos);
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
function diaOcupado(dia) {
  return diasExemplo.includes(dia) || alugueis.some(function (aluguel) {
    return aluguel.status !== 'cancelada' && dia >= aluguel.inicio && dia <= aluguel.fim;
  });
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
    : formatarValor(configuracaoAluguel.diariaCentavos) + ' por dia';
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
    botao.setAttribute('aria-pressed', String(Boolean(selecionado)));
    botao.setAttribute('aria-label', formatarData(dia) + (passado ? ', data passada' : ocupado ? ', indisponível' : ', disponível'));
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
  selecionar('#rental-purpose').value = detalhes ? detalhes.tipo : '';
  selecionar('#rental-notes').value = detalhes ? detalhes.observacoes : '';
  selecionar('#rental-period').textContent = textoPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  selecionar('#rental-price').textContent = textoPreco(rascunhoAluguel.preco);
}
selecionar('#rental-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado || !rascunhoAluguel) { location.hash = '#disponibilidade'; return; }
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
  const erro = erroPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  if (erro) { exibirMensagem('rental-message', erro); return; }
  rascunhoAluguel.detalhes = {
    nome: usuarioLogado.nome, email: usuarioLogado.email, telefone: telefone,
    pessoas: pessoas, tipo: selecionar('#rental-purpose').value,
    observacoes: selecionar('#rental-notes').value.trim()
  };
  selecionar('#rental-acknowledgement').checked = false;
  location.hash = '#aluguel-revisao';
});
function paresAluguel(aluguel) {
  return [
    ['Período', textoPeriodo(aluguel.inicio, aluguel.fim)],
    ['Modalidade', 'Aluguel por dia'],
    ['Diária', formatarValor(aluguel.preco.diariaCentavos)],
    ['Total do período', formatarValor(aluguel.preco.totalCentavos)],
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
  return status === 'cancelada' ? 'Cancelada' : 'Aguardando aprovação';
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
  selecionar('#cancel-rental').hidden = aluguel.status !== 'pendente';
  selecionar('#detail-message').textContent = aluguel.status === 'cancelada'
    ? 'Esta solicitação foi cancelada. Você pode escolher novas datas e criar outro pedido.'
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
  if (tela !== 'recuperar') limparRecuperacao();
  if (tela !== 'perfil') selecionar('#profile-password-form').reset();
  selecionar('#cancel-dialog').close();
  if (tela === 'perfil' && usuarioLogado) {
    preencherPerfil();
    exibirMensagem('profile-message', '');
    exibirMensagem('profile-password-message', '');
  }
  if (tela === 'historico') renderizarHistorico();
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
    if (!aluguel) { location.hash = '#historico'; return false; }
    preencherDetalhes('confirmation-details', [['Protocolo', aluguel.id], ['Período', textoPeriodo(aluguel.inicio, aluguel.fim)], ['Status', textoStatus(aluguel.status)], ['Total do período', formatarValor(aluguel.preco.totalCentavos)]]);
    selecionar('#confirmation-link').href = '#aluguel-detalhe/' + aluguel.id;
  }
  if (tela === 'aluguel-detalhe') {
    const aluguel = meuAluguel(location.hash.split('/')[1]);
    if (!aluguel) { location.hash = '#historico'; mostrarAviso('Solicitação não encontrada nesta conta.'); return false; }
    renderizarDetalhe(aluguel);
  }
  return true;
}
mostrarTela(false);
atualizarConta();
