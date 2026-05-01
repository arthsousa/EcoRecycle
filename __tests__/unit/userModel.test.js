const UserModel = require('../../src/models/userModel');
const supabase = require('../../src/config/supabase');

// Mock do Supabase
jest.mock('../../src/config/supabase', () => ({
    auth: {
        signInWithPassword: jest.fn()
    },
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                single: jest.fn()
            }))
        }))
    }))
}));

describe('UserModel', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('signIn deve chamar supabase.auth.signInWithPassword com os parâmetros corretos', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        
        supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

        await UserModel.signIn(email, password);

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: email,
            password: password
        });
    });

    test('getProfileById deve buscar o perfil correto no Supabase', async () => {
        const userId = '123';
        const mockProfile = { full_name: 'Test User' };

        // Configurar o mock encadeado
        const singleMock = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
        const eqMock = jest.fn(() => ({ single: singleMock }));
        const selectMock = jest.fn(() => ({ eq: eqMock }));
        supabase.from.mockReturnValue({ select: selectMock });

        const result = await UserModel.getProfileById(userId);

        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(selectMock).toHaveBeenCalledWith('full_name');
        expect(eqMock).toHaveBeenCalledWith('id', userId);
        expect(result.data).toEqual(mockProfile);
    });
});
