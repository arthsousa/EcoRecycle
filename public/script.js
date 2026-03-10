// Configuração da API
const API_BASE_URL = ''; // Será definido pelo servidor Node.js

// Elementos do DOM
let loginForm;
let emailInput;
let passwordInput;
let loginButton;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
});

// Inicializar elementos do DOM
function initializeElements() {
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginButton = document.querySelector('.login-button');
}

// Configurar event listeners
function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Adicionar efeitos visuais aos campos
    if (emailInput) {
        emailInput.addEventListener('focus', handleInputFocus);
        emailInput.addEventListener('blur', handleInputBlur);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('focus', handleInputFocus);
        passwordInput.addEventListener('blur', handleInputBlur);
    }
}

// Manipular o evento de login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validações básicas
    if (!validateForm(email, password)) {
        return;
    }
    
    // Mostrar estado de loading
    setLoadingState(true);
    
    try {
        // Fazer a requisição para o backend
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login bem-sucedido
            handleLoginSuccess(data);
        } else {
            // Erro no login
            handleLoginError(data.message || 'Erro ao fazer login');
        }
        
    } catch (error) {
        console.error('Erro na requisição:', error);
        handleLoginError('Erro de conexão com o servidor');
    } finally {
        setLoadingState(false);
    }
}

// Validar formulário
function validateForm(email, password) {
    // Limpar mensagens de erro anteriores
    clearErrorMessages();
    
    let isValid = true;
    
    // Validar email
    if (!email) {
        showFieldError(emailInput, 'Email é obrigatório');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError(emailInput, 'Email inválido');
        isValid = false;
    }
    
    // Validar senha
    if (!password) {
        showFieldError(passwordInput, 'Senha é obrigatória');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(passwordInput, 'Senha deve ter pelo menos 6 caracteres');
        isValid = false;
    }
    
    return isValid;
}

// Verificar se email é válido
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar erro em campo específico
function showFieldError(field, message) {
    field.style.borderColor = '#e74c3c';
    field.style.backgroundColor = '#ffeaea';
    
    // Criar ou atualizar mensagem de erro
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = '#e74c3c';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '5px';
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

// Limpar mensagens de erro
function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    // Resetar estilos dos campos
    [emailInput, passwordInput].forEach(field => {
        if (field) {
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        }
    });
}

// Definir estado de loading
function setLoadingState(isLoading) {
    if (loginButton) {
        if (isLoading) {
            loginButton.classList.add('loading');
            loginButton.disabled = true;
            loginButton.textContent = 'Entrando...';
        } else {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
}

// Manipular sucesso no login
function handleLoginSuccess(data) {
    showSuccessMessage('Login realizado com sucesso!');
    
    // Salvar token se fornecido
    if (data.token) {
        localStorage.setItem('authToken', data.token);
    }
    
    // Redirecionar após 2 segundos
    setTimeout(() => {
        // Aqui você pode redirecionar para a página principal
        window.location.href = '/dashboard.html';
    }, 2000);
}

// Manipular erro no login
function handleLoginError(message) {
    showErrorMessage(message);
}

// Mostrar mensagem de sucesso
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// Mostrar mensagem de erro
function showErrorMessage(message) {
    showMessage(message, 'error');
}

// Mostrar mensagem genérica
function showMessage(message, type) {
    // Remover mensagem anterior se existir
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Estilos da mensagem
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '15px 20px';
    messageElement.style.borderRadius = '8px';
    messageElement.style.color = 'white';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.zIndex = '1000';
    messageElement.style.animation = 'slideIn 0.3s ease-out';
    
    if (type === 'success') {
        messageElement.style.backgroundColor = '#27ae60';
    } else {
        messageElement.style.backgroundColor = '#e74c3c';
    }
    
    // Adicionar ao DOM
    document.body.appendChild(messageElement);
    
    // Remover após 5 segundos
    setTimeout(() => {
        messageElement.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}

// Manipular foco nos campos
function handleInputFocus(event) {
    event.target.style.transform = 'translateY(-2px)';
}

// Manipular perda de foco nos campos
function handleInputBlur(event) {
    event.target.style.transform = '';
}

// Adicionar animações CSS via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Função para testar a conexão com o backend
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            console.log('Backend conectado com sucesso');
            return true;
        }
    } catch (error) {
        console.log('Backend não está disponível:', error.message);
        return false;
    }
}

// Testar conexão ao carregar a página
testBackendConnection();

