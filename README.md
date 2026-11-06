# Sítio Raio de Sol — projeto acadêmico

Site em desenvolvimento com **HTML, CSS e JavaScript básico**, sem frameworks, servidor ou banco de dados.

## Acessar o site

**[ Clique aqui para abrir o Sítio Raio de Sol](https://gabrielgoncalvesbr.github.io/Raiodesol.com/)**

## Conta de demonstração

Para testar sem fazer cadastro, entre com **clienteteste@gmail.com** e senha **Teste12@**.
Essa conta fictícia é recriada a cada carregamento. Alterações no perfil ou na senha e pedidos de aluguel não são salvos ao recarregar. Não use essa conta para dados reais.

## Arquivos

- `index.html`: estrutura de todas as telas, incluindo as novas telas da sprint 2.
- `style.css`: cores, fontes, tamanhos, posicionamento e layout para celular e computador.
- `script.js`: toda a lógica do site: navegação, cadastro, login, recuperação de senha, perfil, calendário e aluguéis. O código está dividido em blocos comentados em português.
- `assets/`: fotografias do sítio.

As telas são seções do mesmo HTML. O JavaScript mostra a seção selecionada e oculta as outras. Abra `index.html` diretamente, mantendo os arquivos CSS e JavaScript e a pasta `assets` juntos. Não precisa instalar nada.

## Sprint 2

- **Recuperar senha:** na tela de login, informe um e-mail cadastrado, confira o código de seis dígitos e defina a nova senha. O código demonstrativo aparece na tela: nenhum e-mail é enviado. Expira em cinco minutos, permite cinco tentativas e só pode ser usado uma vez. Gerar outro código invalida o anterior.
- **Meu perfil:** o cliente altera nome, telefone, nascimento e senha. CPF e e-mail são somente leitura e não são atualizados pelo formulário. A troca de senha exige a senha atual.
- **Disponibilidade:** calendário mensal para os próximos 12 meses, com dias passados e ocupados desabilitados. Os dias ocupados de exemplo são fictícios, não a agenda real do sítio.
- **Alugar:** selecionar primeiro e último dia → entrar ou cadastrar → preencher contato, pessoas e tipo de encontro → revisar → enviar → ver protocolo e status.
- **Meus aluguéis:** aba dentro de **Meu perfil**, ao lado de **Meus dados**, sem atalho no menu superior. Histórico exclusivo da conta conectada, filtro de status, detalhes e cancelamento com confirmação. O cancelamento libera as datas nesta demonstração.

O aluguel é **por dia**, incluindo o primeiro e o último dia (selecionar a mesma data representa um dia). Períodos que atravessam um dia ocupado não são aceitos. Solicitações pendentes bloqueiam as datas dentro da demonstração para impedir sobreposição.

O **valor é definido pelo administrador antes da solicitação** e a **aprovação da reserva é obrigatória**. O cliente vê a diária e o total ao selecionar as datas e na revisão, antes de enviar. O pedido guarda esses valores, mesmo que a diária seja alterada posteriormente. Nesta demonstração, usamos uma diária fictícia de R$ 500,00, configurada em `configuracaoAluguel.diariaCentavos` no arquivo `script.js` (50000 centavos). Esse não é o preço real do sítio. A área administrativa já permite editar essa diária e aprovar ou recusar os pedidos. Novos pedidos ficam “Aguardando aprovação”; não há cobrança, pagamento ou confirmação automática. A quantidade de pessoas é informada para análise; a capacidade máxima do sítio ainda precisa ser definida.

Use dados fictícios: contas e pedidos ficam na memória da página e se apagam ao recarregar.

O envio real de e-mail e a persistência dos dados precisam de uma próxima etapa com serviços apropriados. Os pedidos desta versão não são enviados ao responsável pelo sítio.

## Roteiro para apresentação

1. Crie um cadastro fictício e entre. Abra o perfil, edite seus dados e confira que CPF e e-mail estão bloqueados.
2. Saia, acesse “Esqueci minha senha”, use o código mostrado e troque a senha. Entre com a nova senha.
3. Abra “Alugar o sítio”, selecione um intervalo livre e preencha os detalhes.
4. Revise e envie. Confira o protocolo e o status pendente em “Meus aluguéis”.
5. Abra os detalhes e cancele. Confira a mudança no histórico e a liberação das datas.
6. Uma segunda conta criada na mesma página não vê os pedidos da primeira.

## Administração de demonstração

Entre com **adminteste@example.com** e senha **Admin12@** pelo mesmo formulário de login.

- **Visão geral:** pedidos pendentes, reservas aprovadas, diária vigente e próximos aluguéis.
- **Solicitações:** detalhes do pedido, filtros e aprovação ou recusa. A recusa exige motivo e libera o período. A decisão é definitiva nesta demonstração.
- **Agenda e preços:** diária única em reais para novas seleções, bloqueio de períodos livres e liberação dos bloqueios. Pedidos pendentes ou aprovados não podem ser sobrepostos.
- **Perfil do cliente:** a aba Notificações mostra aprovações, recusas e cancelamentos; os detalhes mostram o motivo e conservam o preço registrado.

Para apresentar: entre como administrador e ajuste a diária; saia e entre como cliente, solicite um período; saia e entre como administrador, analise o pedido; volte ao cliente e abra **Meu perfil → Notificações**. Faça tudo na mesma aba, sem atualizar a página. Não há servidor, banco de dados ou autenticação real; as duas contas são fictícias e os dados reiniciam ao recarregar.

Os testes opcionais de desenvolvimento podem ser executados com `node tests/sprint2.test.cjs`. Não é necessário instalar Node.js para abrir o site pelo `index.html`.
