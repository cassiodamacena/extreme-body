import { hashPassword } from '../utils/passwordUtils.js';

// Hashes gerados com 'generateHashes.js'
const ADMIN_PASSWORD_HASH = '$2a$12$EXAMPLEHASHFORADMINPASSWORDHERE'; // COLOQUE O HASH GERADO PARA 'senhaAdmin123!'
const INSTRUTOR_PASSWORD_HASH = '$2a$12$EXAMPLEHASHFORINSTRUTORPASSWORDHERE'; // COLOQUE O HASH GERADO PARA 'senhaInstrutor123!'
const ALUNO_PASSWORD_HASH = '$2a$12$EXAMPLEHASHFORALUNOPASSWORDHERE'; // COLOQUE O HASH GERADO PARA 'senhaAluno123!'

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
  workoutPlans: [],
  sessions: [],
  executions: [],
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
