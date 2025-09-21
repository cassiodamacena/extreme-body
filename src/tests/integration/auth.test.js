import request from 'supertest';
import { createApp } from '../../app.js';
import { database } from '../../models/inMemoryDB.js';

let app;

beforeAll(async () => {
  app = await createApp();
});

describe('Auth API', () => {
  let initialDatabaseState;
  const adminUser = database.users.find(u => u.tipo === 'Admin');
  const instrutorUser = database.users.find(u => u.tipo === 'Instrutor');
  const alunoUser = database.users.find(u => u.id === 3); // Aluno João

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

  it('should login with valid Admin credentials (email)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: adminUser.email, senha: 'senhaAdmin123!' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.token).toBeDefined();
  });

  it('should login with valid Instrutor credentials (documento)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: instrutorUser.documento, senha: 'senhaInstrutor123!' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.token).toBeDefined();
  });

  it('should login with valid Aluno credentials (email)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: alunoUser.email, senha: 'senhaAluno123!' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.token).toBeDefined();
  });

  it('should fail login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: 'naoexiste@app.com', senha: 'senhaErrada' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual('error');
    expect(res.body.message).toContain('Credenciais inválidas');
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: adminUser.email, senha: 'senhaErrada' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual('error');
    expect(res.body.message).toContain('Credenciais inválidas');
  });

  it('should fail login for inactive user', async () => {
    // Torna o aluno inativo
    const userToDeactivate = database.users.find(u => u.id === alunoUser.id);
    userToDeactivate.status = 'Inativo';

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: alunoUser.email, senha: 'senhaAluno123!' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual('error');
    expect(res.body.message).toContain('inativa');
  });

  it('should fail login with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: adminUser.email }); // senha faltando
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual('fail');
    expect(res.body.message).toContain('Dados de requisição inválidos');
  });
});
