import request from 'supertest';
import { createApp } from '../../app.js';
import { database } from '../../models/inMemoryDB.js';
import { generateToken } from '../../utils/jwtUtils.js';

let app;

beforeAll(async () => {
  app = await createApp();
});

const adminToken = generateToken({ id: 1, tipo: 'Admin' });
const instrutorToken = generateToken({ id: 2, tipo: 'Instrutor' });
const alunoToken = generateToken({ id: 3, tipo: 'Aluno' }); // Aluno João
const outroAlunoToken = generateToken({ id: 4, tipo: 'Aluno' }); // Aluno Maria

describe('Session API', () => {
  let initialDatabaseState;

  beforeEach(() => {
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    database.sessions = JSON.parse(JSON.stringify(initialDatabaseState.sessions));
  });

  const validSessionData = {
    student_id: 3, // Aluno João
    workout_plan_id: 1,
    session_date: '2024-10-10',
    observations: 'Sessão de teste.',
    executions: [
      {
        exercise_id: 1,
        series_completed: 3,
        repetitions_completed: '12,10,8',
        load_used: '50kg',
      },
    ],
  };

  describe('POST /api/v1/sessions', () => {
    it('should allow Aluno to create a session for themselves', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send(validSessionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.session.student_id).toEqual(3);
      expect(res.body.data.session.executions).toHaveLength(1);
    });

    it('should allow Admin to create a session for a student', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSessionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.session.student_id).toEqual(3);
    });

    it('should not allow Aluno to create a session for another student', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${outroAlunoToken}`) // Maria tentando criar para João
        .send(validSessionData);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 for invalid data (e.g., non-existent exercise_id)', async () => {
      const invalidData = {
        ...validSessionData,
        executions: [{ ...validSessionData.executions[0], exercise_id: 999 }],
      };
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Exercício com ID 999 não encontrado');
    });
  });

  describe('GET /api/v1/sessions', () => {
    it('should allow Admin to get all sessions with populated data', async () => {
      const res = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(database.sessions.length);
      const firstSession = res.body.data.sessions.find(s => s.id === 1);
      expect(firstSession.student.nome_completo).toEqual('Aluno João');
      expect(firstSession.executions[0].exercise.name).toEqual('Supino Reto com Barra');
      expect(firstSession.workoutPlan.instructor.nome_completo).toEqual('Instrutor Flávio');
    });

    it('should allow Instrutor to get sessions of their students', async () => {
      const res = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${instrutorToken}`);

      expect(res.statusCode).toEqual(200);
      // Instrutor Flávio (ID 2) é instrutor de João (ID 3) e Maria (ID 4)
      expect(res.body.results).toEqual(2);
      expect(res.body.data.sessions.every(s => s.student.profile.instructor_id === 2)).toBeTruthy();
    });

    it('should allow Aluno to get only their own sessions', async () => {
      const res = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${alunoToken}`); // Aluno João

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(1);
      expect(res.body.data.sessions[0].student_id).toEqual(3);
    });

    it('should filter sessions by student_id', async () => {
        const res = await request(app)
          .get('/api/v1/sessions?student_id=4') // Filtrar por Aluno Maria
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.statusCode).toEqual(200);
        expect(res.body.results).toEqual(1);
        expect(res.body.data.sessions[0].student_id).toEqual(4);
      });

    it('should filter sessions by session_date', async () => {
        const res = await request(app)
          .get('/api/v1/sessions?session_date=2024-05-16') // Filtrar por data da sessão de Maria
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.statusCode).toEqual(200);
        expect(res.body.results).toEqual(1);
        expect(res.body.data.sessions[0].id).toEqual(2); // Session ID 2
        expect(res.body.data.sessions[0].student_id).toEqual(4); // Aluno Maria
      });
  });

  describe('GET /api/v1/sessions/:id', () => {
    it('should get a session by ID with populated details', async () => {
      const res = await request(app)
        .get('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      const session = res.body.data.session;
      expect(session.id).toEqual(1);
      expect(session.student.nome_completo).toEqual('Aluno João');
      expect(session.executions[0].exercise.name).toEqual('Supino Reto com Barra');
      expect(session.workoutPlan.instructor.nome_completo).toEqual('Instrutor Flávio');
      expect(session.executions[0].modifiers[0].name).toEqual('Work Set');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await request(app)
        .get('/api/v1/sessions/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/v1/sessions/:id', () => {
    it('should allow Aluno to update their own session', async () => {
      const res = await request(app)
        .put('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ observations: 'Sessão atualizada pelo aluno.' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.session.observations).toEqual('Sessão atualizada pelo aluno.');
    });

    it('should not allow an unrelated Instrutor to update a session', async () => {
        // Criar um instrutor que não é o de João
        database.users.push({ id: 98, tipo: 'Instrutor', status: 'Ativo' });
        const unrelatedInstructorToken = generateToken({ id: 98, tipo: 'Instrutor' });

        const res = await request(app)
            .put('/api/v1/sessions/1') // Sessão do João
            .set('Authorization', `Bearer ${unrelatedInstructorToken}`)
            .send({ observations: 'Tentativa de update' });

        expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/v1/sessions/:id', () => {
    it('should allow Admin to delete a session', async () => {
      const res = await request(app)
        .delete('/api/v1/sessions/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);

      const findRes = await request(app).get('/api/v1/sessions/1').set('Authorization', `Bearer ${adminToken}`);
      expect(findRes.statusCode).toEqual(404);
    });
  });
});