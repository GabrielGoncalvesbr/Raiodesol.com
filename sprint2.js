// SPRINT 2 — Tudo funciona na memória do navegador, sem servidor.
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
function mensagemSprint(id, texto, sucesso = false) {
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
  mensagemSprint('recovery-message', '');
  etapaRecuperacao(2);
  selecionar('#recovery-code').focus();
}
selecionar('#recovery-email-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const email = selecionar('#recovery-email').value.trim().toLowerCase();
  const usuario = usuarios.find(function (pessoa) { return pessoa.email === email; });
  if (!usuario) {
    limparRecuperacao();
    mensagemSprint('recovery-message', 'Não encontramos este e-mail nesta demonstração. Crie seu cadastro e tente novamente sem recarregar a página.');
    return;
  }
  gerarCodigo(usuario);
});
selecionar('#recovery-code-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!recuperacao) return;
  if (Date.now() >= recuperacao.validade) {
    mensagemSprint('recovery-message', 'Este código expirou. Gere outro código.');
    return;
  }
  if (recuperacao.tentativas >= 5) {
    mensagemSprint('recovery-message', 'Você atingiu 5 tentativas. Gere outro código.');
    return;
  }
  recuperacao.tentativas++;
  if (selecionar('#recovery-code').value !== recuperacao.codigo) {
    mensagemSprint('recovery-message', 'Código incorreto. Restam ' + (5 - recuperacao.tentativas) + ' tentativas.');
    return;
  }
  recuperacao.verificado = true;
  selecionar('#demo-code').textContent = '';
  etapaRecuperacao(3);
  mensagemSprint('recovery-message', '');
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
    mensagemSprint('recovery-message', 'A verificação expirou. Informe seu e-mail para gerar outro código.');
    return;
  }
  const senha = selecionar('#recovery-password').value;
  if (!senhaValida(senha)) {
    mensagemSprint('recovery-message', 'Use de 8 a 30 caracteres, uma maiúscula, uma minúscula e um caractere especial.');
    return;
  }
  if (senha !== selecionar('#recovery-confirm').value) {
    mensagemSprint('recovery-message', 'As senhas não coincidem.');
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
    mensagemSprint('profile-message', Object.values(erros).join(' '));
    return;
  }
  usuarioLogado.nome = atualizado.nome;
  usuarioLogado.telefone = atualizado.telefone;
  usuarioLogado.nascimento = atualizado.nascimento;
  preencherPerfil();
  atualizarConta();
  mensagemSprint('profile-message', 'Dados atualizados com sucesso.', true);
});
selecionar('#profile-password-form').addEventListener('submit', function (evento) {
  evento.preventDefault();
  if (!usuarioLogado) { location.hash = '#login'; return; }
  if (selecionar('#profile-current-password').value !== usuarioLogado.senha) {
    mensagemSprint('profile-password-message', 'A senha atual está incorreta.');
    return;
  }
  const senha = selecionar('#profile-new-password').value;
  if (!senhaValida(senha)) {
    mensagemSprint('profile-password-message', 'Use de 8 a 30 caracteres, uma maiúscula, uma minúscula e um caractere especial.');
    return;
  }
  if (senha !== selecionar('#profile-confirm-password').value) {
    mensagemSprint('profile-password-message', 'As senhas não coincidem.');
    return;
  }
  usuarioLogado.senha = senha;
  recuperacao = null;
  this.reset();
  mensagemSprint('profile-password-message', 'Senha atualizada com sucesso.', true);
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
  if (erro) { mensagemSprint('dates-message', erro); return; }
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
    mensagemSprint('rental-message', 'Informe um telefone válido com DDD.');
    return;
  }
  if (!Number.isSafeInteger(pessoas) || pessoas < 1) {
    mensagemSprint('rental-message', 'Informe uma quantidade inteira de pessoas, a partir de 1.');
    return;
  }
  const erro = erroPeriodo(rascunhoAluguel.inicio, rascunhoAluguel.fim);
  if (erro) { mensagemSprint('rental-message', erro); return; }
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
  if (erro) { mensagemSprint('review-message', erro); return; }
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
function limparSessaoSprint2() {
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
function prepararTelaSprint2(tela) {
  if (tela !== 'recuperar') limparRecuperacao();
  if (tela !== 'perfil') selecionar('#profile-password-form').reset();
  selecionar('#cancel-dialog').close();
  if (tela === 'perfil' && usuarioLogado) {
    preencherPerfil();
    mensagemSprint('profile-message', '');
    mensagemSprint('profile-password-message', '');
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
      mensagemSprint('rental-message', '');
    } else {
      if (!rascunhoAluguel.detalhes || rascunhoAluguel.detalhes.email !== usuarioLogado.email) {
        location.hash = '#aluguel-dados';
        return false;
      }
      preencherDetalhes('review-details', paresAluguel(rascunhoAluguel));
      mensagemSprint('review-message', '');
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
