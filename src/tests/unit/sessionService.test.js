import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { database } from '../../models/inMemoryDB.js';

// Mocka todas as dependências externas para isolar o `sessionService`
// Usamos jest.unstable_mockModule para compatibilidade com ES Modules
jest.unstable_mockModule('../../models/sessionModel.js', () => ({
  sessionModel: {
    findAll: jest.fn(),
  },
}));
jest.unstable_mockModule('../../models/userModel.js', () => ({
  userModel: {
    findById: jest.fn(),
  },
}));
jest.unstable_mockModule('../../models/workoutPlanModel.js', () => ({
  workoutPlanModel: {
    findById: jest.fn(),
  },
}));
jest.unstable_mockModule('../../models/exerciseModel.js', () => ({
  exerciseModel: {
    findById: jest.fn(),
  },
}));
jest.unstable_mockModule('../../models/modifierModel.js', () => ({
  modifierModel: {
    findById: jest.fn(),
  },
}));

describe('Unit Test: sessionService.getAllSessions', () => {
  let sessionService;
  let sessionModel;
  let userModel;

  // Dados falsos que seriam retornados pelo banco de dados
  const mockSessions = [
    { id: 1, student_id: 3 }, // Sessão do Aluno João (aluno do Instrutor 2)
    { id: 2, student_id: 4 }, // Sessão da Aluna Maria (aluna do Instrutor 2)
    { id: 3, student_id: 5 }, // Sessão de um aluno de outro instrutor
  ];

  beforeEach(async () => {
    // Importa os módulos dinamicamente DEPOIS que os mocks foram configurados
    sessionService = (await import('../../services/sessionService.js')).sessionService;
    sessionModel = (await import('../../models/sessionModel.js')).sessionModel;
    userModel = (await import('../../models/userModel.js')).userModel;
    const { workoutPlanModel } = await import('../../models/workoutPlanModel.js');
    const { exerciseModel } = await import('../../models/exerciseModel.js');
    const { modifierModel } = await import('../../models/modifierModel.js');

    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();

    // Configura um retorno padrão para o `findAll` do modelo
    sessionModel.findAll.mockResolvedValue([...mockSessions]);

    // Simula a função de popular dados para retornar o que recebe,
    // pois não estamos testando a população aqui, e sim a autorização.
    userModel.findById.mockImplementation(id => Promise.resolve({ id, tipo: 'Aluno', profile: { instructor_id: id === 5 ? 99 : 2 } }));
    workoutPlanModel.findById.mockResolvedValue({ id: 1, instructor_id: 2 });
    exerciseModel.findById.mockResolvedValue({ id: 1 });
    modifierModel.findById.mockResolvedValue({ id: 1 });

    // Garante que o helper `isInstructorOfStudent` tenha os dados necessários
    database.studentProfiles = [
        { user_id: 3, instructor_id: 2 },
        { user_id: 4, instructor_id: 2 },
        { user_id: 5, instructor_id: 99 },
    ];
  });

  it('should return all sessions for an Admin user', async () => {
    const requestingUser = { id: 1, tipo: 'Admin' };

    const result = await sessionService.getAllSessions(requestingUser, {});

    // Verifica se o modelo foi chamado
    expect(sessionModel.findAll).toHaveBeenCalledWith({});
    // O Admin vê todas as 3 sessões, sem filtro
    expect(result).toHaveLength(3);
  });

  it('should return only the student\'s own sessions for an Aluno user', async () => {
    const requestingUser = { id: 3, tipo: 'Aluno' }; // Aluno João

    const result = await sessionService.getAllSessions(requestingUser, {});

    expect(sessionModel.findAll).toHaveBeenCalledWith({});
    // O Aluno João deve ver apenas a sua própria sessão
    expect(result).toHaveLength(1);
    expect(result[0].student_id).toBe(3);
  });

  it('should return only sessions of their students for an Instrutor user', async () => {
    const requestingUser = { id: 2, tipo: 'Instrutor' }; // Instrutor Flávio

    const result = await sessionService.getAllSessions(requestingUser, {});

    expect(sessionModel.findAll).toHaveBeenCalledWith({});
    // O Instrutor Flávio deve ver as sessões de seus alunos (João e Maria), mas não a do aluno 5.
    expect(result).toHaveLength(2);
    // Garante que a sessão do aluno 5 não está na lista
    expect(result.some(s => s.student_id === 5)).toBeFalsy();
  });
});