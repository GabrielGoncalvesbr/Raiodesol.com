// Testes de desenvolvimento, opcionais. Não são necessários para abrir o site.
// Execute com Node.js: node tests/sprint2.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

function ambiente() {
  const elementos = new Map();
  function elemento() {
    return {
      value: '', textContent: '', hidden: false, checked: false, dataset: {},
      children: [], handlers: {}, attributes: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute(chave, valor) { this.attributes[chave] = valor; },
      removeAttribute(chave) { delete this.attributes[chave]; },
      addEventListener(tipo, acao) { this.handlers[tipo] = acao; },
      append(...filhos) { this.children.push(...filhos); },
      replaceChildren() { this.children = []; },
      focus() {}, reset() {}, close() {}, showModal() {}
    };
  }
  function obter(id) {
    if (!elementos.has(id)) elementos.set(id, elemento());
    return elementos.get(id);
  }
  const contexto = vm.createContext({
    document: { querySelector: obter, querySelectorAll: () => [], getElementById: id => obter('#' + id), createElement: elemento, addEventListener() {} },
    window: { addEventListener() {}, scrollTo() {} },
    location: { hash: '#inicio' }, crypto: webcrypto, setTimeout: () => 1, clearTimeout() {}
  });
  for (const arquivo of ['script.js', 'sprint2.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8'), contexto);
  }
  function executar(codigo) { return vm.runInContext(codigo, contexto); }
  function acionar(id, tipo = 'submit') {
    const alvo = obter('#' + id);
    alvo.handlers[tipo].call(alvo, { preventDefault() {} });
  }
  executar(`usuarios.unshift(
    {nome:'Cliente Um',email:'um@example.com',cpf:'52998224725',telefone:'11987654321',nascimento:'1990-01-01',senha:'Inicial!1'},
    {nome:'Cliente Dois',email:'dois@example.com',cpf:'11144477735',telefone:'11987654322',nascimento:'1991-01-01',senha:'Inicial!2'}
  );`);
  return { obter, executar, acionar, contexto };
}

test('conta demonstrativa permite login e volta aos dados iniciais ao reabrir', () => {
  const a = ambiente();
  a.obter('#login-email').value = 'clienteteste@gmail.com';
  a.obter('#login-password').value = 'Teste12@';
  a.acionar('login-form');
  assert.equal(a.executar('usuarioLogado.email'), 'clienteteste@gmail.com');
  a.executar("usuarioLogado.senha = 'Alterada!1';");
  const b = ambiente();
  b.obter('#login-email').value = 'clienteteste@gmail.com';
  b.obter('#login-password').value = 'Teste12@';
  b.acionar('login-form');
  assert.equal(b.executar('usuarioLogado.nome'), 'Cliente Teste');
});

test('recuperação rejeita código incorreto/expirado, limita tentativas e altera só a conta verificada', () => {
  const a = ambiente();
  a.obter('#recovery-email').value = 'ausente@example.com';
  a.acionar('recovery-email-form');
  assert.equal(a.executar('recuperacao'), null);
  a.obter('#recovery-email').value = 'UM@example.com';
  a.acionar('recovery-email-form');
  const codigo = a.executar('recuperacao.codigo');
  a.obter('#recovery-code').value = codigo === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) a.acionar('recovery-code-form');
  a.obter('#recovery-code').value = codigo;
  a.acionar('recovery-code-form');
  assert.equal(a.executar('recuperacao.verificado'), false);
  a.acionar('resend-code', 'click');
  a.executar('recuperacao.validade = Date.now() - 1');
  a.obter('#recovery-code').value = a.executar('recuperacao.codigo');
  a.acionar('recovery-code-form');
  assert.equal(a.executar('recuperacao.verificado'), false);
  a.acionar('resend-code', 'click');
  a.obter('#recovery-code').value = a.executar('recuperacao.codigo');
  a.acionar('recovery-code-form');
  assert.equal(a.executar('recuperacao.verificado'), true);
  a.obter('#recovery-password').value = 'NovaSenha!1';
  a.obter('#recovery-confirm').value = 'Diferente!1';
  a.acionar('recovery-password-form');
  assert.equal(a.executar('usuarios[0].senha'), 'Inicial!1');
  a.obter('#recovery-confirm').value = 'NovaSenha!1';
  a.acionar('recovery-password-form');
  assert.equal(a.executar('usuarios[0].senha'), 'NovaSenha!1');
  assert.equal(a.executar('usuarios[1].senha'), 'Inicial!2');
  assert.equal(a.executar('recuperacao'), null);
  a.obter('#recovery-password').value = 'OutraSenha!1';
  a.obter('#recovery-confirm').value = 'OutraSenha!1';
  a.acionar('recovery-password-form');
  assert.equal(a.executar('usuarios[0].senha'), 'NovaSenha!1');
});

test('perfil preserva CPF/e-mail, valida idade e exige senha atual para alterá-la', () => {
  const a = ambiente();
  a.executar('usuarioLogado = usuarios[0]; preencherPerfil();');
  a.obter('#profile-name').value = 'Nome Atualizado';
  a.obter('#profile-phone').value = '(11) 98888-7777';
  a.obter('#profile-email').value = 'adulterado@example.com';
  a.obter('#profile-cpf').value = '11144477735';
  a.obter('#profile-birth').value = '2020-01-01';
  a.acionar('profile-form');
  assert.equal(a.executar('usuarioLogado.nome'), 'Cliente Um');
  a.obter('#profile-birth').value = '1990-01-01';
  a.acionar('profile-form');
  assert.equal(a.executar('usuarioLogado.nome'), 'Nome Atualizado');
  assert.equal(a.executar('usuarioLogado.email'), 'um@example.com');
  assert.equal(a.executar('usuarioLogado.cpf'), '52998224725');
  a.obter('#profile-current-password').value = 'Errada!';
  a.obter('#profile-new-password').value = 'NovaSenha!1';
  a.obter('#profile-confirm-password').value = 'NovaSenha!1';
  a.acionar('profile-password-form');
  assert.equal(a.executar('usuarioLogado.senha'), 'Inicial!1');
  a.obter('#profile-current-password').value = 'Inicial!1';
  a.acionar('profile-password-form');
  assert.equal(a.executar('usuarioLogado.senha'), 'NovaSenha!1');
});

test('agenda conta dias inclusivos e rejeita datas inválidas, passadas, invertidas e sobrepostas', () => {
  const a = ambiente();
  assert.equal(a.executar("quantidadeDias('2026-12-31','2027-01-02')"), 3);
  assert.equal(a.executar("quantidadeDias('2028-02-29','2028-02-29')"), 1);
  assert.equal(a.executar("lerData('2026-02-30')"), null);
  assert.ok(a.executar("erroPeriodo('2000-01-01','2000-01-02')"));
  assert.ok(a.executar("erroPeriodo('2099-01-01','2099-01-02')"));
  assert.ok(a.executar("erroPeriodo('2028-01-03','2028-01-02')"));
  assert.ok(a.executar('erroPeriodo(diasExemplo[0],diasExemplo[1])'));
  const cruzado = a.executar(`(() => {
    const inicio = lerData(diasExemplo[0]); inicio.setDate(inicio.getDate() - 1);
    const fim = lerData(diasExemplo[1]); fim.setDate(fim.getDate() + 1);
    return erroPeriodo(dataISO(inicio),dataISO(fim));
  })()`);
  assert.ok(cruzado);
});

test('pedido nasce pendente, não duplica, isola clientes e libera datas ao cancelar', () => {
  const a = ambiente();
  a.executar(`usuarioLogado = usuarios[0];
    const diaTeste = new Date(hojeAgenda); diaTeste.setDate(diaTeste.getDate()+1);
    while (diaOcupado(dataISO(diaTeste))) diaTeste.setDate(diaTeste.getDate()+1);
    rascunhoAluguel = {inicio:dataISO(diaTeste),fim:dataISO(diaTeste),preco:calcularPreco(dataISO(diaTeste),dataISO(diaTeste)),detalhes:{
      nome:usuarioLogado.nome,email:usuarioLogado.email,telefone:usuarioLogado.telefone,
      pessoas:10,tipo:'Encontro em família',observacoes:'Teste'
    }};`);
  a.obter('#rental-acknowledgement').checked = true;
  a.acionar('review-form');
  a.acionar('review-form');
  assert.equal(a.executar('alugueis.length'), 1);
  assert.equal(a.executar('alugueis[0].status'), 'pendente');
  a.executar('configuracaoAluguel.diariaCentavos = 70000;');
  assert.equal(a.executar('alugueis[0].preco.diariaCentavos'), 50000);
  assert.equal(a.executar('alugueis[0].preco.totalCentavos'), 50000);
  assert.ok(a.executar('erroPeriodo(alugueis[0].inicio,alugueis[0].fim)'));
  a.executar('usuarioLogado = usuarios[1];');
  assert.equal(a.executar('meusAlugueis().length'), 0);
  assert.equal(a.executar("meuAluguel('RS-0001')"), undefined);
  a.executar("cancelamentoSelecionado = 'RS-0001';");
  a.acionar('confirm-cancellation', 'click');
  assert.equal(a.executar('alugueis[0].status'), 'pendente');
  a.executar("usuarioLogado = usuarios[0]; cancelamentoSelecionado = 'RS-0001';");
  a.acionar('confirm-cancellation', 'click');
  assert.equal(a.executar('alugueis[0].status'), 'cancelada');
  assert.equal(a.executar('erroPeriodo(alugueis[0].inicio,alugueis[0].fim)'), '');
});

test('preço aparece antes do envio e calcula o total incluindo os dois dias limites', () => {
  const a = ambiente();
  assert.equal(a.executar("calcularPreco('2026-12-31','2027-01-02').totalCentavos"), 150000);
  const hoje = a.executar('dataISO(hojeAgenda)');
  a.obter('#rental-start').value = hoje;
  a.obter('#rental-end').value = hoje;
  a.executar('atualizarSelecao();');
  assert.match(a.obter('#dates-price').textContent, /Total:/);
  a.acionar('dates-form');
  assert.equal(a.executar('rascunhoAluguel.preco.totalCentavos'), 50000);
  a.executar('configuracaoAluguel.diariaCentavos = 60000;');
  assert.equal(a.executar('rascunhoAluguel.preco.totalCentavos'), 50000);
  assert.equal(a.executar("calcularPreco('2026-12-31','2027-01-02').totalCentavos"), 180000);
});

test('rotas privadas exigem login e revisão exige seleção prévia', () => {
  const a = ambiente();
  a.executar("location.hash = '#perfil'; mostrarTela();");
  assert.equal(a.contexto.location.hash, '#login');
  a.executar("usuarioLogado=usuarios[0]; location.hash='#aluguel-revisao'; mostrarTela();");
  assert.equal(a.contexto.location.hash, '#disponibilidade');
  for (const tamanho of [7,8,30,31]) {
    assert.equal(a.executar("senhaValida('Aa!' + 'x'.repeat(" + (tamanho - 3) + "))"), tamanho >= 8 && tamanho <= 30);
  }
});
