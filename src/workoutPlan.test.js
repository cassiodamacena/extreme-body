import request from 'supertest';
import app from './app.js';
import { database } from './models/inMemoryDB.js';
import { generateToken } from './utils/jwtUtils.js';

const adminToken = generateToken({ id: 1, tipo: 'Admin' });
const instrutorToken = generateToken({ id: 2, tipo: 'Instrutor' });
const alunoToken = generateToken({ id: 3, tipo: 'Aluno' }); // Aluno João
const outroAlunoToken = generateToken({ id: 4, tipo: 'Aluno' }); // Aluno Maria

describe('Workout Plan API', () => {
  let initialDatabaseState;

  beforeEach(() => {
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  describe('POST /api/v1/workout-plans', () => {
    const validPlanData = {
      name: 'Novo Plano de Teste',
      student_id: 3, // Aluno João
      start_date: '2024-09-01',
      end_date: '2024-09-30',
      items: [
        {
          exercise_id: 1,
          series_count: 3,
          repetitions_expected: '10',
          load_suggested: '40kg',
          order_index: 1,
          modifier_ids: [1],
        },
      ],
    };

    it('should allow Instrutor to create a valid workout plan', async () => {
      const res = await request(app)
        .post('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send(validPlanData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.workoutPlan.name).toEqual('Novo Plano de Teste');
      expect(res.body.data.workoutPlan.instructor.id).toEqual(2);
      expect(res.body.data.workoutPlan.items[0].exercise.name).toEqual('Supino Reto com Barra');
    });

    it('should allow Admin to create a valid workout plan for an instructor', async () => {
      const planForAdmin = {
        ...validPlanData,
        instructor_id: 2, // Admin especifica o instrutor
      };
      const res = await request(app)
        .post('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(planForAdmin);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.workoutPlan.name).toEqual('Novo Plano de Teste');
      expect(res.body.data.workoutPlan.instructor.id).toEqual(2); // Verifica se o instrutor correto foi associado
    });

    it('should return 400 if Admin creates a plan without specifying instructor_id', async () => {
      const res = await request(app).post('/api/v1/workout-plans').set('Authorization', `Bearer ${adminToken}`).send(validPlanData);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Administradores devem especificar o campo "instructor_id"');
    });

    it('should not allow Aluno to create a workout plan', async () => {
      const res = await request(app)
        .post('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send(validPlanData);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 for invalid data (e.g., non-existent exercise_id)', async () => {
      const invalidPlanData = { ...validPlanData, items: [{ ...validPlanData.items[0], exercise_id: 999 }] };
      const res = await request(app)
        .post('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send(invalidPlanData);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Exercício com ID 999 não encontrado.');
    });

    it('should return 400 for invalid data (start_date > end_date)', async () => {
        const invalidPlanData = { ...validPlanData, start_date: '2024-10-01', end_date: '2024-09-30' };
        const res = await request(app)
          .post('/api/v1/workout-plans')
          .set('Authorization', `Bearer ${instrutorToken}`)
          .send(invalidPlanData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('end_date must be greater than or equal to');
      });
  });

  describe('GET /api/v1/workout-plans', () => {
    it('should allow Admin to get all plans', async () => {
      const res = await request(app)
        .get('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(database.workoutPlans.length);
    });

    it('should allow Instrutor to get only their created plans', async () => {
      const res = await request(app)
        .get('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(2);
      expect(res.body.data.workoutPlans.every(p => p.instructor_id === 2)).toBeTruthy();
    });

    it('should allow Aluno to get only their own plans', async () => {
      const res = await request(app)
        .get('/api/v1/workout-plans')
        .set('Authorization', `Bearer ${alunoToken}`); // Aluno João (ID 3)
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data.workoutPlans[0].student_id).toEqual(3);
    });
  });

  describe('GET /api/v1/workout-plans/:id', () => {
    it('should get a plan by ID with populated details', async () => {
      const res = await request(app)
        .get('/api/v1/workout-plans/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      const plan = res.body.data.workoutPlan;
      expect(plan.id).toEqual(1);
      expect(plan.student.nome_completo).toEqual('Aluno João');
      expect(plan.items[0].exercise.name).toEqual('Supino Reto com Barra');
      expect(plan.items[0].modifiers[0].name).toEqual('Work Set');
    });

    it('should not allow an unrelated Aluno to get a plan', async () => {
        // Aluno Maria (ID 4) tentando pegar o plano do Aluno João (ID 3)
        const res = await request(app)
          .get('/api/v1/workout-plans/1')
          .set('Authorization', `Bearer ${outroAlunoToken}`);
        expect(res.statusCode).toEqual(403);
      });
  });

  describe('PUT /api/v1/workout-plans/:id', () => {
    it('should allow the creating Instrutor to update a plan', async () => {
      const res = await request(app)
        .put('/api/v1/workout-plans/1')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({ name: 'Plano de Hipertrofia ATUALIZADO' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.workoutPlan.name).toEqual('Plano de Hipertrofia ATUALIZADO');
    });

    it('should not allow Aluno to update a plan', async () => {
      const res = await request(app)
        .put('/api/v1/workout-plans/1')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ name: 'Tentativa de Update' });
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/v1/workout-plans/:id', () => {
    it('should allow Admin to delete an unlinked plan', async () => {
        const newPlan = {
            name: 'Plano para Deletar', student_id: 3, instructor_id: 2, start_date: '2025-01-01', end_date: '2025-01-31',
            items: [{ exercise_id: 1, series_count: 1, repetitions_expected: '1', load_suggested: '1', order_index: 1 }]
        };
        const createRes = await request(app).post('/api/v1/workout-plans').set('Authorization', `Bearer ${adminToken}`).send(newPlan);
        const planId = createRes.body.data.workoutPlan.id;

        const deleteRes = await request(app)
            .delete(`/api/v1/workout-plans/${planId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(deleteRes.statusCode).toEqual(204);
    });

    it('should not allow an unauthorized Instrutor to delete a plan', async () => {
        // Criar um instrutor temporário
        const tempInstructorToken = generateToken({ id: 99, tipo: 'Instrutor' });
        database.users.push({
            id: 99,
            documento: '999.999.999-99',
            nome_completo: 'Instrutor Temp',
            email: 'temp.instrutor@app.com',
            tipo: 'Instrutor',
            senha_hash: 'some_hash_value',
            status: 'Ativo',
        });

        const res = await request(app)
            .delete('/api/v1/workout-plans/1') // Plano criado pelo instrutor 2
            .set('Authorization', `Bearer ${tempInstructorToken}`);
        expect(res.statusCode).toEqual(403);
    });

    it('should fail to delete if plan is linked to a session', async () => {
      // Simula um vínculo: uma sessão foi baseada no plano de treino 1
      database.sessions.push({
        id: 1,
        student_id: 3,
        workout_plan_id: 1, // Vínculo aqui
        session_date: new Date(),
      });

      const res = await request(app)
        .delete('/api/v1/workout-plans/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('vinculado a sessões existentes');
    });
  });
});
