import request from 'supertest';
import { createApp } from '../../app.js';
import { database } from '../../models/inMemoryDB.js';
import { generateToken } from '../../utils/jwtUtils.js';

let app;

beforeAll(async () => {
  app = await createApp();
});

// IDs dos usuários de teste para clareza
const ADMIN_ID = 1;
const INSTRUTOR_ID = 2;
const ALUNO_JOAO_ID = 3;
const ALUNO_MARIA_ID = 4;

// Helpers para gerar tokens de teste
const generateTestToken = (id, type) => {
  return generateToken({ id, tipo: type });
};

const adminToken = generateTestToken(ADMIN_ID, 'Admin');
const instrutorToken = generateTestToken(INSTRUTOR_ID, 'Instrutor');
const alunoToken = generateTestToken(ALUNO_JOAO_ID, 'Aluno');
const outroAlunoToken = generateTestToken(ALUNO_MARIA_ID, 'Aluno'); // Aluno Maria

describe('User Management API', () => {
  let initialDatabaseState;

  beforeEach(() => {
    // Salvar o estado inicial do banco de dados antes de cada teste
    initialDatabaseState = JSON.parse(JSON.stringify(database));
  });

  afterEach(() => {
    // Restaura TODAS as tabelas para o estado inicial para garantir isolamento total dos testes.
    Object.keys(initialDatabaseState).forEach(key => {
      database[key] = JSON.parse(JSON.stringify(initialDatabaseState[key]));
    });
  });

  // Testes para POST /api/v1/users-management/students
  describe('POST /api/v1/users-management/students', () => {
    it('should allow Admin to create a new student', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: '555.555.555-55',
            nome_completo: 'Novo Aluno Teste',
            email: 'novoaluno@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            height: 180,
            weight: 80,
            date_of_birth: '1995-01-01',
            instructor_id: INSTRUTOR_ID, // Vinculando ao instrutor Flávio
          },
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.tipo).toEqual('Aluno');
      expect(database.users.some(u => u.documento === '555.555.555-55')).toBeTruthy();
      expect(database.studentProfiles.some(p => p.user_id === res.body.data.user.id)).toBeTruthy();
    });

    it('should allow Instrutor to create a new student', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({
          user_data: {
            documento: '666.666.666-66',
            nome_completo: 'Aluno do Instrutor',
            email: 'aluno.instrutor@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            height: 170,
            weight: 65,
            date_of_birth: '2000-05-10',
            instructor_id: INSTRUTOR_ID, // Vinculando a si mesmo (Instrutor Flávio)
          },
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.tipo).toEqual('Aluno');
    });

    it('should not allow Aluno to create a new student', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          user_data: {
            documento: '777.777.777-77',
            nome_completo: 'Aluno Criando Aluno',
            email: 'aluno.criando@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            height: 160,
            weight: 55,
            date_of_birth: '2001-11-20',
          },
        });
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should return 400 for invalid student data', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: 'invalid-doc', // Invalid documento
            nome_completo: 'Aluno Inválido',
            email: 'invalido@test.com',
            senha: 'short', // Invalid senha
          },
          profile_data: {
            height: 300, // Invalid height
          },
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('Dados de requisição inválidos.');
    });

    it('should return 400 for duplicate document on student creation', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: '333.333.333-33', // Documento já existente do Aluno João
            nome_completo: 'Duplicate Student',
            email: 'duplicate@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            height: 170,
          },
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Documento já cadastrado.');
    });
  });

  // Testes para POST /api/v1/users-management/instructors
  describe('POST /api/v1/users-management/instructors', () => {
    it('should allow Admin to create a new instructor', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: '888.888.888-88',
            nome_completo: 'Instrutor Teste',
            email: 'instrutor.novo@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            cref: '987654-G/RJ',
            specialization: 'Crossfit',
          },
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.tipo).toEqual('Instrutor');
      expect(database.users.some(u => u.documento === '888.888.888-88')).toBeTruthy();
      expect(database.instructorProfiles.some(p => p.user_id === res.body.data.user.id)).toBeTruthy();
    });

    it('should not allow Instrutor to create a new instructor', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/instructors')
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({
          user_data: {
            documento: '999.999.999-99',
            nome_completo: 'Instrutor Criando Instrutor',
            email: 'instrutor.criando@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            cref: '111222-G/MG',
          },
        });
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should return 400 for invalid instructor data (missing CREF)', async () => {
      const res = await request(app)
        .post('/api/v1/users-management/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: '000.000.000-00',
            nome_completo: 'Instrutor Sem CREF',
            email: 'instrutor.semcref@test.com',
            senha: 'SenhaSegura123!',
          },
          profile_data: {
            specialization: 'Yoga',
            // cref está faltando
          },
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('cref is required');
    });
  });

  // Testes para GET /api/v1/users-management
  describe('GET /api/v1/users-management', () => {
    it('should allow Admin to get all users', async () => {
      const res = await request(app)
        .get('/api/v1/users-management')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.results).toBeGreaterThanOrEqual(4); // Admin, Instrutor, Aluno João, Aluno Maria
      expect(res.body.data.users.some(u => u.tipo === 'Admin')).toBeTruthy();
      expect(res.body.data.users.some(u => u.tipo === 'Instrutor' && u.profile)).toBeTruthy();
      expect(res.body.data.users.some(u => u.tipo === 'Aluno' && u.profile)).toBeTruthy();
    });

    it('should allow Instrutor to get their own data and their students', async () => {
      const res = await request(app)
        .get('/api/v1/users-management')
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.results).toEqual(3); // Instrutor Flávio (ID 2) + Aluno João (ID 3) + Aluno Maria (ID 4)
      expect(res.body.data.users.some(u => u.id === INSTRUTOR_ID && u.tipo === 'Instrutor')).toBeTruthy();
      expect(res.body.data.users.some(u => u.id === ALUNO_JOAO_ID && u.tipo === 'Aluno')).toBeTruthy();
      expect(res.body.data.users.some(u => u.id === ALUNO_MARIA_ID && u.tipo === 'Aluno')).toBeTruthy();
      expect(res.body.data.users.some(u => u.id === 1 && u.tipo === 'Admin')).toBeFalsy(); // Não deve ver Admin
    });

    it('should allow Aluno to get only their own data', async () => {
      const res = await request(app)
        .get('/api/v1/users-management')
        .set('Authorization', `Bearer ${alunoToken}`); // Aluno João
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.results).toEqual(1);
      expect(res.body.data.users[0].id).toEqual(ALUNO_JOAO_ID);
      expect(res.body.data.users[0].tipo).toEqual('Aluno');
    });
  });

  // Testes para GET /api/v1/users-management/:id
  describe('GET /api/v1/users-management/:id', () => {
    it('should allow Admin to get any user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.id).toEqual(ALUNO_JOAO_ID);
      expect(res.body.data.user.tipo).toEqual('Aluno');
      expect(res.body.data.user.profile).toHaveProperty('height');
    });

    it('should allow Instrutor to get their own data by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users-management/${INSTRUTOR_ID}`)
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.id).toEqual(INSTRUTOR_ID);
      expect(res.body.data.user.tipo).toEqual('Instrutor');
      expect(res.body.data.user.profile).toHaveProperty('cref');
    });

    it('should allow Instrutor to get their student by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.id).toEqual(ALUNO_JOAO_ID);
      expect(res.body.data.user.tipo).toEqual('Aluno');
    });

    it('should not allow Instrutor to get another instrutor by ID', async () => {
      const otherInstrutor = { id: 5, tipo: 'Instrutor' }; // Simular outro instrutor
      database.users.push({ id: 5, documento: '111.222.333-44', nome_completo: 'Instrutor B', email: 'b@i.com', tipo: 'Instrutor', senha_hash: 'hash', status: 'Ativo' });
      database.instructorProfiles.push({ user_id: 5, cref: '111111-G/SP' });

      const res = await request(app)
        .get(`/api/v1/users-management/${otherInstrutor.id}`)
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should not allow Aluno to get another user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users-management/${INSTRUTOR_ID}`)
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should return 404 for non-existent user ID', async () => {
      const res = await request(app)
        .get('/api/v1/users-management/9999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Usuário não encontrado.');
    });
  });

  // Testes para PUT /api/v1/users-management/:id
  describe('PUT /api/v1/users-management/:id', () => {
    it('should allow Admin to update any user', async () => {
      const res = await request(app)
        .put(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: { nome_completo: 'João da Silva Atualizado' },
          profile_data: { height: 178 },
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.nome_completo).toEqual('João da Silva Atualizado');
      // Precisa buscar o perfil separadamente para verificar a atualização do profile_data
      const updatedStudentProfile = database.studentProfiles.find(p => p.user_id === ALUNO_JOAO_ID);
      expect(updatedStudentProfile.height).toEqual(178);
    });

    it('should allow Instrutor to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/v1/users-management/${INSTRUTOR_ID}`)
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({
          user_data: { email: 'flavio.atualizado@app.com' },
          profile_data: { specialization: 'Powerlifting' },
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.email).toEqual('flavio.atualizado@app.com');
      const updatedInstructorProfile = database.instructorProfiles.find(p => p.user_id === INSTRUTOR_ID);
      expect(updatedInstructorProfile.specialization).toEqual('Powerlifting');
    });

    it('should allow Instrutor to update their student profile', async () => {
      const res = await request(app)
        .put(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({
          user_data: { status: 'Inativo' }, // Instrutor pode mudar status do aluno
          profile_data: { weight: 72 },
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.status).toEqual('Inativo');
      const updatedStudentProfile = database.studentProfiles.find(p => p.user_id === ALUNO_JOAO_ID);
      expect(updatedStudentProfile.weight).toEqual(72);
    });

    it('should allow Aluno to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          user_data: { nome_completo: 'João Atualizado' },
          profile_data: { height: 176 },
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data.user.nome_completo).toEqual('João Atualizado');
      const updatedStudentProfile = database.studentProfiles.find(p => p.user_id === ALUNO_JOAO_ID);
      expect(updatedStudentProfile.height).toEqual(176);
    });

    it('should not allow Aluno to update their own type or status', async () => {
      const res = await request(app)
        .put(`/api/v1/users-management/${ALUNO_JOAO_ID}`)
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          user_data: { tipo: 'Admin' },
        });
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Você não pode alterar o tipo ou status do seu usuário.');
    });

    it('should return 403 if Instrutor tries to update another Instrutor', async () => {
      const otherInstrutor = { id: 5, tipo: 'Instrutor' };
      database.users.push({ id: 5, documento: '111.222.333-44', nome_completo: 'Instrutor B', email: 'b@i.com', tipo: 'Instrutor', senha_hash: 'hash', status: 'Ativo' });
      database.instructorProfiles.push({ user_id: 5, cref: '111111-G/SP' });

      const res = await request(app)
        .put(`/api/v1/users-management/${otherInstrutor.id}`)
        .set('Authorization', `Bearer ${instrutorToken}`)
        .send({ user_data: { nome_completo: 'Changed' } });
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should return 404 for non-existent user ID on update', async () => {
      const res = await request(app)
        .put('/api/v1/users-management/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_data: { nome_completo: 'Non Existent' } });
      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Usuário não encontrado.');
    });
  });

  // Testes para DELETE /api/v1/users-management/:id
  describe('DELETE /api/v1/users-management/:id', () => {
    it('should allow Admin to delete a student', async () => {
      // Cria um estudante temporário para deletar
      const newUserRes = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_data: {
            documento: '555.555.555-00', nome_completo: 'Temp Student', email: 'temp@test.com', senha: 'Password123!',
          },
          profile_data: { height: 170, weight: 60, date_of_birth: '1990-01-01', instructor_id: INSTRUTOR_ID },
        });
      const studentToDeleteId = newUserRes.body.data.user.id;

      const res = await request(app)
        .delete(`/api/v1/users-management/${studentToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);
      expect(database.users.some(u => u.id === studentToDeleteId)).toBeFalsy();
      expect(database.studentProfiles.some(p => p.user_id === studentToDeleteId)).toBeFalsy();
    });

    it('should allow Instrutor to delete their student', async () => {
      // Cria um estudante temporário para o instrutor 2 deletar
      const newUserRes = await request(app)
        .post('/api/v1/users-management/students')
        .set('Authorization', `Bearer ${adminToken}`) // Admin cria para garantir que instrutor 2 tem um aluno
        .send({
          user_data: {
            documento: '555.555.555-01', nome_completo: 'Temp Student 2', email: 'temp2@test.com', senha: 'Password123!',
          },
          profile_data: { height: 170, weight: 60, date_of_birth: '1990-01-01', instructor_id: INSTRUTOR_ID }, // Aluno do instrutor 2
        });
      const studentToDeleteId = newUserRes.body.data.user.id;

      const res = await request(app)
        .delete(`/api/v1/users-management/${studentToDeleteId}`)
        .set('Authorization', `Bearer ${instrutorToken}`); // Instrutor 2 deleta
      expect(res.statusCode).toEqual(204);
      expect(database.users.some(u => u.id === studentToDeleteId)).toBeFalsy();
      expect(database.studentProfiles.some(p => p.user_id === studentToDeleteId)).toBeFalsy();
    });

    it('should not allow Instrutor to delete another Instrutor', async () => {
      const res = await request(app)
        .delete(`/api/v1/users-management/${ADMIN_ID}`) // Tentar deletar o Admin
        .set('Authorization', `Bearer ${instrutorToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should not allow deletion if user has associated workout plans', async () => {
      // Adicionar um plano de treino para o Aluno João (id: 3)
      database.workoutPlans.push({ id: 1, student_id: ALUNO_JOAO_ID, instructor_id: INSTRUTOR_ID, name: "Plano do João" });

      const res = await request(app)
        .delete(`/api/v1/users-management/${ALUNO_JOAO_ID}`) // Aluno João
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('existem planos de treino associados');
    });

    it('should not allow deletion if user has associated sessions', async () => {
      // Adicionar uma sessão para o Aluno João (id: 3)
      database.sessions.push({ id: 1, student_id: ALUNO_JOAO_ID, session_date: '2024-01-01' });

      // Para isolar este teste, removemos os planos de treino pré-existentes do Aluno João.
      // A verificação de dependência no serviço para no primeiro vínculo que encontra (neste caso, os planos de treino).
      database.workoutPlans = database.workoutPlans.filter(p => p.student_id !== ALUNO_JOAO_ID);

      const res = await request(app)
        .delete(`/api/v1/users-management/${ALUNO_JOAO_ID}`) // Aluno João
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('existem sessões de treino associadas');
    });
  });
});
