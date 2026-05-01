const request = require('supertest');
const app = require('../../src/app');
const UserModel = require('../../src/models/userModel');

// Mock do UserModel para evitar chamadas reais ao Supabase durante testes de integração de rota
jest.mock('../../src/models/userModel');

describe('API Integration Tests', () => {
    
    describe('GET /api/health', () => {
        test('Deve retornar status 200 e mensagem de saúde', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'ok', message: 'EcoRecycle Online!' });
        });
    });

    describe('POST /api/login', () => {
        test('Deve retornar 400 se o corpo da requisição estiver incompleto', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com' });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email e senha são obrigatórios.');
        });

        test('Deve realizar login com sucesso e retornar 200', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            const mockSession = { access_token: 'valid_token' };
            const mockProfile = { full_name: 'Integration Test User' };

            UserModel.signIn.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
            UserModel.getProfileById.mockResolvedValue({ data: mockProfile, error: null });

            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login bem-sucedido!');
            expect(response.body.user.username).toBe('Integration Test User');
            expect(response.body.token).toBe('valid_token');
        });

        test('Deve retornar 401 para credenciais inválidas', async () => {
            UserModel.signIn.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } });

            const response = await request(app)
                .post('/api/login')
                .send({ email: 'wrong@example.com', password: 'wrong' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Credenciais inválidas.');
        });
    });

    describe('GET /', () => {
        test('Deve servir o arquivo index.html', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.type).toBe('text/html');
        });
    });
});
