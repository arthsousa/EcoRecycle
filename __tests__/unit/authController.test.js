const AuthController = require('../../src/controllers/authController');
const UserModel = require('../../src/models/userModel');

jest.mock('../../src/models/userModel');

describe('AuthController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('login deve retornar 400 se email ou senha estiverem faltando', async () => {
        req.body = { email: 'test@example.com' }; // Falta a senha

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email e senha são obrigatórios.' });
    });

    test('login deve retornar 401 se as credenciais forem inválidas', async () => {
        req.body = { email: 'test@example.com', password: 'wrongpassword' };
        UserModel.signIn.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas.' });
    });

    test('login deve retornar 200 e dados do usuário em caso de sucesso', async () => {
        req.body = { email: 'test@example.com', password: 'password123' };
        
        const mockUser = { id: '123', email: 'test@example.com' };
        const mockSession = { access_token: 'token123' };
        const mockProfile = { full_name: 'Test User' };

        UserModel.signIn.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
        UserModel.getProfileById.mockResolvedValue({ data: mockProfile, error: null });

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login bem-sucedido!',
            user: {
                id: '123',
                username: 'Test User',
                email: 'test@example.com'
            },
            token: 'token123'
        });
    });

    test('healthCheck deve retornar 200 e status ok', () => {
        AuthController.healthCheck(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: 'ok', message: 'EcoRecycle Online!' });
    });
});
