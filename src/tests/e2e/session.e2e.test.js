import request from 'supertest';
import http from 'http';
import app from '../../app.js'; // A aplicação Express
import { database } from '../../models/inMemoryDB.js';
import { generateToken } from '../../utils/jwtUtils.js';

// Este arquivo contém testes End-to-End (E2E).
// Diferente dos testes de integração que testam a aplicação em memória,
// os testes E2E iniciam um servidor HTTP real e fazem requisições de rede
// para 'localhost', testando a aplicação de ponta a ponta.

describe('E2E Tests for Session API', () => {
  let server;
  let initialDatabaseState;

  // Tokens de teste
  const adminToken = generateToken({ id: 1, tipo: 'Admin' });
  const instrutorToken = generateToken({ id: 2, tipo: 'Instrutor' });
  const alunoToken = generateToken({ id: 3, tipo: 'Aluno' }); // Aluno João

  // Inicia o servidor antes de todos os testes neste describe block
  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(done); // Inicia em uma porta aleatória disponível
  });

  // Fecha o servidor após todos os testes
  afterAll((done) => {
    server.close(done);
  });

  // Reseta o banco de dados para um estado limpo antes de cada teste
  beforeEach(() => {
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  const validSessionData = {
    student_id: 3, // Aluno João
    workout_plan_id: 1,
    session_date: '2024-10-10',
    observations: 'Sessão de teste E2E.',
    executions: [
      {
        exercise_id: 1,
        series_completed: 3,
        repetitions_completed: '12,10,8',
        load_used: '50kg',
      },
    ],
  };

  // Testes para POST /api/v1/sessions
  describe('POST /api/v1/sessions', () => {
    it('should create a session when authenticated as the student themselves', async () => {
      const res = await request(server) // Usa o servidor real
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send(validSessionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.session.student_id).toEqual(3);
      expect(res.body.data.session.observations).toEqual('Sessão de teste E2E.');
    });

    it('should return 403 when a student tries to create a session for another student', async () => {
      const res = await request(server)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${generateToken({ id: 4, tipo: 'Aluno' })}`) // Aluna Maria
        .send(validSessionData); // Tentando criar para o Aluno João

      expect(res.statusCode).toEqual(403);
    });
  });

  // Testes para GET /api/v1/sessions
  describe('GET /api/v1/sessions', () => {
    it('should return all sessions for an Admin', async () => {
      const res = await request(server)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(2); // 2 sessões no DB inicial
    });

    it('should return only the student\'s sessions for an Aluno', async () => {
      const res = await request(server)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${alunoToken}`); // Aluno João

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data.sessions[0].student_id).toEqual(3);
    });
  });

  // Testes para GET /api/v1/sessions/:id
  describe('GET /api/v1/sessions/:id', () => {
    it('should get a specific session with populated data', async () => {
      const res = await request(server)
        .get('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.session.id).toEqual(1);
      expect(res.body.data.session.student.nome_completo).toEqual('Aluno João');
      expect(res.body.data.session.executions[0].exercise.name).toEqual('Supino Reto com Barra');
    });

    it('should return 404 for a non-existent session', async () => {
      const res = await request(server)
        .get('/api/v1/sessions/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  // Testes para PUT /api/v1/sessions/:id
  describe('PUT /api/v1/sessions/:id', () => {
    it('should update a session successfully', async () => {
      const res = await request(server)
        .put('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ observations: 'Observação atualizada via E2E.' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.session.observations).toEqual('Observação atualizada via E2E.');
    });
  });

  // Testes para DELETE /api/v1/sessions/:id
  describe('DELETE /api/v1/sessions/:id', () => {
    it('should delete a session successfully', async () => {
      const deleteRes = await request(server)
        .delete('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toEqual(204);

      // Verifica se a sessão foi realmente deletada
      const getRes = await request(server)
        .get('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.statusCode).toEqual(404);
    });
  });
});