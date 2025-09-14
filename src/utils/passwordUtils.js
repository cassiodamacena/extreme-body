import bcrypt from 'bcryptjs';

const HASH_SALT_ROUNDS = 12; // Número de rounds para o hashing, um valor seguro.

const hashPassword = async (password) => {
  return await bcrypt.hash(password, HASH_SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export { hashPassword, comparePassword };
