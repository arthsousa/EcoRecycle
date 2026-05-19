// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.querySelector('.login-button');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// Elementos da Alternância de Telas
const loginArea = document.getElementById('loginArea');
const recoverArea = document.getElementById('recoverArea');
const linkEsqueciSenha = document.getElementById('linkEsqueciSenha');
const linkVoltarLogin = document.getElementById('linkVoltarLogin');

// Elementos do Form de Recuperação
const recoverForm = document.getElementById('recoverForm');
const recoverEmailInput = document.getElementById('recoverEmail');
const recoverButton = document.getElementById('recoverButton');


// --- EVENT LISTENERS ---
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (recoverForm) recoverForm.addEventListener('submit', handleRecoverPassword);

// Alternar para tela de recuperar senha
if (linkEsqueciSenha) {
    linkEsqueciSenha.addEventListener('click', (e) => {
        e.preventDefault();
        hideFeedback();
        loginArea.style.display = 'none';
        recoverArea.style.display = 'block';
    });
}

// Alternar de volta para o login
if (linkVoltarLogin) {
    linkVoltarLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideFeedback();
        recoverArea.style.display = 'none';
        loginArea.style.display = 'block';
    });
}


/**
 * Executa o Login tradicional no Supabase Auth
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    setLoadingState(true, loginButton, 'Entrando...');
    hideFeedback();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        setLoadingState(false, loginButton, 'Entrar');
        const userRole = data.user.user_metadata.role;
        
        if (userRole === 'admin') {
            window.location.href = 'dashboard.html';
        } else if (userRole === 'motorista') {
            window.location.href = 'tarefas_moto.html';
        } else {
            window.location.href = 'tarefas.html';
        }

    } catch (error) {
        console.error('Erro no login:', error.message);
        showFeedback("Email ou senha inválidos. Tente novamente.", "error");
        setLoadingState(false, loginButton, 'Entrar');
    }
}

/**
 * Solicita o reset de senha ao Supabase Auth enviando e-mail de segurança
 */
async function handleRecoverPassword(event) {
    event.preventDefault();
    const email = recoverEmailInput.value.trim();

    setLoadingState(true, recoverButton, 'Enviando...');
    hideFeedback();

    try {
        // Envia o e-mail contendo o link de redirecionamento seguro
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/configuracoes.html', // Envia direto para a tela onde ele pode editar a conta
        });

        if (error) throw error;

        showFeedback("Link enviado! Verifique sua caixa de entrada e spam.", "success");
        recoverForm.reset();

    } catch (error) {
        console.error('Erro na recuperação:', error.message);
        showFeedback("Não foi possível enviar o e-mail de recuperação.", "error");
    } finally {
        setLoadingState(false, recoverButton, 'Enviar E-mail');
    }
}

// --- FUNÇÕES AUXILIARES ---

function setLoadingState(isLoading, buttonElement, textValue) {
    if (buttonElement) {
        buttonElement.disabled = isLoading;
        buttonElement.textContent = textValue;
    }
}

function showFeedback(message, type) {
    if (type === "error" && errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    } else if (type === "success" && successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
    }
}

function hideFeedback() {
    if (errorMessage) { errorMessage.textContent = ''; errorMessage.style.display = 'none'; }
    if (successMessage) { successMessage.textContent = ''; successMessage.style.display = 'none'; }
}