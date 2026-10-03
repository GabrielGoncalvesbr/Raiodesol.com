# Sítio Raio de Sol — projeto acadêmico

Site desenvolvido com **HTML, CSS e JavaScript básico**, sem frameworks, servidor ou banco de dados.

## Acessar o site

**[ Clique aqui para abrir o Sítio Raio de Sol](https://gabrielgoncalvesbr.github.io/Raiodesol.com/)**

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

Criação e desenvolvimento do site pelo grupo da faculdade.
