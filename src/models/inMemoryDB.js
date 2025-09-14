import { hashPassword } from '../utils/passwordUtils.js';

// Hashes gerados com 'generateHashes.js'
const ADMIN_PASSWORD_HASH = '$2a$12$5agwknW2emWR96FRx2U6qe4Y5DzzqTLBdhOypMVaQlqdHUEZiOZQG'; // COLOQUE O HASH GERADO PARA 'senhaAdmin123!'
const INSTRUTOR_PASSWORD_HASH = '$2a$12$1sDAF.uQPeMYpSkfOgFoXu7htgWoujRBOfp2ZoRJS5t2.W7orpXc6'; // COLOQUE O HASH GERADO PARA 'senhaInstrutor123!'
const ALUNO_PASSWORD_HASH = '$2a$12$10zLM8gqlXfYOHxIXBeRk.39Xax4vLJschms7CSIVmRzMazV0zDDG'; // COLOQUE O HASH GERADO PARA 'senhaAluno123!'

const database = {
  users: [
    {
      id: 1,
      documento: '111.111.111-11',
      nome_completo: 'Admin Master',
      email: 'admin@app.com',
      tipo: 'Admin',
      senha_hash: ADMIN_PASSWORD_HASH,
      status: 'Ativo',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      documento: '222.222.222-22',
      nome_completo: 'Instrutor Flávio',
      email: 'instrutor@app.com',
      tipo: 'Instrutor',
      senha_hash: INSTRUTOR_PASSWORD_HASH,
      status: 'Ativo',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      documento: '333.333.333-33',
      nome_completo: 'Aluno João',
      email: 'aluno@app.com',
      tipo: 'Aluno',
      senha_hash: ALUNO_PASSWORD_HASH,
      status: 'Ativo',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 4,
      documento: '444.444.444-44',
      nome_completo: 'Aluno Maria',
      email: 'alunomaria@app.com',
      tipo: 'Aluno',
      senha_hash: ALUNO_PASSWORD_HASH, // Pode ser a mesma senha para facilitar
      status: 'Ativo',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  studentProfiles: [
    {
      user_id: 3, // João
      height: 175,
      weight: 70.5,
      date_of_birth: '1998-03-15',
      instructor_id: 2, // Flávio
    },
    {
      user_id: 4, // Maria
      height: 162,
      weight: 58.0,
      date_of_birth: '2000-07-20',
      instructor_id: 2, // Flávio
    },
  ],
  instructorProfiles: [
    {
      user_id: 2, // Flávio
      cref: '123456-G/SP',
      specialization: 'Musculação, Hipertrofia',
      bio: 'Especialista em treinamento de força e condicionamento físico.',
    },
  ],
  exercises: [
    {
      id: 1,
      name: 'Supino Reto com Barra',
      description: 'Exercício para peitoral, ombros e tríceps.',
      general_observation: 'Manter a barra alinhada com o meio do peito, evitar arquear a lombar excessivamente.',
      muscle_category: 'Peito',
      video_link: 'https://youtube.com/supino-reto',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      name: 'Agachamento Livre',
      description: 'Exercício composto para pernas e glúteos.',
      general_observation: 'Manter a coluna reta, joelhos apontando para a ponta dos pés, descer até 90 graus ou mais.',
      muscle_category: 'Pernas',
      video_link: 'https://youtube.com/agachamento-livre',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      name: 'Remada Curvada',
      description: 'Exercício para costas, com foco nos dorsais e trapézio.',
      general_observation: 'Manter o tronco fixo, puxar a barra em direção ao umbigo.',
      muscle_category: 'Costas',
      video_link: 'https://youtube.com/remada-curvada',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  modifiers: [
    {
      id: 1,
      name: 'Warm Up Set',
      description: 'Série de aquecimento, com carga leve e longe da falha.',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      name: 'Work Set',
      description: 'Série de trabalho, com falha ou próximo da falha.',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      name: 'Drop Set',
      description: 'Redução da carga em 20-40% após a falha, sem descanso.',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  workoutPlans: [
    {
      id: 1,
      name: 'Plano de Hipertrofia - João',
      description: 'Foco em ganho de massa muscular para o aluno João.',
      instructor_id: 2, // Instrutor Flávio
      student_id: 3, // Aluno João
      start_date: '2024-05-01',
      end_date: '2024-07-31',
      created_at: new Date('2024-04-28'),
      updated_at: new Date('2024-04-28'),
      items: [
        {
          id: 1,
          exercise_id: 1, // Supino Reto com Barra
          series_count: 4,
          repetitions_expected: '8-12',
          load_suggested: '50kg',
          observations: 'Priorizar a técnica, cadência controlada.',
          order_index: 1,
          modifier_ids: [2], // Work Set
        },
        {
          id: 2,
          exercise_id: 3, // Remada Curvada
          series_count: 3,
          repetitions_expected: '10-15',
          load_suggested: '30kg',
          observations: 'Contração máxima no topo do movimento.',
          order_index: 2,
          modifier_ids: [2], // Work Set
        },
      ],
    },
    {
      id: 2,
      name: 'Plano de Força - Maria',
      description: 'Foco em aumento de força máxima para a aluna Maria.',
      instructor_id: 2, // Instrutor Flávio
      student_id: 4, // Aluno Maria
      start_date: '2024-05-15',
      end_date: '2024-08-15',
      created_at: new Date('2024-05-10'),
      updated_at: new Date('2024-05-10'),
      items: [
        {
          id: 3,
          exercise_id: 2, // Agachamento Livre
          series_count: 5,
          repetitions_expected: '3-5',
          load_suggested: '80kg',
          observations: 'Progressão de carga semanal, falha assistida na última série.',
          order_index: 1,
          modifier_ids: [1, 2], // Warm Up Set, Work Set
        },
      ],
    },
  ],
  sessions: [
    {
      id: 1,
      student_id: 3, // Aluno João
      workout_plan_id: 1, // Plano de Hipertrofia - João
      session_date: '2024-05-01',
      observations: 'Treino de peito e costas conforme plano.',
      created_at: new Date('2024-05-01T10:00:00Z'),
      updated_at: new Date('2024-05-01T10:30:00Z'),
      executions: [
        {
          id: 1,
          exercise_id: 1, // Supino Reto com Barra
          series_completed: 4,
          repetitions_completed: '10,10,9,8',
          load_used: '45kg',
          observations: 'Última série com falha assistida.',
          modifier_ids: [2], // Work Set
          created_at: new Date('2024-05-01T10:05:00Z'),
          updated_at: new Date('2024-05-01T10:10:00Z'),
        },
        {
          id: 2,
          exercise_id: 3, // Remada Curvada
          series_completed: 3,
          repetitions_completed: '12,12,10',
          load_used: '25kg',
          observations: 'Boa conexão mente-músculo.',
          modifier_ids: [2], // Work Set
          created_at: new Date('2024-05-01T10:15:00Z'),
          updated_at: new Date('2024-05-01T10:20:00Z'),
        },
      ],
    },
    {
      id: 2,
      student_id: 4, // Aluno Maria
      workout_plan_id: 2, // Plano de Força - Maria
      session_date: '2024-05-16',
      observations: 'Treino de pernas pesado.',
      created_at: new Date('2024-05-16T15:00:00Z'),
      updated_at: new Date('2024-05-16T15:45:00Z'),
      executions: [
        {
          id: 3,
          exercise_id: 2, // Agachamento Livre
          series_completed: 5,
          repetitions_completed: '5,5,4,4,3',
          load_used: '75kg',
          observations: 'Senti a lombar na última série, reduzir peso na próxima.',
          modifier_ids: [1, 2], // Warm Up Set, Work Set
          created_at: new Date('2024-05-16T15:10:00Z'),
          updated_at: new Date('2024-05-16T15:25:00Z'),
        },
      ],
    },
  ],
};

const generateId = (entityName) => {
  const entities = database[entityName];
  if (!entities || entities.length === 0) {
    return 1;
  }
  const maxId = Math.max(...entities.map((entity) => entity.id));
  return maxId + 1;
};

export { database, generateId };
