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

describe('Modifier API', () => {
  let initialDatabaseState;

  beforeEach(() => {
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  describe('POST /api/v1/modifiers', () => {
    it('should allow Admin to create a modifier', async () => {
      const res = await request(app)
        .post('/api/v1/modifiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rest Pause', description: 'Pausa curta entre repetições.' });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.modifier.name).toEqual('Rest Pause');
    });

    it('should not allow Aluno to create a modifier', async () => {
      const res = await request(app)
        .post('/api/v1/modifiers')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ name: 'Tentativa de Aluno' });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 for invalid data (short name)', async () => {
      const res = await request(app)
        .post('/api/v1/modifiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('name length must be at least 3 characters long');
    });

    it('should return 400 for duplicate name', async () => {
      const res = await request(app)
        .post('/api/v1/modifiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Drop Set' }); // Já existe no DB
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Já existe um modificador com este nome.');
    });
  });

  describe('GET /api/v1/modifiers', () => {
    it('should allow any authenticated user to get all modifiers', async () => {
      const res = await request(app)
        .get('/api/v1/modifiers')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(database.modifiers.length);
    });
  });

  describe('GET /api/v1/modifiers/:id', () => {
    it('should get a modifier by ID', async () => {
      const res = await request(app)
        .get('/api/v1/modifiers/1') // Warm Up Set
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.modifier.id).toEqual(1);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/v1/modifiers/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/v1/modifiers/:id', () => {
    it('should allow Instrutor to update a modifier', async () => {
      const res = await request(app)
        .put('/api/v1/modifiers/1')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({ description: 'Descrição atualizada do Warm Up Set.' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.modifier.description).toEqual('Descrição atualizada do Warm Up Set.');
    });

    it('should not allow Aluno to update a modifier', async () => {
      const res = await request(app)
        .put('/api/v1/modifiers/1')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ description: 'Tentativa de atualização.' });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .put('/api/v1/modifiers/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Inexistente' });
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 for duplicate name on update', async () => {
      const res = await request(app)
        .put('/api/v1/modifiers/1') // Tenta renomear "Warm Up Set"
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Drop Set' }); // Para o nome de um modificador que já existe (ID 3)
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Já existe outro modificador com este nome.');
    });
  });

  describe('DELETE /api/v1/modifiers/:id', () => {
    it('should allow Admin to delete an unlinked modifier', async () => {
      const newModifierRes = await request(app)
        .post('/api/v1/modifiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Modificador para Deletar' });
      const modifierId = newModifierRes.body.data.modifier.id;

      const res = await request(app)
        .delete(`/api/v1/modifiers/${modifierId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);
    });

    it('should not allow Aluno to delete a modifier', async () => {
      const res = await request(app)
        .delete('/api/v1/modifiers/1')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .delete('/api/v1/modifiers/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });

    it('should fail to delete if modifier is linked to a workout plan item', async () => {
      // Simula um vínculo: o item 1 do plano de treino usa o modificador 1 (Warm Up Set)
      if (!database.workoutPlanItems) database.workoutPlanItems = [];
      database.workoutPlanItems.push({
        id: 1,
        workout_plan_id: 1,
        exercise_id: 1,
        modifiers: [1], // Vínculo aqui
      });

      const res = await request(app)
        .delete('/api/v1/modifiers/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('vinculado a planos de treino ou execuções');
    });
  });
});