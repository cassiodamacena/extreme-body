import request from 'supertest';
import { expect } from 'chai';
import { createApp } from '../../app.js';
import { generateToken } from '../../utils/jwtUtils.js';
import { database } from '../../models/inMemoryDB.js'; // Importar o banco de dados em memória

describe('GraphQL API Integration - Login test', () => {
  let app;

  before(async () => {
    app = await createApp();
  });

  it('should fetch all sessions via GraphQL for an Admin user', async () => {
    const adminUser = { id: 1, tipo: 'Admin' };
    const token = generateToken(adminUser);

    const graphqlQuery = {
      query: `
        query GetSessions {
          sessions {
            id
            student {
              nome_completo
            }
          }
        }
      `,
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(graphqlQuery);

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.sessions).to.be.an('array');
    expect(response.body.data.sessions).to.have.length.above(0);
    expect(response.body.data.sessions[0].student.nome_completo).to.exist;
  });

  it('should allow a user to login via GraphQL', async () => {
    const loginQuery = {
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              email
              tipo
            }
          }
        }
      `,
      variables: {
        email: 'admin@app.com',
        password: 'senhaAdmin123!',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send(loginQuery);

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.login).to.have.property('token').that.is.a('string');
    expect(response.body.data.login.user.email).to.equal('admin@app.com');
    expect(response.body.data.login.user.tipo).to.equal('Admin');
  });

  it('should not allow a user to login with invalid credentials via GraphQL', async () => {
    const invalidLoginQuery = {
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
            }
          }
        }
      `,
      variables: {
        email: 'nonexistent@app.com',
        password: 'wrongpassword',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send(invalidLoginQuery);

    expect(response.statusCode).to.equal(200);
    expect(response.body).to.have.property('errors');
    expect(response.body.errors).to.be.an('array').that.is.not.empty;
    expect(response.body.errors[0]).to.have.property('message').that.includes('Credenciais inválidas');
  });
});

describe('GraphQL API Integration - User test', () => {
  let app;
  let adminToken;
  let initialDatabaseState;

  before(async () => {
    app = await createApp();
    const adminUser = { id: 1, tipo: 'Admin' };
    adminToken = generateToken(adminUser);
  });

  beforeEach(() => {
    // Salva o estado inicial do banco de dados antes de cada teste
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    // Restaura TODAS as tabelas para o estado inicial para garantir isolamento total dos testes.
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  it('should create a new student user', async () => {
    const createUserMutation = {
      query: `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            nome_completo
            email
            tipo
            status
            studentProfile {
              height
            }
          }
        }
      `,
      variables: {
        input: {
          documento: '999.999.999-99',
          nome_completo: 'Novo Aluno GraphQL',
          email: 'novoaluno@graphql.com',
          password: 'senhaSegura123!', // Corrigido para 'password'
          tipo: 'Aluno',
          studentProfile: {
            height: 170,
            weight: 65,
            date_of_birth: '2000-01-01',
            instructor_id: 2 // Instrutor Flávio
          }
        }
      }
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createUserMutation);

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.createUser).to.have.property('id');
    expect(response.body.data.createUser.nome_completo).to.equal('Novo Aluno GraphQL');
    expect(response.body.data.createUser.tipo).to.equal('Aluno');
    expect(response.body.data.createUser.studentProfile.height).to.equal(170);
  });

  it('should not create a user with duplicate document', async () => {
    const createUserMutation = {
      query: `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          documento: '111.111.111-11', // Documento do Admin Master
          nome_completo: 'Aluno Duplicado',
          email: 'duplicado@graphql.com',
          password: 'senhaSegura123!', // Corrigido para 'password'
          tipo: 'Aluno'
        }
      }
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createUserMutation);

    expect(response.statusCode).to.equal(200);
    expect(response.body).to.have.property('errors');
    expect(response.body.errors[0].message).to.include('Documento já cadastrado');
  });

  it('should fetch a user by ID', async () => {
    const getUserQuery = {
      query: `
        query User($id: ID!) {
          user(id: $id) {
            id
            nome_completo
            email
          }
        }
      `,
      variables: {
        id: '1' // Admin Master
      }
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(getUserQuery);

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.user.nome_completo).to.equal('Admin Master');
  });

  it('should update a user', async () => {
    const updateUserMutation = {
      query: `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            id
            nome_completo
            email
          }
        }
      `,
      variables: {
        id: '3', // Aluno João
        input: {
          nome_completo: 'João da Silva Atualizado GraphQL',
          email: 'joao.atualizado@graphql.com'
        }
      }
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateUserMutation);

    expect(response.statusCode).to.equal(200);
    expect(response.body.data.updateUser.nome_completo).to.equal('João da Silva Atualizado GraphQL');
  });

  it('should delete a user', async () => {
    // Criar um usuário temporário para deletar
    const createUserMutation = {
      query: `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          documento: '123.456.789-00',
          nome_completo: 'Usuario para Deletar',
          email: 'deletar@graphql.com',
          password: 'senhaSegura123!', // Corrigido para 'password'
          tipo: 'Aluno'
        }
      }
    };

    const createResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createUserMutation);

    const userIdToDelete = createResponse.body.data.createUser.id;

    const deleteUserMutation = {
      query: `
        mutation DeleteUser($id: ID!) {
          deleteUser(id: $id)
        }
      `,
      variables: {
        id: userIdToDelete
      }
    };

    const deleteResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(deleteUserMutation);

    expect(deleteResponse.statusCode).to.equal(200);
    expect(deleteResponse.body.data.deleteUser).to.be.true;

    // Verificar se o usuário foi realmente deletado
    const getUserQuery = {
      query: `
        query User($id: ID!) {
          user(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: userIdToDelete
      }
    };

    const getResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(getUserQuery);

    expect(getResponse.statusCode).to.equal(200);
    expect(getResponse.body.data.user).to.be.null; // Usuário não deve ser encontrado
  });
});