// --- CONFIGURAÇÃO SUPABASE (Para o Logout) ---
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const logoutButton = document.getElementById('logoutButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', initializeConfigScreen);

function initializeConfigScreen() {
    // 1. Carrega a preferência de Modo Escuro
    loadDarkModePreference();
    
    // 2. Adiciona o listener para o botão de Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // 3. Adiciona o listener para o Toggle do Modo Escuro
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
}

// --- FUNÇÕES MODO ESCURO ---

/**
 * Carrega a preferência salva e aplica o modo escuro, se necessário.
 */
function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }
}

/**
 * Alterna o modo escuro e salva a preferência no localStorage.
 */
function toggleDarkMode() {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
}


// --- FUNÇÃO LOGOUT (Copiada de conta.js) ---

/**
 * Lida com o processo de logout do usuário.
 */
async function handleLogout() {
    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = 'Saindo...';
    }

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error('Erro ao fazer logout:', error.message);
            alert('Erro ao sair. Tente novamente.');
        } else {
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error('Erro de rede/execução durante o logout:', e);
        alert('Ocorreu um erro inesperado.');
    } finally {
        if (logoutButton && logoutButton.disabled) {
            logoutButton.disabled = false;
            logoutButton.textContent = 'Sair do Sistema';
        }
    }
}