// Projeto acadêmico: cadastros em memória, apagados ao recarregar a página.
const usuarios = [];
let usuarioLogado = null;
let tempoAviso;

function selecionar(seletor) {
  return document.querySelector(seletor);
}

// NAVEGAÇÃO ENTRE AS QUATRO TELAS
function fecharMenu() {
  selecionar('#navigation').classList.remove('open');
  selecionar('.menu-button').setAttribute('aria-expanded', 'false');
}

function mostrarTela(moverFoco = true) {
  const telas = ['inicio', 'cadastro', 'sitio', 'login'];
  let tela = location.hash.replace('#', '') || 'inicio';
  if (tela === 'conteudo') {
    selecionar('#conteudo').focus();
    return;
  }
  if (!telas.includes(tela)) tela = 'inicio';
  document.querySelectorAll('[data-view]').forEach(function (secao) {
    secao.hidden = secao.dataset.view !== tela;
  });
  document.querySelectorAll('[data-nav]').forEach(function (link) {
    if (link.dataset.nav === tela) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titulos = { inicio: 'Início', cadastro: 'Criar conta', sitio: 'Conhecer o sítio', login: 'Entrar' };
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
  location.hash = '#inicio';
  mostrarAviso('Bem-vindo, ' + encontrado.nome.split(' ')[0] + '! Login de demonstração realizado.');
});
selecionar('#logout').addEventListener('click', function () {
  usuarioLogado = null;
  atualizarConta();
  location.hash = '#inicio';
  mostrarTela();
  mostrarAviso('Você saiu da conta. Até logo!');
});

// Funciona inclusive ao abrir index.html com dois cliques.
mostrarTela(false);
atualizarConta();
