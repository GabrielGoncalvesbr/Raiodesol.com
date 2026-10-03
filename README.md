# Sítio Raio de Sol — projeto acadêmico

Site desenvolvido com **HTML, CSS e JavaScript básico**, sem frameworks, servidor ou banco de dados.

## Acessar o site

**[☀️ Clique aqui para abrir o Sítio Raio de Sol](https://gabrielgoncalvesbr.github.io/Raiodesol.com/)**

O site abre diretamente no navegador, sem baixar arquivos ou instalar programas.

> Publicação no GitHub Pages em configuração. O link ficará disponível após a ativação.

## Como abrir

[Clique aqui!](https://gabrielgoncalvesbr.github.io/Raiodesol.com/)

Abra `index.html` com dois cliques no navegador. Mantenha `style.css`, `script.js` e a pasta `assets` junto ao HTML. Não precisa instalar Node.js ou executar comandos.

## Organização

- `index.html`: estrutura e conteúdo das quatro telas (início, cadastro, conhecer o sítio e login).
- `style.css`: cores, fontes, tamanhos, posicionamento e layout para celular e computador.
- `script.js`: troca de telas, menu, máscaras, validação e simulação do cadastro e login. O código está dividido em blocos comentados em português.
- `assets/`: fotografias do sítio.

As quatro telas são seções do mesmo HTML. O JavaScript mostra a seção selecionada e oculta as outras.

## Cadastro e login de demonstração

O formulário solicita nome, telefone com DDD, e-mail, CPF, nascimento e senha. Valida CPF, idade mínima de 18 anos pela data do computador e senha com no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um caractere especial. O limite da senha é de 30 caracteres.

Os cadastros ficam em um array JavaScript na memória da página. O login compara o e-mail e a senha digitados com esse array. Não há banco de dados, cookies, localStorage ou chamadas de API.

**Use dados fictícios e uma senha de teste.** Esta é uma simulação para apresentação acadêmica, não autenticação para uso real. Recarregar ou fechar a página apaga todos os cadastros. Para demonstrar:

1. Abra `index.html` e clique em **Criar conta**.
2. Preencha o formulário com dados fictícios válidos.
3. Após cadastrar, use o mesmo e-mail e senha na tela de login, sem recarregar a página.
4. Confira a saudação no menu e clique em **Sair**.

É possível navegar e sair/entrar novamente sem perder os cadastros, desde que a página não seja recarregada.

## Fotos e localização

A página do sítio apresenta as cinco fotos fornecidas, informações sobre o espaço, mapa da localização enviada e links do Facebook e Instagram. O mapa e as redes sociais precisam de internet; os demais recursos funcionam localmente.

Criação e desenvolvimento do site pelo grupo da faculdade.
