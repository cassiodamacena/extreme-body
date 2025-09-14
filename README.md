# Gym Management API

Este é o backend para o sistema de gestão de treinos de academia.

## Configuração

1. Clone o repositório: `git clone <URL_DO_SEU_REPOSITORIO>`
2. Navegue até a pasta do projeto: `cd gym-management-api`
3. Instale as dependências: `npm install`
4. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=sua_chave_secreta_jwt_aqui
   JWT_EXPIRES_IN=1h
   ```

## Execução

*   **Modo de Desenvolvimento:** `npm run dev` (com `nodemon`)
*   **Modo de Produção:** `npm start`

## Testes

*   **Executar todos os testes:** `npm test`
*   **Executar testes em modo watch:** `npm run test:watch`

## Documentação da API

A documentação interativa da API (Swagger UI) estará disponível em `/api-docs` quando o servidor estiver rodando.

## Estrutura de Diretórios

```
├── src/
│   ├── config/               # Configurações do projeto
│   ├── controllers/          # Lógica de manipulação de requisições
│   ├── middlewares/          # Funções intermediárias (autenticação, autorização, erros)
│   ├── models/               # Camada de acesso e lógica de dados (in-memory DB)
│   ├── routes/               # Definição de rotas da API
│   ├── services/             # Lógica de negócio (business rules)
│   ├── tests/                # Testes da aplicação
│   │   ├── unit/
│   │   └── integration/
│   ├── utils/                # Funções utilitárias (erros, hashing, JWT)
│   ├── app.js                # Configuração principal do Express
│   └── server.js             # Ponto de entrada do servidor
├── .env                      # Variáveis de ambiente
├── .gitignore                # Arquivos/pastas a serem ignorados pelo Git
├── package.json              # Configurações e dependências do Node.js
├── package-lock.json         # Bloqueio de versões das dependências
├── README.md                 # Visão geral do projeto
└── EXTREME_BODY.md           # Regras de negócio, requisitos e modelagem de dados detalhada
```
