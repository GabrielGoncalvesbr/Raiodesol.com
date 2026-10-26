# Sítio Raio de Sol — projeto acadêmico

Site em desenvolvimento com **HTML, CSS e JavaScript básico**, sem frameworks, servidor ou banco de dados.

## Acessar o site

**[ Clique aqui para abrir o Sítio Raio de Sol](https://gabrielgoncalvesbr.github.io/Raiodesol.com/)**

## Organização

- `index.html`: estrutura de todas as telas, incluindo as novas telas da sprint 2.
- `style.css`: cores, fontes, tamanhos, posicionamento e layout para celular e computador.
- `script.js`: troca de telas, menu, máscaras, validação e simulação do cadastro e login. O código está dividido em blocos comentados em português.
- `sprint2.js`: recuperação de senha, perfil, calendário e fluxo de aluguel, com comentários em português.
- `sprint2.css`: aparência das telas da sprint 2 e adaptação ao celular.
- `assets/`: fotografias do sítio.

As telas são seções do mesmo HTML. O JavaScript mostra a seção selecionada e oculta as outras. Abra `index.html` diretamente, mantendo os arquivos CSS e JavaScript e a pasta `assets` juntos. Não precisa instalar nada.

## Sprint 2

- **Recuperar senha:** na tela de login, informe um e-mail cadastrado, confira o código de seis dígitos e defina a nova senha. O código demonstrativo aparece na tela: nenhum e-mail é enviado. Expira em cinco minutos, permite cinco tentativas e só pode ser usado uma vez. Gerar outro código invalida o anterior.
- **Meu perfil:** o cliente altera nome, telefone, nascimento e senha. CPF e e-mail são somente leitura e não são atualizados pelo formulário. A troca de senha exige a senha atual.
- **Disponibilidade:** calendário mensal para os próximos 12 meses, com dias passados e ocupados desabilitados. Os dias ocupados de exemplo são fictícios, não a agenda real do sítio.
- **Alugar:** selecionar primeiro e último dia → entrar ou cadastrar → preencher contato, pessoas e tipo de encontro → revisar → enviar → ver protocolo e status.
- **Meus aluguéis:** histórico exclusivo da conta conectada, filtro de status, detalhes e cancelamento com confirmação. O cancelamento libera as datas nesta demonstração.

O aluguel é **por dia**, incluindo o primeiro e o último dia (selecionar a mesma data representa um dia). Períodos que atravessam um dia ocupado não são aceitos. Solicitações pendentes bloqueiam as datas dentro da demonstração para impedir sobreposição.

O **valor é definido pelo administrador antes da solicitação** e a **aprovação da reserva é obrigatória**. O cliente vê a diária e o total ao selecionar as datas e na revisão, antes de enviar. O pedido guarda esses valores, mesmo que a diária seja alterada posteriormente. Nesta demonstração, usamos uma diária fictícia de R$ 500,00, configurada em `configuracaoAluguel.diariaCentavos` no arquivo `sprint2.js` (50000 centavos). Esse não é o preço real do sítio. A futura área administrativa editará essa configuração. Os pedidos ficam “Aguardando aprovação”; não há cobrança, pagamento ou confirmação automática. A quantidade de pessoas é informada para análise; a capacidade máxima do sítio ainda precisa ser definida.

Use dados fictícios: contas e pedidos ficam na memória da página e se apagam ao recarregar.

O painel administrativo e o envio real de e-mail precisam de uma próxima etapa com serviços apropriados. Os pedidos desta versão não são enviados ao responsável pelo sítio.

## Roteiro para apresentação

1. Crie um cadastro fictício e entre. Abra o perfil, edite seus dados e confira que CPF e e-mail estão bloqueados.
2. Saia, acesse “Esqueci minha senha”, use o código mostrado e troque a senha. Entre com a nova senha.
3. Abra “Alugar o sítio”, selecione um intervalo livre e preencha os detalhes.
4. Revise e envie. Confira o protocolo e o status pendente em “Meus aluguéis”.
5. Abra os detalhes e cancele. Confira a mudança no histórico e a liberação das datas.
6. Uma segunda conta criada na mesma página não vê os pedidos da primeira.

