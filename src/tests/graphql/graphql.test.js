import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../utils/jwtUtils.js';

describe('GraphQL API Integration', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  it('should fetch all sessions via GraphQL for an Admin user', async () => {
    const adminUser = { id: 1, tipo: 'Admin' };
    const token = generateToken(adminUser);

    const graphqlQuery = {
      query: `
        query GetSessions {
          sessions {
            id
            student {
              nome_completo
            }
          }
        }
      `
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(graphqlQuery);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.sessions).toBeInstanceOf(Array);
    expect(response.body.data.sessions.length).toBeGreaterThan(0);
    expect(response.body.data.sessions[0].student.nome_completo).toBeDefined();
  });
});