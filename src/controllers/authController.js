const UserModel = require('../models/userModel');

class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        try {
            const { data: authData, error: authError } = await UserModel.signIn(email, password);

            if (authError) {
                console.error('Erro no login:', authError.message);
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            const user = authData.user;
            const session = authData.session;

            const { data: profileData, error: profileError } = await UserModel.getProfileById(user.id);

            if (profileError) {
                console.error('Erro ao buscar perfil:', profileError.message);
                return res.status(500).json({ message: 'Usuário autenticado, mas perfil não encontrado.' });
            }

            res.status(200).json({ 
                message: 'Login bem-sucedido!', 
                user: { 
                    id: user.id, 
                    username: profileData.full_name, 
                    email: user.email 
                }, 
                token: session.access_token
            });

        } catch (error) {
            console.error('Erro inesperado:', error.message);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }

    static healthCheck(req, res) {
        res.status(200).json({ status: 'ok', message: 'EcoRecycle Online!' });
    }
}

module.exports = AuthController;
