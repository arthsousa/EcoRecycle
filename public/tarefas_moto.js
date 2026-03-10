// Este script é executado DEPOIS de tarefas.js, então ele herda SUPABASE_URL, supabaseClient e outras funções

// ATENÇÃO: A variável 'currentUserId' é usada como global (definida em tarefas.js).

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Verifica se há um usuário logado
    const { data: { user } } = await supabaseClient.auth.getUser();

    // currentUserId JÁ existe globalmente
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.id; // Apenas atribui o valor
    
    // [CRÍTICO] EXIBE O NOME COMPLETO DO MOTORISTA NO HEADER
    const userNameElement = document.getElementById('userName');
    
    // 1. Busca o nome completo do perfil
    const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', currentUserId)
            .single();

    if (userNameElement && profileData && profileData.full_name) {
        userNameElement.textContent = profileData.full_name;
    } else if (userNameElement) {
        userNameElement.textContent = user.email;
    }

    // 2. Carrega e renderiza as tarefas (chamando a função especializada)
    await loadDriverTasks();
});


/**
 * Sobrescreve (substitui) a função de carregar tarefas para adicionar o filtro de motorista.
 */
async function loadDriverTasks() {
    if (!currentUserId) return; 

    try {
        // 1. Buscando o nome completo do motorista logado (necessário para o filtro)
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', currentUserId)
            .single();
        
        if (profileError || !profileData || !profileData.full_name) {
            console.error("Não foi possível carregar o nome do motorista para filtro:", profileError);
            document.getElementById('noTasksMessage').style.display = 'block';
            return;
        }

        const driverName = profileData.full_name;
        
        // 2. Buscando as tarefas onde o responsável é o motorista logado
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('responsible', driverName) // Filtra pelo nome do motorista
            .order('collectionDate', { ascending: true })
            .order('collectionTime', { ascending: true });

        if (error) {
            throw error;
        }
        
        window.tasks = data || [];
        
        renderTaskList(window.tasks); 
        
    } catch (error) {
        console.error("Erro ao carregar tarefas do motorista:", error.message);
    }
}


/**
 * Sobrescreve a função renderTaskList para incluir apenas as ações permitidas ao motorista.
 */
function renderTaskList(tasksToRender) {
    const listContainer = document.getElementById('taskList');
    const noTasksMessage = document.getElementById('noTasksMessage');
    listContainer.innerHTML = ''; 

    if (!tasksToRender || tasksToRender.length === 0) {
        noTasksMessage.style.display = 'block';
        return;
    }

    noTasksMessage.style.display = 'none';
    
    tasksToRender.forEach(task => {
        // Assume que as funções globais (getPriorityText, formatDate, etc.) estão em tarefas.js
        const priorityClass = window.getPriorityClass ? window.getPriorityClass(task.priority) : `priority-${task.priority}`;
        const priorityText = window.getPriorityText ? window.getPriorityText(task.priority) : task.priority;
        const formattedDate = window.formatDate(task.collectionDate);
        const formattedTime = task.collectionTime || 'N/D';
        const locationLabel = window.getLocationLabel(task.location);
        const regionLabel = window.getRegionLabel(task.region);
        const wasteLabel = window.wasteTypeLabels[task.wasteType] || task.wasteType;
        
        let statusClass, statusText;
        if (task.status === 'done') { statusClass = 'status-done'; statusText = 'Concluída'; } 
        else if (task.status === 'in-progress') { statusClass = 'status-in-progress'; statusText = 'Em Andamento'; } 
        else { statusClass = 'status-to-do'; statusText = 'Pendente'; }

        // Determina qual botão de ação mostrar com base no status atual
        let actionButtonHTML;
        if (task.status === 'to-do') {
            actionButtonHTML = `<button class="action-btn status-in-progress" onclick="markAsInProgress(${task.id})"><i class="fas fa-truck-loading"></i> Iniciar Coleta</button>`;
        } else if (task.status === 'in-progress') {
            actionButtonHTML = `<button class="action-btn status-done" onclick="markAsDone(${task.id})"><i class="fas fa-check-circle"></i> Concluir</button>`;
        } else {
            actionButtonHTML = `<span class="status-done" style="font-weight: bold;"><i class="fas fa-check-double"></i> Coleta Finalizada</span>`;
        }

        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${priorityClass}`;
        taskCard.innerHTML = `
            <div class="task-header">
                <span class="task-title">${task.name}</span>
                <span class="task-priority">${priorityText}</span>
            </div>
            <div class="task-details">
                <div><i class="fas fa-calendar-alt"></i> Data: ${formattedDate} - ${formattedTime}</div>
                <div><i class="fas fa-map-marker-alt"></i> Endereço: ${task.logradouro}, ${task.numero} - ${locationLabel} (${regionLabel})</div>
                <div><i class="fas fa-user"></i> Responsável: ${task.responsible}</div>
                <div><i class="fas fa-trash-alt"></i> Tipo de Lixo: ${wasteLabel}</div>
                <div><i class="fas fa-info-circle"></i> Status: <span class="${statusClass}" style="font-weight: bold;">${statusText}</span></div>
            </div>
            <div class="task-description">
                <i class="fas fa-align-left"></i> Descrição: ${task.description || 'Sem descrição.'}
            </div>
            <div class="task-actions">
                ${actionButtonHTML}
            </div>
        `;
        listContainer.appendChild(taskCard);
    });
}

// ==========================================================
// ===== NOVAS FUNÇÕES DE EXPORTAÇÃO E ROTA [ADICIONADAS] =====
// ==========================================================

/**
 * Filtra as tarefas do dia e abre a janela de impressão para salvar como PDF.
 */
function generateDailyTasksPDF() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const dailyTasks = window.tasks.filter(task => task.collectionDate === todayStr && task.status !== 'done');
    
    if (dailyTasks.length === 0) {
        alert("Não há tarefas pendentes para hoje para gerar o PDF.");
        return;
    }

    let pdfContent = `
        <div style="padding: 20px;">
            <h2 style="color:#34495e; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
                Relatório de Coletas do Dia (${window.formatDate(todayStr)})
            </h2>
            <p><strong>Motorista:</strong> ${document.getElementById('userName').textContent}</p>
            <p><strong>Total de Coletas:</strong> ${dailyTasks.length}</p>
            <br>
    `;
    
    dailyTasks.forEach((task, index) => {
        pdfContent += `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                <h3 style="color: #2ecc71; margin-bottom: 10px;">${index + 1}. ${task.name}</h3>
                <p><strong>Endereço:</strong> ${task.logradouro}, ${task.numero} - ${task.region} / ${task.location}</p>
                <p><strong>Hora Agendada:</strong> ${task.collectionTime || 'N/D'}</p>
                <p><strong>Tipo de Lixo:</strong> ${window.wasteTypeLabels[task.wasteType] || task.wasteType}</p>
                <p><strong>Prioridade:</strong> ${task.priority.toUpperCase()}</p>
            </div>
        `;
    });
    
    pdfContent += '</div>';

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Relatório Diário</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('@media print { @page { size: A4; margin: 1cm; } body { font-family: Arial, sans-serif; } h2 { color: #34495e; } }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(pdfContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.print();
}

/**
 * NOTA: Esta função é um placeholder para alertar sobre a necessidade da API de Rotas.
 */
function calculateOptimalRoute() {
    alert("⚠️ Integração de Rotas Pendente!\n\nPara calcular a rota ideal (otimizar paradas e economizar gasolina), precisamos integrar uma API de mapeamento externa (como Google Maps Directions API ou OSRM).");
}


/**
 * Função de logout
 */
async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    } else {
        console.error('Erro ao fazer logout:', error.message);
        alert('Erro ao sair. Tente novamente.');
    }
}

// Sobrescreve a função de aplicar filtros para usar a nova função de renderização
window.applyFilters = function() {
    // Captura os valores dos filtros
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value; 
    const dateStartFilter = document.getElementById('dateStartFilter').value; 
    const dateEndFilter = document.getElementById('dateEndFilter').value; 
    
    // Recarrega a lista base (apenas as tarefas do motorista logado)
    let filtered = window.tasks;

    // 1. Filtragem por Termo de Busca (Nome, CEP, Descrição)
    if (searchTerm) {
        filtered = filtered.filter(task => 
            (task.name && task.name.toLowerCase().includes(searchTerm)) ||
            (task.cep && task.cep.includes(searchTerm)) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }

    // 2. Filtragem por Status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // 3. Filtragem por Prioridade
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // 4. Filtragem por Data
    if (dateStartFilter) {
        filtered = filtered.filter(task => 
            task.collectionDate && task.collectionDate >= dateStartFilter
        );
    }

    if (dateEndFilter) {
        filtered = filtered.filter(task => 
            task.collectionDate && task.collectionDate <= dateEndFilter
        );
    }
    
    renderTaskList(filtered);
}


// Expõe funções globais (essenciais para os botões de status e exportação)
window.renderTaskList = renderTaskList; 
window.loadDriverTasks = loadDriverTasks;
window.handleLogout = handleLogout;
window.generateDailyTasksPDF = generateDailyTasksPDF;
window.calculateOptimalRoute = calculateOptimalRoute;