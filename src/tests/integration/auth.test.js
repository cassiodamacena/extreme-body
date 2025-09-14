import request from 'supertest';
import app from '../../app.js';
import { database } from '../../models/inMemoryDB.js';
import { hashPassword } from '../../utils/passwordUtils.js';

describe('Auth API', () => {
  let adminUser, instrutorUser, alunoUser;

  beforeAll(async () => {
    // Garante que as senhas estejam corretamente hasheadas
    database.users.forEach(async (user) => {
      if (!user.senha_hash || user.senha_hash.startsWith('$2a$')) return;
      user.senha_hash = await hashPassword(user.senha_hash);
    });
    adminUser = database.users.find(u => u.tipo === 'Admin');
    instrutorUser = database.users.find(u => u.tipo === 'Instrutor');
    alunoUser = database.users.find(u => u.tipo === 'Aluno');
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
    alunoUser.status = 'Inativo';
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ documentoOuEmail: alunoUser.email, senha: 'senhaAluno123!' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual('error');
    expect(res.body.message).toContain('inativa');
    alunoUser.status = 'Ativo'; // Restaura
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
