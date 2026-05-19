// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SENHA_MESTRA_ADM = "EcoAdmin2025!";

// --- ELEMENTOS DO DOM ---
const logoutButton = document.getElementById('logoutButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const btnExportarPDF = document.getElementById('btnExportarPDF');
const body = document.body;

// Modal de Resíduos
const btnGerenciarResiduos = document.getElementById('btnGerenciarResiduos');
const wasteModal = document.getElementById('wasteModal');
const closeWasteModal = document.getElementById('closeWasteModal');
const formAddWaste = document.getElementById('formAddWaste');
const newWasteInput = document.getElementById('newWasteInput');
const wasteListContainer = document.getElementById('wasteListContainer');

// Modal de Registro
const btnAbrirRegistro = document.getElementById('btnAbrirRegistro');
const registerModal = document.getElementById('registerModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const adminCodeInput = document.getElementById('adminCode');
const registerButton = document.getElementById('registerButton');
const registerErrorMessage = document.getElementById('register-error-message');
const userListContainer = document.getElementById('userListContainer');

// Modal de Edição de Conta
const btnEditarConta = document.getElementById('btnEditarConta');
const editAccountModal = document.getElementById('editAccountModal');
const closeEditModal = document.getElementById('closeEditModal');
const editAccountForm = document.getElementById('editAccountForm');
const editNameInput = document.getElementById('editName');
const editPasswordInput = document.getElementById('editPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const saveAccountButton = document.getElementById('saveAccountButton');
const editErrorMessage = document.getElementById('edit-error-message');


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', initializeConfigScreen);

function initializeConfigScreen() {
    loadDarkModePreference();
    
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleDarkMode);
    if (btnExportarPDF) btnExportarPDF.addEventListener('click', handleExportarRelatorioPDF);

    // Listeners do Modal de Resíduos
    if (btnGerenciarResiduos) btnGerenciarResiduos.addEventListener('click', openWasteModal);
    if (closeWasteModal) closeWasteModal.addEventListener('click', () => closeModalView(wasteModal));
    if (formAddWaste) formAddWaste.addEventListener('submit', handleAddWaste);

    // Listeners do Modal de Registro
    if (btnAbrirRegistro) btnAbrirRegistro.addEventListener('click', openRegisterModalView);
    if (closeRegisterModal) closeRegisterModal.addEventListener('click', () => {
        closeModalView(registerModal);
        if (registerForm) registerForm.reset();
        registerErrorMessage.style.display = 'none';
    });
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

    // Listeners do Modal de Edição de Conta
    if (btnEditarConta) btnEditarConta.addEventListener('click', openEditAccountModalView);
    if (closeEditModal) closeEditModal.addEventListener('click', () => {
        closeModalView(editAccountModal);
        editErrorMessage.style.display = 'none';
    });
    if (editAccountForm) editAccountForm.addEventListener('submit', handleEditAccountSubmit);

    // Fechar modais ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === wasteModal) closeModalView(wasteModal);
        if (e.target === editAccountModal) closeModalView(editAccountModal);
        if (e.target === registerModal) {
            closeModalView(registerModal);
            if (registerForm) registerForm.reset();
        }
    });
}

function closeModalView(targetModal) {
    if (targetModal) targetModal.classList.remove('active');
}

// --- FUNÇÕES MODO ESCURO ---
function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function toggleDarkMode() {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// --- LÓGICA DE EDIÇÃO DA CONTA OPERACIONAL ---
async function openEditAccountModalView() {
    if (editAccountModal) editAccountModal.classList.add('active');
    if (editErrorMessage) editErrorMessage.style.display = 'none';
    if (editPasswordInput) editPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;

        if (user && user.user_metadata && editNameInput) {
            editNameInput.value = user.user_metadata.full_name || '';
        }
    } catch (err) {
        console.error("Erro ao puxar sessão do usuário:", err.message);
    }
}

async function handleEditAccountSubmit(e) {
    e.preventDefault();
    if (editErrorMessage) editErrorMessage.style.display = 'none';

    const novoNome = editNameInput.value.trim();
    const novaSenha = editPasswordInput.value.trim();
    const confirmaSenha = confirmPasswordInput.value.trim();

    if (novaSenha.length > 0 || confirmaSenha.length > 0) {
        if (novaSenha !== confirmaSenha) {
            showEditError("As senhas digitadas não são iguais.");
            return;
        }
        if (novaSenha.length < 6) {
            showEditError("A nova senha deve possuir ao menos 6 dígitos.");
            return;
        }
    }

    if (saveAccountButton) {
        saveAccountButton.disabled = true;
        saveAccountButton.textContent = 'Salvando...';
    }

    const updateData = {
        data: { full_name: novoNome }
    };

    if (novaSenha.length > 0) {
        updateData.password = novaSenha;
    }

    try {
        const { data, error } = await supabaseClient.auth.updateUser(updateData);
        if (error) throw error;

        alert("Conta updated com sucesso!");
        closeModalView(editAccountModal);
        if (editAccountForm) editAccountForm.reset();

    } catch (err) {
        console.error("Erro ao processar atualização:", err.message);
        showEditError("Erro técnico ao atualizar credenciais.");
    } finally {
        resetSaveButtonState();
    }
}

function showEditError(msg) {
    if (editErrorMessage) {
        editErrorMessage.textContent = msg;
        editErrorMessage.style.display = 'block';
    }
}

function resetSaveButtonState() {
    if (saveAccountButton) {
        saveAccountButton.disabled = false;
        saveAccountButton.textContent = 'Salvar Alterações';
    }
}


// --- GERENCIAMENTO DE USUÁRIOS (CADASTRO / LISTA) ---
async function openRegisterModalView() {
    if (registerModal) registerModal.classList.add('active');
    await loadSystemUsers();
}

async function loadSystemUsers() {
    if (!userListContainer) return;
    userListContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: #777;"><i class="fas fa-spinner fa-spin"></i> Atualizando...</div>';
    try {
        const { data, error } = await supabaseClient.from('profiles').select('id, full_name, role').order('full_name', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
            userListContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #777;">Nenhum usuário cadastrado.</div>';
            return;
        }
        userListContainer.innerHTML = data.map(user => {
            const roleColor = user.role === 'admin' ? 'background-color: #27ae6022; color: #27ae60;' : 'background-color: #3498db22; color: #3498db;';
            return `
                <div class="list-item-row">
                    <div>
                        <strong>${user.full_name}</strong>
                        <span class="user-meta-role" style="${roleColor}">${user.role}</span>
                    </div>
                    <button class="btn-delete-row" onclick="deleteSystemUser('${user.id}', '${user.full_name}')"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
        }).join('');
    } catch (err) {
        userListContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: #e74c3c;">Erro ao carregar funcionários.</div>';
    }
}

window.deleteSystemUser = async function(id, name) {
    if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;
    try {
        const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
        if (error) throw error;
        await loadSystemUsers();
    } catch (err) {
        alert('Não foi possível remover este usuário.');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    if (registerErrorMessage) registerErrorMessage.style.display = 'none';
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const adminCode = adminCodeInput.value.trim();
    
    if (password.length < 6) {
        registerErrorMessage.textContent = "A senha deve ter pelo menos 6 caracteres.";
        registerErrorMessage.style.display = 'block';
        return;
    }
    
    if (registerButton) { registerButton.disabled = true; registerButton.textContent = 'Criando...'; }
    let userRole = 'motorista';
    
    if (adminCode.length > 0) {
        if (adminCode === SENHA_MESTRA_ADM) {
            userRole = 'admin';
        } else {
            registerErrorMessage.textContent = "Código de Administrador incorreto.";
            registerErrorMessage.style.display = 'block';
            if (registerButton) { registerButton.disabled = false; registerButton.textContent = 'Criar Conta'; }
            return; 
        }
    }

    try {
        const { error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name, role: userRole } }
        });
        if (error) throw error;
        alert(`Sucesso! Nova conta de ${userRole.toUpperCase()} registrada.`);
        registerForm.reset();
        await loadSystemUsers();
    } catch (error) {
        registerErrorMessage.textContent = "Erro ao criar conta ou e-mail duplicado.";
        registerErrorMessage.style.display = 'block';
    } finally {
        if (registerButton) { registerButton.disabled = false; registerButton.textContent = 'Criar Conta'; }
    }
}

// --- GERENCIAMENTO DE TIPOS DE RESÍDUOS ---
async function openWasteModal() {
    if (wasteModal) wasteModal.classList.add('active');
    await loadWasteTypes();
}

async function loadWasteTypes() {
    if (!wasteListContainer) return;
    wasteListContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: #777;"><i class="fas fa-spinner fa-spin"></i> Atualizando...</div>';
    try {
        const { data, error } = await supabaseClient.from('waste_types').select('*').order('label', { ascending: true });
        if (error) throw error;
        wasteListContainer.innerHTML = data.map(item => `
            <div class="waste-item">
                <span>${item.label}</span>
                <button class="btn-delete-waste" onclick="deleteWasteType('${item.id}', '${item.label}')"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');
    } catch (err) {
        wasteListContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: #e74c3c;">Erro ao carregar lista.</div>';
    }
}

async function handleAddWaste(e) {
    e.preventDefault();
    const novoNome = newWasteInput.value.trim();
    if (!novoNome) return;
    const novoValue = novoNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    try {
        const { error } = await supabaseClient.from('waste_types').insert([{ value: novoValue, label: novoNome }]);
        if (error) throw error;
        newWasteInput.value = '';
        await loadWasteTypes();
    } catch (err) {
        alert('Erro ao cadastrar. O material já pode existir.');
    }
}

window.deleteWasteType = async function(id, label) {
    if (!confirm(`Deseja remover "${label}"?`)) return;
    try {
        const { error } = await supabaseClient.from('waste_types').delete().eq('id', id);
        if (error) throw error;
        await loadWasteTypes();
    } catch (err) {
        alert('Não foi possível remover este material.');
    }
}

// --- FUNÇÃO EXPORTAR RELATÓRIO DO DASHBOARD (PDF - ATUALIZADO) ---
async function handleExportarRelatorioPDF() {
    const htmlOriginal = btnExportarPDF.innerHTML;
    btnExportarPDF.disabled = true;
    btnExportarPDF.innerHTML = `
        <div><i class="fas fa-spinner fa-spin"></i> Gerando Relatório...</div>
        <i class="fas fa-chevron-right"></i>
    `;

    try {
        const hojeStr = new Date().toISOString().split('T')[0];
        const dataFormatada = new Date().toLocaleDateString('pt-BR');

        const { data: tarefas, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('collectionDate', hojeStr);

        if (error) throw error;

        if (!tarefas || tarefas.length === 0) {
            alert(`Não existem coletas agendadas para o dia de hoje (${dataFormatada}).`);
            btnExportarPDF.disabled = false;
            btnExportarPDF.innerHTML = htmlOriginal;
            return;
        }

        const totalColetas = tarefas.length;
        const concluidas = tarefas.filter(t => t.status === 'done').length;
        const emAndamento = tarefas.filter(t => t.status === 'in-progress').length;
        const pesoTotal = tarefas.reduce((acc, t) => acc + (Number(t.weight) || 0), 0);
        const taxaEficienciaTexto = totalColetas > 0 ? Math.round((concluidas / totalColetas) * 100) + '%' : '0%';

        const relatorioHTML = document.createElement('div');
        relatorioHTML.style.padding = '40px';
        relatorioHTML.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
        relatorioHTML.style.color = '#333';
        relatorioHTML.style.backgroundColor = '#fff';

        relatorioHTML.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2d5a3d; padding-bottom: 20px; margin-bottom: 30px;">
                <div>
                    <h1 style="color: #2d5a3d; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">Terra Reciclagem</h1>
                    <p style="color: #666; margin: 4px 0 0 0; font-size: 13px;">Sistema de Gestão e Logística de Resíduos Eletrônicos</p>
                </div>
                <div style="text-align: right;">
                    <span style="background-color: #2d5a3d; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Relatório Diário</span>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #444;"><strong>Data:</strong> ${dataFormatada}</p>
                </div>
            </div>

            <h3 style="color: #1e3d2a; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-left: 4px solid #2d5a3d; padding-left: 8px;">1. Desempenho Operacional</h3>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #2c3e50;">${totalColetas}</div>
                    <div style="font-size: 11px; color: #7f8c8d; text-transform: uppercase; margin-top: 5px;">Total Rotas</div>
                </div>
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #27ae60;">${concluidas}</div>
                    <div style="font-size: 11px; color: #27ae60; text-transform: uppercase; margin-top: 5px;">Concluídas</div>
                </div>
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #e67e22;">${emAndamento}</div>
                    <div style="font-size: 11px; color: #e67e22; text-transform: uppercase; margin-top: 5px;">Em Rota</div>
                </div>
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #27ae60;">${pesoTotal.toFixed(1)} kg</div>
                    <div style="font-size: 11px; color: #7f8c8d; text-transform: uppercase; margin-top: 5px;">Massa Coletada</div>
                </div>
            </div>

            <div style="background: #f1f3f5; border-radius: 6px; padding: 12px 15px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 13px; font-weight: bold; color: #495057;">Eficiência de Conclusão do Dia:</span>
                <div style="flex-grow: 1; background: #dee2e6; height: 10px; border-radius: 5px; margin: 0 15px; position: relative; overflow: hidden;">
                    <div style="background: #2d5a3d; width: ${taxaEficienciaTexto}; height: 100%; border-radius: 5px;"></div>
                </div>
                <span style="font-size: 14px; font-weight: bold; color: #2d5a3d;">${taxaEficienciaTexto}</span>
            </div>

            <h3 style="color: #1e3d2a; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-left: 4px solid #2d5a3d; padding-left: 8px;">2. Detalhamento Cronológico das Rotas</h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #2d5a3d; color: white;">
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Horário</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Cliente / Empresa</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Endereço de Recolhimento</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Tipo Resíduo</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Peso</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d;">Responsável</th>
                        <th style="padding: 10px; border: 1px solid #2d5a3d; text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tarefas.map((t, idx) => {
                        const materialFormatado = (window.wasteTypeLabels && window.wasteTypeLabels[t.wasteType]) || t.wasteType || 'Outros';
                        const pesoItem = t.weight ? `${Number(t.weight).toFixed(1)} kg` : 'N/D';
                        
                        let statusBadgeColor = '#f8f9fa';
                        let statusTextColor = '#495057';
                        let statusLabelText = 'Pendente';
                        
                        if (t.status === 'done') {
                            statusBadgeColor = '#d5f4e6';
                            statusTextColor = '#196f3d';
                            statusLabelText = 'Concluído';
                        } else if (t.status === 'in-progress') {
                            statusBadgeColor = '#fdeaa7';
                            statusTextColor = '#b57407';
                            statusLabelText = 'Em Rota';
                        }

                        return `
                            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">${t.collectionTime || 'N/D'}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">${t.name}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; color: #495057; line-height: 1.3;">${t.logradouro}, ${t.numero}<br><span style="font-size: 10px; color: #868e96;">${t.region}</span></td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; color: #495057;">${materialFormatado}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; color: #2d5a3d;">${pesoItem}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; color: #495057;">${t.responsible || 'Não Alocado'}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background-color: ${statusBadgeColor}; color: ${statusTextColor};">
                                        ${statusLabelText}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 50px; padding-top: 15px; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #868e96;">
                <div>EcoRecycle Smart Logística — Relatório Gerencial de Rastreabilidade Ambiental.</div>
                <div style="text-align: right; font-weight: bold;">Emitido via Painel de Controle por Admin.</div>
            </div>
        `;

        const opcoesConfig = {
            margin:       12,
            filename:     `EcoRecycle_Inventario_Diario_${hojeStr}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await window.html2pdf().set(opcoesConfig).from(relatorioHTML).save();

    } catch (err) {
        console.error('Erro na compilação do relatório avançado:', err);
        alert('Erro ao conectar com o Supabase para processar o inventário do PDF.');
    } finally {
        btnExportarPDF.disabled = false;
        btnExportarPDF.innerHTML = htmlOriginal;
    }
}

// --- FUNÇÃO LOGOUT ---
async function handleLogout() {
    if (logoutButton) { logoutButton.disabled = true; logoutButton.textContent = 'Saindo...'; }
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (e) {
        alert('Erro ao sair.');
    } finally {
        if (logoutButton) { logoutButton.disabled = false; logoutButton.textContent = 'Sair do Sistema'; }
    }
}