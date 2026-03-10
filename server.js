
// ---- FIM DO PATCH ----

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

// VARIÁVEIS DO PROJETO NOVO
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('Cliente Supabase inicializado com Patch para Node 16.');

// Rota de login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            console.error('Erro no login:', authError.message);
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = authData.user;
        const session = authData.session;

        // BUSCAR full_name (Ajustado para bater com o banco que restauramos)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name') // Mudamos de 'username' para 'full_name'
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Erro ao buscar perfil:', profileError.message);
            return res.status(500).json({ message: 'Usuário autenticado, mas perfil não encontrado.' });
        }

        res.status(200).json({ 
            message: 'Login bem-sucedido!', 
            user: { 
                id: user.id, 
                username: profileData.full_name, // Enviamos o full_name como username para o front-end
                email: user.email 
            }, 
            token: session.access_token
        });

    } catch (error) {
        console.error('Erro inesperado:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'EcoRecycle Online!' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});