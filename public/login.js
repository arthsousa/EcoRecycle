// [!] SUAS CHAVES DO SUPABASE AQUI [!]
// (Copiado do seu arquivo tarefas.js)
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';

// --- CONEXÃO SUPABASE ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.querySelector('.login-button');
const errorMessage = document.getElementById('error-message');

// --- EVENT LISTENER ---
if (loginForm) {
    // Adiciona o listener para o formulário de login
    loginForm.addEventListener('submit', handleLogin);
}

/**
 * Manipula o evento de submit do formulário de login, autenticando no Supabase.
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    setLoadingState(true);
    hideError();
    
    try {
        // Tenta fazer login com o Supabase Auth (método de email/senha)
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error; // Joga o erro para o bloco catch se as credenciais estiverem erradas
        }

        // Login bem-sucedido
        setLoadingState(false);
        
        // **REDIRECIONAMENTO BASEADO NA FUNÇÃO (ROLE)**
        const userRole = data.user.user_metadata.role;
        
        if (userRole === 'admin') {
            // Se for admin, vai para o dashboard principal
            window.location.href = 'dashboard.html';
        } else if (userRole === 'motorista') {
            // Se for motorista, vai para a tela de tarefas do motorista
            window.location.href = 'tarefas_moto.html';
        } else {
            // Fallback para qualquer outro caso
            window.location.href = 'tarefas.html';
        }

    } catch (error) {
        console.error('Erro no login:', error.message);
        // Exibe uma mensagem de erro amigável
        showError("Email ou senha inválidos. Tente novamente.");
        setLoadingState(false);
    }
}

// --- FUNÇÕES AUXILIARES ---

/**
 * Ativa ou desativa o estado de "carregando" do botão de login.
 */
function setLoadingState(isLoading) {
    if (loginButton) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.textContent = 'Entrando...';
            loginButton.classList.add('loading');
        } else {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
            loginButton.classList.remove('loading');
        }
    }
}

/**
 * Exibe uma mensagem de erro no formulário.
 */
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

/**
 * Oculta a mensagem de erro.
 */
function hideError() {
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
}