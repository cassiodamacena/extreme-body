# Changelog

## 1.1.0 - 2025-09-21

### Adicionado

- **API GraphQL:** Implementação de uma API GraphQL para acesso flexível aos dados, operando de forma híbrida com a API REST existente.
- **Testes GraphQL:** Cobertura de testes abrangente para a API GraphQL, incluindo:
    - Testes de login (sucesso e falha).
    - Testes de CRUD para usuários (criação, leitura, atualização e exclusão), cobrindo cenários de sucesso e validação de dados inválidos/duplicados.
- **Relatório de Testes GraphQL:** Geração de relatórios HTML detalhados para os testes GraphQL usando Mochawesome.

### Corrigido

- **Encerramento da Aplicação (Windows):** Resolvido problema de encerramento inadequado da aplicação em ambientes Windows ao usar `nodemon`.
- **Inconsistências de Campo de Senha:** Padronizado o nome do campo de senha para `password` em todo o projeto (schemas GraphQL, modelos de usuário, serviços de autenticação e testes), garantindo consistência entre as APIs REST e GraphQL.
- **Testes de Integração REST:** Corrigidos os testes de integração REST de gerenciamento de usuário que falhavam devido a inconsistências no campo de senha.
