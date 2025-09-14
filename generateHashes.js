import bcrypt from 'bcryptjs';

const passwords = {
  admin: 'senhaAdmin123!',
  instrutor: 'senhaInstrutor123!',
  aluno: 'senhaAluno123!'
};

const HASH_SALT_ROUNDS = 12;

async function generateAndLogHashes() {
  console.log('--- Gerando Hashes de Senhas ---');
  for (const [userType, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, HASH_SALT_ROUNDS);
    console.log(`${userType} (password: ${password}): ${hash}`);
  }
  console.log('--- Copie esses hashes para inMemoryDB.js ---');
}

generateAndLogHashes();