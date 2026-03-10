// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const userNameInput = document.getElementById('userNameInput'); 
const editIcon = document.getElementById('editIcon'); 
const saveIcon = document.getElementById('saveIcon'); 
const userRoleElement = document.getElementById('userRole');
const userEmailElement = document.getElementById('userEmail'); 
const userPasswordInput = document.getElementById('userPassword'); 
const logoutButton = document.getElementById('logoutButton');

let currentUserName = ''; 

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', initializeAccountScreen);

if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

if (editIcon) {
    editIcon.addEventListener('click', () => toggleEditMode(true));
}

if (saveIcon) {
    saveIcon.addEventListener('click', handleSaveName);
    // CORREÇÃO: Previne que o input perca o foco (blur) quando o ícone de salvar é clicado.
    saveIcon.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
    });
}

if (userNameInput) {
    userNameInput.addEventListener('input', checkSaveState);
    userNameInput.addEventListener('blur', handleInputBlur);
}

// --- FUNÇÕES MODO ESCURO (NOVO) ---

/**
 * Carrega a preferência salva e aplica o modo escuro, se necessário.
 */
function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}


// --- FUNÇÕES ---

/**
 * Lida com a perda de foco do campo de nome, revertendo o estado de edição.
 */
function handleInputBlur() {
    if (!userNameInput.readOnly) {
        toggleEditMode(false); 
    }
}


/**
 * Inicializa a tela da conta, carregando os dados do usuário.
 */
async function initializeAccountScreen() {
    // 1. Aplica o Modo Escuro
    loadDarkModePreference(); 
    
    // 2. Carrega os dados do usuário (mantido)
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        const userMetadata = user.user_metadata || {};
        
        currentUserName = userMetadata.full_name || '';
        userNameInput.value = currentUserName;
        userNameInput.placeholder = 'Nome não definido';
        
        userRoleElement.textContent = formatRole(userMetadata.role); 
        userEmailElement.textContent = user.email;
        userPasswordInput.value = "••••••••"; 
    } else {
        alert('Sessão não encontrada ou expirada. Redirecionando para o login.');
        window.location.href = 'login.html';
    }
}

/**
 * Alterna o estado de edição do campo de nome e a visibilidade dos ícones.
 */
function toggleEditMode(enable) {
    userNameInput.readOnly = !enable; 
    editIcon.classList.toggle('hidden', enable); 
    saveIcon.classList.toggle('hidden', !enable); 

    if (enable) {
        userNameInput.focus(); 
        userNameInput.setSelectionRange(userNameInput.value.length, userNameInput.value.length);
        checkSaveState();
    } else {
        userNameInput.blur();
        userNameInput.value = currentUserName;
    }
}

/**
 * Verifica se o nome foi alterado e habilita/desabilita o ícone Salvar (Check).
 */
function checkSaveState() {
    const isChanged = userNameInput.value.trim() !== currentUserName;
    const isNotEmpty = userNameInput.value.trim().length > 0;
    
    const isDisabled = !(isChanged && isNotEmpty);
    saveIcon.classList.toggle('disabled', isDisabled);
}


/**
 * Lida com o salvamento do novo nome do usuário.
 */
async function handleSaveName() {
    // Mantido o e.preventDefault() no mousedown do listener
    
    if (saveIcon.classList.contains('disabled')) return;

    const newName = userNameInput.value.trim();
    
    saveIcon.classList.add('disabled', 'fa-spinner', 'fa-spin'); 
    saveIcon.classList.remove('fa-check');

    try {
        const { error } = await supabaseClient.auth.updateUser({ 
            data: { full_name: newName } 
        });

        if (error) {
            console.error('Erro ao salvar o nome:', error.message);
            alert('Erro ao salvar o nome. Tente novamente.');
        } else {
            currentUserName = newName; 
            alert('Nome atualizado com sucesso!');
            toggleEditMode(false); 
        }

    } catch (e) {
        console.error('Erro de execução ao salvar:', e);
        alert('Ocorreu um erro inesperado.');
    } finally {
        saveIcon.classList.remove('fa-spinner', 'fa-spin'); 
        if (userNameInput.readOnly === false) { 
            saveIcon.classList.add('fa-check');
            checkSaveState(); 
        } else {
             saveIcon.classList.add('fa-check'); 
        }
    }
}

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
        alert('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
        if (logoutButton && logoutButton.disabled) {
            logoutButton.disabled = false;
            logoutButton.textContent = 'Sair do Sistema';
        }
    }
}

/**
 * Função para formatar o texto da função para exibição.
 */
function formatRole(role) {
    if (!role) return 'Não especificada';
    return role.charAt(0).toUpperCase() + role.slice(1);
}