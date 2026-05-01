// [!] COLE SUAS CHAVES DO SUPABASE AQUI [!]
// (Copiado do seu arquivo tarefas.js)
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';

// [!] IMPORTANTE: DEFINA SUA SENHA MESTRA DE ADMINISTRAÇÃO AQUI [!]
const SENHA_MESTRA_ADM = "EcoAdmin2025!"; // <-- MUDE ISSO PARA ALGO SEGURO!

// --- CONEXÃO SUPABASE ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const adminCodeInput = document.getElementById('adminCode'); // Novo campo
const registerButton = document.getElementById('registerButton');
const errorMessage = document.getElementById('error-message');

// --- EVENT LISTENER ---
registerForm.addEventListener('submit', handleRegister);

async function handleRegister(event) {
    event.preventDefault();
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const adminCode = adminCodeInput.value.trim(); // Pega o valor do novo campo
    
    // Validação da senha
    if (password.length < 6) {
        showError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    
    setLoadingState(true);
    
    // --- Lógica de Permissão ---
    let userRole = 'motorista'; // Função padrão
    
    // Se o usuário digitou algo no campo de código ADM
    if (adminCode.length > 0) {
        if (adminCode === SENHA_MESTRA_ADM) {
            userRole = 'admin'; // Define a função como admin
        } else {
            // Se o código estiver errado, bloqueia o registro
            showError("Código de Administrador incorreto. O registro não foi concluído.");
            setLoadingState(false);
            return; 
        }
    }
    // Se o campo for deixado em branco, ele continua como 'motorista'
    // --------------------------

    try {
        // Usar o Supabase Auth para registrar o usuário
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                // Salvamos o nome e a FUNÇÃO (role) nos metadados do usuário
                data: { 
                    full_name: name,
                    role: userRole 
                }
            }
        });

        if (error) {
            throw error; // Cai no bloco catch
        }

        // Sucesso
        setLoadingState(false);
        alert(`Conta de ${userRole.toUpperCase()} criada com sucesso! Verifique seu email para confirmar a conta (se habilitado).`);
        
        // Redireciona para o login
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Erro no registro:', error.message);
        showError(getFriendlyErrorMessage(error.message));
        setLoadingState(false);
    }
}

// --- FUNÇÕES AUXILIARES ---

function setLoadingState(isLoading) {
    if (isLoading) {
        registerButton.disabled = true;
        registerButton.textContent = 'Criando...';
    } else {
        registerButton.disabled = false;
        registerButton.textContent = 'Criar Conta';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function getFriendlyErrorMessage(message) {
    if (message.includes("User already registered")) {
        return "Este email já está cadastrado.";
    }
    if (message.includes("Password should be at least 6 characters")) {
        return "A senha deve ter pelo menos 6 caracteres.";
    }
    return "Erro ao criar conta. Tente novamente.";
}