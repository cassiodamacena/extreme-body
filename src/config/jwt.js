import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_if_not_set_in_env_but_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export { JWT_SECRET, JWT_EXPIRES_IN };
