const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors'); // Importação de CORS
const path = require('path'); // Importação de PATH

// VARIÁVEIS DE AMBIENTE PARA O SUPABASE (Substitua pelos seus valores)
// É altamente recomendado usar variáveis de ambiente reais (process.env.SUPABASE_URL)
// Por enquanto, você deve substituir 'YOUR_SUPABASE_URL' e 'YOUR_ANON_KEY'
const SUPABASE_URL = 'https://ohxytrrafoczkdywmxit.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeHl0cnJhZm9jemtkeXdteGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjE4NDEsImV4cCI6MjA3ODEzNzg0MX0.v7vFMF0bqQcdIGv8O7avPYKQ8yZL0UMLKBCip2z4Clw';

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o banco de dados Supabase é feita através do cliente 'supabase'
// A lógica de criação de tabela e usuário de exemplo foi movida para o Supabase (SQL Editor)
console.log('Cliente Supabase inicializado. A lógica de banco de dados agora está no Supabase.');

// Rota de login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        // 1. LOGIN NO SUPABASE AUTH
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            // Trata erros de login (ex: credenciais inválidas)
            console.error('Erro no login do Supabase Auth:', authError.message);
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = authData.user;
        const session = authData.session;

        // 2. BUSCAR DADOS ADICIONAIS (USERNAME) NA TABELA PROFILES
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single(); // Espera um único resultado

        if (profileError) {
            console.error('Erro ao buscar perfil:', profileError.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao buscar perfil.' });
        }

        // 3. Sucesso
        // Retornamos o token de acesso (JWT) e os dados do usuário.
        res.status(200).json({ 
            message: 'Login bem-sucedido!', 
            user: { 
                id: user.id, 
                username: profileData.username, 
                email: user.email 
            }, 
            token: session.access_token // O token JWT do Supabase
        });

    } catch (error) {
        console.error('Erro inesperado no login:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota de saúde (health check)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Servidor EcoRecycle funcionando!' });
});

// Servir arquivos estáticos (index.html para a raiz)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


