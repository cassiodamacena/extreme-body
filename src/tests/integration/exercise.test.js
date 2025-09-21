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
const alunoToken = generateToken({ id: 3, tipo: 'Aluno' });

describe('Exercise API', () => {
  let initialDatabaseState;

  beforeEach(() => {
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  describe('POST /api/v1/exercises', () => {
    it('should allow Admin to create an exercise', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rosca Direta', muscle_category: 'Bíceps' });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.exercise.name).toEqual('Rosca Direta');
    });

    it('should allow Instrutor to create an exercise', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({ name: 'Elevação Lateral', muscle_category: 'Ombros' });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.exercise.name).toEqual('Elevação Lateral');
    });

    it('should not allow Aluno to create an exercise', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ name: 'Tríceps Testa', muscle_category: 'Tríceps' });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' }); // Nome curto, categoria faltando
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('name length must be at least 3 characters long');
      expect(res.body.message).toContain('muscle_category is required');
    });

    it('should return 400 for duplicate name', async () => {
      const res = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Supino Reto com Barra', muscle_category: 'Peito' }); // Já existe
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Já existe um exercício com este nome.');
    });
  });

  describe('GET /api/v1/exercises', () => {
    it('should allow any authenticated user to get all exercises', async () => {
      const res = await request(app)
        .get('/api/v1/exercises')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(database.exercises.length);
    });

    it('should filter exercises by muscle_category', async () => {
      const res = await request(app)
        .get('/api/v1/exercises?muscle_category=Peito')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(1);
      expect(res.body.data.exercises[0].name).toEqual('Supino Reto com Barra');
    });
  });

  describe('GET /api/v1/exercises/:id', () => {
    it('should get an exercise by ID', async () => {
      const res = await request(app)
        .get('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.exercise.id).toEqual(1);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/v1/exercises/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/v1/exercises/:id', () => {
    it('should allow Admin to update an exercise', async () => {
      const res = await request(app)
        .put('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Descrição atualizada.' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.exercise.description).toEqual('Descrição atualizada.');
    });

    it('should not allow Aluno to update an exercise', async () => {
      const res = await request(app)
        .put('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ description: 'Tentativa de atualização.' });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .put('/api/v1/exercises/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Inexistente' });
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 for duplicate name on update', async () => {
      const res = await request(app)
        .put('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Agachamento Livre' }); // Nome do exercício com ID 2
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Já existe outro exercício com este nome.');
    });
  });

  describe('DELETE /api/v1/exercises/:id', () => {
    it('should allow Admin to delete an unlinked exercise', async () => {
      // Criar um exercício que não está em uso
      const newExerciseRes = await request(app)
        .post('/api/v1/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Exercício para Deletar', muscle_category: 'Teste' });
      const exerciseId = newExerciseRes.body.data.exercise.id;

      const res = await request(app)
        .delete(`/api/v1/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);
    });

    it('should not allow Aluno to delete an exercise', async () => {
      const res = await request(app)
        .delete('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .delete('/api/v1/exercises/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });

    it('should fail to delete if exercise is linked to an execution', async () => {
      // Vincular o exercício 1 a uma execução
      database.sessions[0].executions.push({
        id: 99,
        exercise_id: 1,
        series_completed: 1,
        repetitions_completed: '1',
        load_used: '1kg',
      });

      const res = await request(app)
        .delete('/api/v1/exercises/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('vinculado a planos de treino ou execuções');
    });
  });
});
