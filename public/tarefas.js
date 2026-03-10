// [!] SUAS CHAVES AQUI [!]
const SUPABASE_URL = 'https://aaksglejprlixjqrbypj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3NnbGVqcHJsaXhqcXJieXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTg0NTYsImV4cCI6MjA4ODczNDQ1Nn0.EXYMtyQXhf0XN3gVZCx08ruJyTZHxD54sy13E4Eh0io';

// --- CONEXÃO SUPABASE ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- FIM CONEXÃO ---

// Variáveis globais
window.tasks = [];
let taskIdToDelete = null;
let currentUserId = null; 

// --- Constantes e Mapeamentos (MANTIDOS) ---
window.wasteTypeLabels = {
    "computadores": "Computadores", "celulares": "Celulares", "televisores": "Tvs",
    "eletrodomesticos": "Eletrodomésticos", "baterias": "Baterias", "cabos": "Cabos/Fios",
    "outros": "Outros"
};

window.priorityIcons = {
    "high": '<i class="fas fa-exclamation-circle" style="color: #ff5630;"></i>',
    "medium": '<i class="fas fa-minus-circle" style="color: #ffab00;"></i>',
    "low": '<i class="fas fa-check-circle" style="color: #00875a;"></i>'
};

window.locationLabels = { "santo-andre": "Santo André", "maua": "Mauá" };

window.regionsByLocation = {
    "santo-andre": [
        { value: "norte", label: "Região Norte" }, { value: "sul", label: "Região Sul" },
        { value: "leste", label: "Região Leste" }, { value: "oeste", label: "Região Oeste" }
    ],
    "maua": [
        { value: "vila-assis", label: "Vila Assis" }, { value: "jardim-zaira", label: "Jardim Zaira" },
        { value: "parque-sao-vicente", label: "Parque São Vicente" }, { value: "vila-magini", label: "Vila Magini" },
        { value: "jardim-maua", label: "Jardim Mauá" }, { value: "vila-bocaina", label: "Vila Bocaina" },
        { value: "parque-das-americas", label: "Parque das Américas" }, { value: "jardim-itapark", label: "Jardim Itapark" }
    ]
};
// --- FIM Constantes ---

// ==========================================================
// ===== FUNÇÕES CRÍTICAS DE UTILIDADE (RESOLVE REFERENCE ERRORS) =====
// ==========================================================

// --- FUNÇÕES DE LOGOUT (Deve estar no topo) ---
async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    } else {
        console.error('Erro ao fazer logout:', error.message);
        alert('Erro ao sair. Tente novamente.');
    }
}

// --- FUNÇÕES DE MODAL/CONFIRMAÇÃO (CHAMADAS DIRETAMENTE PELO HTML) ---
function openConfirmModal(taskId, taskName) {
    taskIdToDelete = taskId;
    const nameSpan = document.getElementById("taskToDeleteName");
    if (nameSpan) { nameSpan.textContent = taskName; }
    const confirmModal = document.getElementById("confirmDeleteModal");
    if(confirmModal) confirmModal.classList.add("active");
}

function closeConfirmModal() {
    taskIdToDelete = null;
    const confirmModal = document.getElementById("confirmDeleteModal");
    if(confirmModal) confirmModal.classList.remove("active");
}

function openTaskModal(isEditing = false) {
    if (taskModal) taskModal.classList.add("active");

    if (!isEditing && taskForm) {
        taskForm.reset();
        const today = new Date().toISOString().split("T")[0];
        const collectionDateEl = document.getElementById("collectionDate");
        if (collectionDateEl) collectionDateEl.value = today;
        const cepStatus = document.getElementById("cep-status");
        if (cepStatus) cepStatus.textContent = "";
        taskForm.removeAttribute("data-editing-id");
        const modalTitle = document.querySelector(".modal-header h3");
        if (modalTitle) { modalTitle.textContent = "Nova Tarefa - Coleta de Lixo Eletrônico"; }
    } else if (isEditing) {
        const modalTitle = document.querySelector(".modal-header h3");
        if (modalTitle) { modalTitle.textContent = "Editar Tarefa - Coleta de Lixo Eletrônico"; }
    }
}
    
function closeTaskModal() {
    if (taskModal) taskModal.classList.remove("active");
    const cepStatus = document.getElementById("cep-status");
    if (cepStatus) cepStatus.textContent = "";
}


// --- FUNÇÃO DE EDIÇÃO (CHAMADA PELO CREATE TASK CARD) ---
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById("taskId").value = task.id;
    document.getElementById("taskName").value = task.name;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("cep").value = task.cep || "";
    document.getElementById("logradouro").value = task.logradouro || "";
    document.getElementById("numero").value = task.numero || "";
    document.getElementById("taskRegion").value = task.region || "";
    document.getElementById("taskLocation").value = task.location || "";
    document.getElementById("wasteType").value = task.wasteType;
    document.getElementById("collectionDate").value = task.collectionDate;
    document.getElementById("collectionTime").value = task.collectionTime || "";
    document.getElementById("responsible").value = task.responsible;
    document.getElementById("vehicle").value = task.vehicle;
    document.getElementById("priority").value = task.priority;
    
    taskForm.setAttribute("data-editing-id", task.id.toString());
    openTaskModal(true);
}
// --- FIM FUNÇÕES CRÍTICAS MOVIDAS ---


// Variáveis de Estado de Filtro
let currentFilters = {
    priority: 'all', responsible: '', dueDate: '', status: 'all', dueStart: '', dueEnd: '',
    createdStart: '', createdEnd: '', wasteType: 'all', location: 'all', region: '',
    vehicle: 'all', cep: '', title: '', description: '', id: ''
};

// Elementos do DOM
let addTaskBtn, taskModal, closeModal, cancelBtn, taskForm;
let sidebarFiltersForm; 
let advFilterToggleBtn, advFilterPanel, advFilterApplyBtn, advFilterClearBtn;

// ==========================================================
// ===== LÓGICA DE INICIALIZAÇÃO E AUTENTICAÇÃO (MANTIDA) =====
// ==========================================================
document.addEventListener("DOMContentLoaded", async function() {
    
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = 'index.html'; 
        return;
    }
    
    currentUserId = user.id; 

    // Configurações Específicas da Página
    if (document.getElementById("tarefas-section")) {
        console.log("Inicializando página: Tarefas");
        initializeElements();
        setupEventListeners();
        await loadTasksFromStorage(); 
        await loadMotoristasProfiles(); 
        syncFilterInputs(); 
        renderSummary(); 
        renderTasks();
    }
    
    if (document.getElementById("dashboard-section")) {
        if (typeof initializePage_Dashboard === 'function') await initializePage_Dashboard();
    }

    if (document.getElementById("calendario-section")) {
        if (typeof initializePage_Calendario === 'function') await initializePage_Calendario();
    }
    
    if (document.getElementById("calendario-scheduler-section")) {
        if (typeof initializePage_CalendarioScheduler === 'function') await initializePage_CalendarioScheduler();
    }

    // Configura o botão de Logout (usando a função definida acima)
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout); 
    }

    // Exibir nome do usuário logado (Se o elemento existir no HTML)
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user.user_metadata.full_name) {
        userNameElement.textContent = user.user_metadata.full_name;
    } else if (userNameElement) {
        userNameElement.textContent = user.email;
    }
});

// Funções de inicialização específicas de cada página (MANTIDAS)
async function initializePage_Tarefas() {
    initializeElements();
    setupEventListeners();
    await loadTasksFromStorage(); 
    await loadMotoristasProfiles();
    syncFilterInputs(); 
    renderSummary(); 
    renderTasks();
}

async function initializePage_Dashboard() {
    if (typeof initializeElements_Dashboard === 'function') initializeElements_Dashboard();
    if (typeof setupEventListeners_Dashboard === 'function') setupEventListeners_Dashboard();
    await loadTasksFromStorage(); 
    if (typeof initializeDashboard === 'function') initializeDashboard();
}

async function initializePage_Calendario() {
    console.log("Função de inicialização do Calendário Padrão (TODO)");
}

async function initializePage_CalendarioScheduler() {
    console.log("Função de inicialização do Calendário Scheduler (TODO)");
}


// Funções de inicialização de elementos e eventos (Tarefas)
function initializeElements() {
    addTaskBtn = document.getElementById("addTaskBtn");
    taskModal = document.getElementById("taskModal");
    closeModal = document.getElementById("closeModal");
    cancelBtn = document.getElementById("cancelBtn");
    taskForm = document.getElementById("taskForm");
    sidebarFiltersForm = document.getElementById("advancedFiltersForm"); 
    advFilterToggleBtn = document.getElementById('advanced-filter-toggle');
    advFilterPanel = document.getElementById('advanced-filter-panel');
    advFilterApplyBtn = document.getElementById('adv-filter-apply');
    advFilterClearBtn = document.getElementById('adv-filter-clear');
}

function setupEventListeners() {
    if (addTaskBtn) addTaskBtn.addEventListener("click", () => openTaskModal(false));
    if (closeModal) closeModal.addEventListener("click", closeTaskModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeTaskModal);
    if (taskForm) taskForm.addEventListener("submit", handleTaskSubmit);
    
    // ... (Outros Event Listeners MANTIDOS)
    const confirmDeleteModal = document.getElementById("confirmDeleteModal");
    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener("click", function(e) {
            if (e.target === confirmDeleteModal) {
                closeConfirmModal();
            }
        });
    }

    const cepInput = document.getElementById("cep");
    if (cepInput) {
        cepInput.addEventListener("keyup", handleCepInput);
        cepInput.addEventListener("blur", handleCepInput);
    }
    
    if (sidebarFiltersForm) {
        sidebarFiltersForm.addEventListener("submit", applySidebarFilters);
    }
    if (advFilterToggleBtn) advFilterToggleBtn.addEventListener('click', toggleAdvancedFilterPanel);
    if (advFilterApplyBtn) advFilterApplyBtn.addEventListener('click', applyAdvancedFilters);
    if (advFilterClearBtn) advFilterClearBtn.addEventListener('click', clearAllFilters);
    if (advFilterPanel) {
        document.addEventListener('click', (e) => {
            if (advFilterPanel.classList.contains('active') && 
                !advFilterPanel.contains(e.target) && 
                !advFilterToggleBtn.contains(e.target)) {
                toggleAdvancedFilterPanel();
            }
        });
        advFilterPanel.addEventListener('click', (e) => { e.stopPropagation(); });
    }
}

// Funções do Modal (MANTIDAS)
function openTaskModal(isEditing = false) {
    if (taskModal) taskModal.classList.add("active");

    if (!isEditing && taskForm) {
        taskForm.reset();
        
        const today = new Date().toISOString().split("T")[0];
        const collectionDateEl = document.getElementById("collectionDate");
        if (collectionDateEl) collectionDateEl.value = today;
        
        const cepStatus = document.getElementById("cep-status");
        if (cepStatus) cepStatus.textContent = "";
        
        taskForm.removeAttribute("data-editing-id");
        
        const modalTitle = document.querySelector(".modal-header h3");
        if (modalTitle) {
            modalTitle.textContent = "Nova Tarefa - Coleta de Lixo Eletrônico";
        }
    } else if (isEditing) {
        const modalTitle = document.querySelector(".modal-header h3");
        if (modalTitle) {
            modalTitle.textContent = "Editar Tarefa - Coleta de Lixo Eletrônico";
        }
    }
}
    
function closeTaskModal() {
    if (taskModal) taskModal.classList.remove("active");
    const cepStatus = document.getElementById("cep-status");
    if (cepStatus) cepStatus.textContent = "";
}


// ==========================================================
// ===== FUNÇÕES API VIACEP (MANTIDAS) =====
// ==========================================================
function handleCepInput(e) {
    const cepInput = e.target;
    const cepStatus = document.getElementById("cep-status");
    let cep = cepInput.value.replace(/\D/g, '');

    if (cep.length > 5) {
        cepInput.value = cep.substring(0, 5) + '-' + cep.substring(5, 8);
    } else {
        cepInput.value = cep;
    }

    if (cep.length === 8) {
        cepStatus.textContent = "Buscando...";
        cepStatus.style.color = "#3498db";
        fetchCepData(cep);
    } else {
        cepStatus.textContent = "";
        if (cep.length === 0) {
            clearAddressFields();
        }
    }
}

async function fetchCepData(cep) {
    const cepStatus = document.getElementById("cep-status");
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado.');
        
        const data = await response.json();
        
        if (data.erro) {
            cepStatus.textContent = "CEP não localizado.";
            cepStatus.style.color = "#e74c3c";
            clearAddressFields();
        } else {
            cepStatus.textContent = "Endereço carregado!";
            cepStatus.style.color = "#2ecc71";
            setAddressFields(data);
            document.getElementById("numero").focus();
        }
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        cepStatus.textContent = "Erro ao buscar. Verifique a conexão.";
        cepStatus.style.color = "#e74c3c";
    }
}

function setAddressFields(data) {
    document.getElementById("logradouro").value = data.logradouro || "";
    document.getElementById("taskRegion").value = data.bairro || "";
    document.getElementById("taskLocation").value = data.localidade || "";
}

function clearAddressFields() {
    document.getElementById("logradouro").value = "";
    document.getElementById("taskRegion").value = "";
    document.getElementById("taskLocation").value = "";
}


// ==========================================================
// ===== FUNÇÕES DE POPULAMENTO (MOTORISTAS) [NOVO] =====
// ==========================================================

async function loadMotoristasProfiles() {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name, role')
        .eq('role', 'motorista')
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Erro ao carregar motoristas:", error.message);
        return [];
    }
    
    populateResponsibleSelect(data);
    return data.map(p => p.full_name);
}

function populateResponsibleSelect(motoristas) {
    const selectEl = document.getElementById('responsible');
    if (!selectEl) return;

    selectEl.innerHTML = '<option value="">Selecione um motorista</option>';

    motoristas.forEach(motorista => {
        const option = document.createElement('option');
        option.value = motorista.full_name;
        option.textContent = motorista.full_name;
        selectEl.appendChild(option);
    });
}


// ==========================================================
// ===== FUNÇÕES DE GERENCIAMENTO DE TAREFAS (BD) =====
// ==========================================================

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    if (!currentUserId) {
        alert("Erro de autenticação. Faça login novamente.");
        return;
    }
    
    const editingId = taskForm.getAttribute("data-editing-id");
    const formData = new FormData(taskForm);
    
    const taskData = {
        user_id: currentUserId, // CRÍTICO: ID do criador da tarefa
        name: formData.get("taskName"),
        description: formData.get("taskDescription") || "Sem descrição.",
        cep: formData.get("cep"),
        logradouro: formData.get("logradouro"),
        numero: formData.get("numero"),
        region: formData.get("taskRegion"),
        location: formData.get("taskLocation"),
        wasteType: formData.get("wasteType"),
        collectionDate: formData.get("collectionDate"),
        collectionTime: formData.get("collectionTime"),
        responsible: formData.get("responsible"), // LÊ DO SELECT POPULADO
        vehicle: formData.get("vehicle"),
        priority: formData.get("priority") || "medium",
    };

    let error;

    if (editingId) {
        // --- MODO DE EDIÇÃO (UPDATE) ---
        const currentTask = tasks.find(t => t.id == editingId);
        taskData.status = currentTask ? currentTask.status : 'to-do';

        const { error: updateError } = await supabaseClient
            .from('tasks')
            .update(taskData)
            .eq('id', editingId); 
        error = updateError;
    } else {
        // --- MODO DE CRIAÇÃO (INSERT) ---
        taskData.status = "to-do"; 
        const { error: insertError } = await supabaseClient
            .from('tasks')
            .insert([taskData]);
        error = insertError;
    }

    if (error) {
        console.error("Erro ao salvar:", error.message);
        alert("Erro ao salvar tarefa.");
        return;
    }
    
    await loadTasksFromStorage(); 
    
    renderSummary();
    renderTasks();
    closeTaskModal();
    taskForm.reset();
    
    const cepStatus = document.getElementById("cep-status");
    if (cepStatus) cepStatus.textContent = "";
}


async function changeTaskStatus(taskId, newStatus) {
    const { error } = await supabaseClient
        .from('tasks')
        .update({ status: newStatus }) 
        .eq('id', taskId); 

    if (error) {
        console.error("Erro ao mudar status:", error.message);
        alert("Erro ao atualizar status.");
        return; 
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        tasks[taskIndex].status = newStatus;
    }

    renderSummary();
    renderTasks();
    
    if (taskModal && taskModal.classList.contains('active')) {
        closeTaskModal();
    }
}

async function deleteTask() {
    if (taskIdToDelete !== null) {
        const { error } = await supabaseClient
            .from('tasks')
            .delete() 
            .eq('id', taskIdToDelete); 

        if (error) {
            console.error("Erro ao deletar:", error.message);
            alert("Erro ao deletar tarefa.");
        } else {
             tasks = tasks.filter(t => t.id !== taskIdToDelete);
        }
        
        renderSummary();
        renderTasks();
        closeConfirmModal();
    }
}

async function markAsInProgress(taskId) {
    await changeTaskStatus(taskId, "in-progress");
}

async function markAsDone(taskId) {
    await changeTaskStatus(taskId, "done");
}

async function markAsToDo(taskId) {
    await changeTaskStatus(taskId, "to-do");
}

// ==========================================================
// ===== FUNÇÕES DE FILTRO (MANTIDAS) =====
// ==========================================================

function filterTasks(task) {
    const filters = currentFilters;

    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
    }
    if (filters.responsible && filters.responsible.trim() !== '') {
        if (!task.responsible || !task.responsible.toLowerCase().includes(filters.responsible.toLowerCase().trim())) {
            return false;
        }
    }
    if (filters.dueDate && filters.dueDate.trim() !== '') {
        if (task.collectionDate > filters.dueDate) {
            return false;
        }
    }

    if (filters.status && filters.status !== 'all') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (filters.status === 'to-do') {
            if ( !(task.status === 'to-do' && task.collectionDate !== todayStr && task.collectionDate !== tomorrowStr) ) {
                return false;
            }
        }
        if (filters.status === 'today' && !( (task.status === 'to-do' && task.collectionDate === todayStr) || task.status === 'in-progress' )) {
            return false;
        }
        if (filters.status === 'tomorrow') {
            if ( !(task.status === 'to-do' && task.collectionDate === tomorrowStr) ) {
                return false;
            }
        }
        if (filters.status === 'done' && task.status !== 'done') {
            return false;
        }
    }
    
    if (filters.dueStart && task.collectionDate < filters.dueStart) return false;
    if (filters.dueEnd && task.collectionDate > filters.dueEnd) return false;
    if (filters.createdStart && task.createdAt.split('T')[0] < filters.createdStart) return false;
    if (filters.createdEnd && task.createdAt.split('T')[0] > filters.createdEnd) return false;
    
    if (filters.location && filters.location !== 'all') {
         // Lógica de filtro de localização (ainda pode precisar de ajuste)
    }
    
    if (filters.region && filters.region.trim() !== '') {
        if (!task.region || !task.region.toLowerCase().includes(filters.region.toLowerCase().trim())) {
            return false;
        }
    }
    
    if (filters.vehicle && filters.vehicle !== 'all' && task.vehicle !== filters.vehicle) return false;
    if (filters.cep && filters.cep.trim() !== '') {
        if (!task.cep || !task.cep.startsWith(filters.cep.trim())) {
            return false;
        }
    }
    if (filters.title && filters.title.trim() !== '') {
        if (!task.name || !task.name.toLowerCase().includes(filters.title.toLowerCase().trim())) {
            return false;
        }
    }
    if (filters.description && filters.description.trim() !== '') {
        if (!task.description || !task.description.toLowerCase().includes(filters.description.toLowerCase().trim())) {
            return false;
        }
    }
    if (filters.id && filters.id.trim() !== '') {
        if (!task.id.toString().includes(filters.id.trim())) {
            return false;
        }
    }
    return true;
}

function applySidebarFilters(e) {
    e.preventDefault();
    const formData = new FormData(sidebarFiltersForm);
    
    currentFilters.priority = formData.get("priority");
    currentFilters.responsible = formData.get("responsible");
    currentFilters.dueDate = formData.get("dueDate");
    currentFilters.dueEnd = currentFilters.dueDate;
    
    syncFilterInputs(); 
    renderTasks();
}

function applyAdvancedFilters() {
    currentFilters.status = document.getElementById('adv-filter-status').value;
    currentFilters.dueStart = document.getElementById('adv-filter-due-start').value;
    currentFilters.dueEnd = document.getElementById('adv-filter-due-end').value;
    currentFilters.createdStart = document.getElementById('adv-filter-created-start').value;
    currentFilters.createdEnd = document.getElementById('adv-filter-created-end').value;
    currentFilters.wasteType = document.getElementById('adv-filter-waste-type').value;
    currentFilters.location = document.getElementById('adv-filter-location').value;
    currentFilters.region = document.getElementById('adv-filter-region').value;
    currentFilters.vehicle = document.getElementById('adv-filter-vehicle').value;
    currentFilters.cep = document.getElementById('adv-filter-cep').value;
    currentFilters.title = document.getElementById('adv-filter-title').value;
    currentFilters.description = document.getElementById('adv-filter-desc').value;
    currentFilters.id = document.getElementById('adv-filter-id').value;
    
    currentFilters.priority = document.getElementById('adv-filter-priority').value;
    currentFilters.responsible = document.getElementById('adv-filter-responsible').value;
    currentFilters.dueDate = currentFilters.dueEnd; 
    
    syncFilterInputs(); 
    renderTasks();
    toggleAdvancedFilterPanel(); 
}

function clearAllFilters() {
    currentFilters = {
        priority: 'all',
        responsible: '',
        dueDate: '',
        status: 'all',
        dueStart: '',
        dueEnd: '',
        createdStart: '',
        createdEnd: '',
        wasteType: 'all',
        location: 'all',
        region: '',
        vehicle: 'all',
        cep: '',
        title: '',
        description: '',
        id: ''
    };
    
    syncFilterInputs(); 
    renderTasks();
}

function syncFilterInputs() {
    // Sidebar
    document.getElementById("filterPriority").value = currentFilters.priority;
    document.getElementById("filterResponsible").value = currentFilters.responsible;
    document.getElementById("filterDueDate").value = currentFilters.dueDate;

    // Dropdown
    document.getElementById('adv-filter-status').value = currentFilters.status;
    document.getElementById('adv-filter-due-start').value = currentFilters.dueStart;
    document.getElementById('adv-filter-due-end').value = currentFilters.dueEnd;
    document.getElementById('adv-filter-created-start').value = currentFilters.createdStart;
    document.getElementById('adv-filter-created-end').value = currentFilters.createdEnd;
    document.getElementById('adv-filter-waste-type').value = currentFilters.wasteType;
    document.getElementById('adv-filter-location').value = currentFilters.location;
    document.getElementById('adv-filter-region').value = currentFilters.region;
    document.getElementById('adv-filter-vehicle').value = currentFilters.vehicle;
    document.getElementById('adv-filter-cep').value = currentFilters.cep;
    document.getElementById('adv-filter-title').value = currentFilters.title;
    document.getElementById('adv-filter-desc').value = currentFilters.description;
    document.getElementById('adv-filter-id').value = currentFilters.id;
    document.getElementById('adv-filter-priority').value = currentFilters.priority;
    document.getElementById('adv-filter-responsible').value = currentFilters.responsible;
}

function toggleAdvancedFilterPanel(e) {
    if (e) e.stopPropagation(); 
    if (advFilterPanel && advFilterToggleBtn) {
        advFilterPanel.classList.toggle('active');
        advFilterToggleBtn.classList.toggle('active');
    }
}
// ===============================================
// ===== FIM DAS FUNÇÕES DE FILTRO =====
// ===============================================


// ==========================================================
// ===== FUNÇÕES DE RENDERIZAÇÃO (TAREFAS.HTML) =====
// ==========================================================

function renderTasks() {
    const toDoList = document.getElementById("to-do-tasks");
    const todayList = document.getElementById("today-tasks"); 
    const tomorrowList = document.getElementById("tomorrow-tasks"); 
    const doneList = document.getElementById("done-tasks");
    
    const toDoCountEl = document.getElementById("to-do-count");
    const todayCountEl = document.getElementById("today-count"); 
    const tomorrowCountEl = document.getElementById("tomorrow-count"); 
    const doneCountEl = document.getElementById("done-count");

    if (!toDoList || !todayList || !tomorrowList || !doneList) return; 

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    toDoList.innerHTML = "";
    todayList.innerHTML = "";
    tomorrowList.innerHTML = ""; 
    doneList.innerHTML = "";
    
    let countToDo = 0;
    let countToday = 0; 
    let countTomorrow = 0; 
    let countDone = 0;

    const filteredTasks = tasks.filter(filterTasks);
    const sortedTasks = filteredTasks.sort((a, b) => {
        const dateA = new Date(`${a.collectionDate}T${a.collectionTime || '00:00:00'}`);
        const dateB = new Date(`${b.collectionDate}T${b.collectionTime || '00:00:00'}`);
        return dateA - dateB;
    });

    sortedTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        
        if (task.status === "done") {
            doneList.appendChild(taskCard);
            countDone++;
        } else if (task.collectionDate === todayStr || task.status === "in-progress") {
            todayList.appendChild(taskCard);
            countToday++;
        } else if (task.collectionDate === tomorrowStr) {
            tomorrowList.appendChild(taskCard);
            countTomorrow++;
        } else {
            toDoList.appendChild(taskCard);
            countToDo++;
        }
    });

    if (toDoCountEl) toDoCountEl.textContent = countToDo;
    if (todayCountEl) todayCountEl.textContent = countToday;
    if (tomorrowCountEl) tomorrowCountEl.textContent = countTomorrow; 
    if (doneCountEl) doneCountEl.textContent = countDone;
}

function renderSummary() {
    const totalCountEl = document.getElementById("total-tasks-count");
    const doneCountEl = document.getElementById("done-tasks-count");
    const todayCountEl = document.getElementById("today-tasks-count"); 
    const tomorrowCountEl = document.getElementById("tomorrow-tasks-count"); 
    const toDoCountEl = document.getElementById("to-do-tasks-count");

    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todayButNotStarted = tasks.filter(t => t.status === 'to-do' && t.collectionDate === todayStr).length;
    const countToday = inProgress + todayButNotStarted;

    const countTomorrow = tasks.filter(t => t.status === 'to-do' && t.collectionDate === tomorrowStr).length;
    
    const toDo = tasks.filter(t => 
        t.status === 'to-do' && 
        t.collectionDate !== todayStr && 
        t.collectionDate !== tomorrowStr
    ).length;
    
    if (totalCountEl) totalCountEl.textContent = total;
    if (doneCountEl) doneCountEl.textContent = done;
    if (todayCountEl) todayCountEl.textContent = countToday; 
    if (tomorrowCountEl) tomorrowCountEl.textContent = countTomorrow; 
    if (toDoCountEl) toDoCountEl.textContent = toDo;
}

function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = `task-card priority-${task.priority}`;
    card.setAttribute("data-task-id", task.id);
    
    card.onclick = (e) => {
        if (e.target.closest('.task-actions') || e.target.closest('.btn-action')) return;
        editTask(task.id);
    }; 

    const wasteLabel = window.wasteTypeLabels[task.wasteType] || task.wasteType;
    const responsibleInitial = task.responsible ? task.responsible.charAt(0).toUpperCase() : '?';
    const priorityIcon = window.priorityIcons[task.priority] || '';
    const locationLabel = task.location || 'N/D';
    const regionLabel = task.region || 'N/D';
    const cepLabel = task.cep || 'N/D';
    
    let actionButtons = '';
    
    if (task.status === 'done') {
        actionButtons = `<button onclick="markAsToDo(${task.id})" class="btn-action btn-action-revert" title="Reverter para 'A Fazer'">
                            <i class="fas fa-undo"></i> Reverter
                        </button>`;
    } else {
        actionButtons = `<button onclick="markAsDone(${task.id})" class="btn-action btn-action-complete">
                            Concluir
                        </button>`;
    }

    card.innerHTML = `
        <h4 class="task-title">${task.name}</h4>
        <div class="task-meta">
            <div class="task-meta-item">
                ${priorityIcon}
            </div>
            <div class="task-meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${locationLabel} (${regionLabel})</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-inbox"></i>
                <span>${cepLabel}</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-recycle"></i> 
                <span>${wasteLabel}</span>
            </div>
        </div>
        <div class="task-footer">
            <div class="task-footer-left">
                <span class="task-date">
                    <i class="fas fa-calendar-alt"></i> ${window.formatDate(task.collectionDate)}
                </span>
                <div class="task-assignee" title="Responsável: ${task.responsible}">
                    ${responsibleInitial}
                </div>
            </div>
            <div class="task-actions">
                ${actionButtons}
                <button onclick="openConfirmModal(${task.id}, '${task.name.replace(/'/g, "\\'")}')" class="btn-action btn-action-delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}


// ==========================================================
// ===== FUNÇÕES AUXILIARES GLOBAIS =====
// ==========================================================

// [MUDANÇA] Adicionamos 'window.' para compartilhar
window.formatDate = function(dateString) {
    if (!dateString) return "N/D";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString; 
    return `${day}/${month}/${year}`;
}

// [MUDANÇA] Adicionamos 'window.' para compartilhar
window.getLocationLabel = function(locationKey) {
    return window.locationLabels[locationKey] || locationKey || 'N/D';
}

// [MUDANÇA] Adicionamos 'window.' para compartilhar
window.getRegionLabel = function(locationKey, regionKey) {
    if (locationKey && window.regionsByLocation[locationKey]) {
        const region = window.regionsByLocation[locationKey].find(r => r.value === regionKey);
        if (region) return region.label;
    }
    // Fallback para os dados do ViaCEP
    return regionKey || 'N/D';
}

// [MUDANÇA] Adicionamos 'window.' para compartilhar
window.calculateTimeRemaining = function(dateString, timeString) {
    const collectionDateTime = new Date(`${dateString}T${timeString || '00:00:00'}`);
    const now = new Date();
    const timeDiff = collectionDateTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
        return { text: "Prazo vencido", class: "urgent" };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeText = "";
    let timeClass = "normal";
    
    if (days > 0) {
        timeText = `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
        if (days <= 1) timeClass = "warning";
    } else if (hours > 0) {
        timeText = `${hours}h ${minutes}min restantes`;
        timeClass = hours <= 2 ? "urgent" : "warning";
    } else {
        timeText = `${minutes} min restantes`;
        timeClass = "urgent";
    }
    
    return {
        text: timeText,
        class: timeClass
    };
}

// [MUDANÇA] Adicionamos 'window.' para compartilhar
window.loadTasksFromStorage = async function() {
    console.log("Buscando tarefas no Supabase...");
    
    const { data, error } = await supabaseClient
        .from('tasks') 
        .select('*') 
        .order('"collectionDate"', { ascending: true }); // [CORREÇÃO] Usar aspas duplas

    if (error) {
        console.error("Erro ao buscar tarefas:", error.message);
        alert("Não foi possível carregar as tarefas. Verifique o console.");
        window.tasks = []; 
    } else {
        console.log("Tarefas carregadas:", data);
        window.tasks = data || []; 
        
        window.tasks.forEach(task => {
            if (task.status === 'aberto' || task.status === 'pendente') {
                task.status = 'to-do';
            } else if (task.status === 'concluido') {
                task.status = 'done';
            } else if (task.status === 'em-andamento') { 
                task.status = 'in-progress';
            }
            
            if (!['done', 'in-progress', 'to-do'].includes(task.status)) {
                task.status = 'to-do';
            }
            
            if (!task.priority) task.priority = 'medium';
            if (!task.description) task.description = 'Sem descrição.';
        });
    }
}


// ==========================================================
// ===== EXPOSIÇÃO DE FUNÇÕES GLOBAIS (Obrigatorio) =====
// ==========================================================

window.markAsInProgress = markAsInProgress;
window.markAsDone = markAsDone;
window.markAsToDo = markAsToDo;
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.closeTaskModal = closeTaskModal;
window.handleTaskSubmit = handleTaskSubmit;
window.openTaskModal = openTaskModal;
window.applySidebarFilters = applySidebarFilters; 
window.applyAdvancedFilters = applyAdvancedFilters; 
window.clearAllFilters = clearAllFilters;
window.handleLogout = handleLogout;
window.formatDate = window.formatDate;
window.getLocationLabel = window.getLocationLabel;
window.getRegionLabel = window.getRegionLabel;
window.calculateTimeRemaining = window.calculateTimeRemaining;