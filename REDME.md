# 📚 Minha Biblioteca

Gerenciador de leituras para organizar os livros que você quer ler, está lendo e já leu. Projeto do desafio prático da fase 2 da Pós-Dev da Rocketseat, feito com HTML, CSS e JavaScript puros, sem frameworks.

## ✨ Funcionalidades

- Adicionar, editar e excluir livros
- Status de leitura: **Quero ler**, **Lendo** e **Lido**
- Avaliação de 1 a 5 estrelas
- Comentário pessoal para cada livro
- Capa do livro por URL (com ícone padrão quando não há capa)
- Busca por título ou autor
- Filtro por status
- Estatísticas: total de livros e quantidade em cada status
- Preenchimento automático de título, autor e capa a partir de um **link da Amazon**, **ISBN** ou **título**
- Dados salvos no navegador (`localStorage`), sem necessidade de servidor
- Layout responsivo

## 🛠️ Tecnologias

- HTML5 (incluindo o elemento `<dialog>` para o modal)
- CSS3 (variáveis, Grid e Flexbox)
- JavaScript (ES6+)
- [Google Books API](https://developers.google.com/books) e [Open Library API](https://openlibrary.org/developers/api) para o preenchimento automático

## 🚀 Como executar

Não há dependências para instalar.

1. Clone o repositório:

   ```bash
   git clone https://github.com/SEU-USUARIO/minha-biblioteca.git
   ```

2. Entre na pasta:

   ```bash
   cd minha-biblioteca
   ```

3. Abra o `index.html` no navegador. Se preferir, use a extensão **Live Server** do VS Code (clique com o botão direito no `index.html` → *Open with Live Server*).

## 🔎 Como funciona o preenchimento automático

No modal de **Adicionar livro**, cole no campo de busca um destes itens e clique em **Buscar**:

| Entrada | O que acontece |
| --- | --- |
| Link da Amazon | Extrai o ISBN do link (`/dp/...`) e, se não achar, usa o título que aparece na URL |
| ISBN (10 ou 13 dígitos) | Busca direto pelo ISBN |
| Título | Busca pelo nome do livro |

A busca é feita primeiro no Google Books e, se necessário, no Open Library.

**Observações:**

- A Amazon **não** é acessada diretamente. O navegador bloqueia esse tipo de requisição e raspar o site vai contra os termos de uso dela. Por isso o link serve apenas como fonte do ISBN e do título.
- Links encurtados (`amzn.to/...`) não funcionam. Use o link completo.
- Em edições recentes ou pouco conhecidas, o resultado pode ser outra edição da mesma obra. Confira título, autor e capa antes de salvar. Todos os campos continuam editáveis.

### Chave da Google Books API (opcional)

Sem chave, o Google Books pode limitar o número de consultas. Se isso acontecer, crie uma chave gratuita no [Google Cloud Console](https://console.cloud.google.com/) (ative a *Books API*) e preencha a constante no início do bloco de busca do `script.js`:

```js
const GOOGLE_BOOKS_KEY = 'SUA_CHAVE_AQUI';
```

> ⚠️ Como o projeto roda inteiramente no navegador, a chave fica visível no código. Restrinja-a por **referenciador HTTP** no Google Cloud e não use uma chave sem restrições em repositório público.

## 📁 Estrutura do projeto

```
minha-biblioteca/
├── index.html   # estrutura da página e do modal
├── style.css    # estilos e variáveis de cor
├── script.js    # lógica, CRUD, filtros e preenchimento automático
└── README.md
```

## 💾 Armazenamento

Os livros ficam no `localStorage` do navegador, sob a chave `@BookManager:data`. Isso significa que os dados são locais àquele navegador e se perdem se você limpar os dados do site.

## 📄 Licença

Projeto criado para fins de estudo.