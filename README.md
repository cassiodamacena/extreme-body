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


## Integração Contínua (CI)

Este projeto utiliza GitHub Actions para rodar testes automatizados a cada push ou pull request na branch `main`.

O workflow de CI executa automaticamente:

- Testes unitários (`npm run test:unit`)
- Testes de integração (`npm run test:integration`)
- Testes end-to-end (E2E) (`npm run test:e2e`)

Basta fazer push ou abrir um PR para a branch principal e o pipeline será executado, garantindo a qualidade do código antes de qualquer merge.

Arquivo do workflow: `.github/workflows/ci.yml`

### Comandos de Teste Locais

- **Executar todos os testes:** `npm test`
- **Executar apenas os testes unitários:** `npm run test:unit`
- **Executar apenas os testes de integração:** `npm run test:integration`
- **Executar apenas os testes End-to-End:** `npm run test:e2e`
- **Executar todos os testes em modo watch:** `npm run test:watch`

## Documentação da API

A documentação interativa da API (Swagger UI) estará disponível em `/api-docs` quando o servidor estiver rodando.

## Principais Funcionalidades

A API oferece um conjunto completo de funcionalidades para a gestão de uma academia, incluindo:

- **Gerenciamento de Usuários:** CRUD completo para `Admins`, `Instrutores` e `Alunos`, com perfis distintos e regras de permissão granulares.
- **Autenticação e Autorização:** Sistema seguro baseado em JSON Web Tokens (JWT) e papéis (roles) para proteger os endpoints.
- **Catálogos de Treino:** Gerenciamento centralizado de `Exercícios` e `Modificadores de Set` (ex: Drop Set, Warm Up), formando a base para a criação de treinos.
- **Planos de Treino:** Criação e gestão de planos de treino detalhados, associando alunos a instrutores, exercícios, séries, repetições e cargas sugeridas.
- **Registro de Sessões:** Permite que alunos (ou instrutores em seu nome) registrem as sessões de treino realizadas, capturando o desempenho real (cargas, repetições) em cada exercício.
- **Histórico de Treino:** Endpoints que fornecem um histórico completo e detalhado das sessões de treino, com todos os dados relacionados (aluno, plano, exercício, etc.) já populados para fácil consumo pelo frontend.
- **Testes de Integração:** Cobertura de testes robusta utilizando Jest e Supertest para garantir a confiabilidade e a estabilidade da API.
- **Documentação Automatizada:** Geração automática de documentação interativa da API com Swagger (OpenAPI).

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
│   │   ├── integration/
│   │   └── e2e/
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
