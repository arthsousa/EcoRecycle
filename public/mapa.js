const MAP_CONFIG = {
    // Coordenadas exatas da Av. Industrial, 493
    center: [-23.6503659, -46.5325493], 
    zoom: 10 // Aumentei um pouco o zoom para focar melhor na base
};

let map;

document.addEventListener('DOMContentLoaded', async () => {
    map = L.map('map').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    L.marker(MAP_CONFIG.center, {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
        })
    }).addTo(map).bindPopup("<b>Nossa empresa</b>");

    await carregarColetasNoMapa();
});

async function carregarColetasNoMapa() {
    const statusDiv = document.getElementById('map-status');
    
    try {
        const hoje = new Date().toISOString().split('T')[0];

        // Tenta buscar as tarefas
        const { data: tarefas, error } = await supabaseClient
            .from('tasks')
            .select('*'); // Buscamos tudo primeiro para testar

        if (error) throw error;

        // Filtro manual para evitar erro de nome de coluna no banco (CamelCase vs snake_case)
        const tarefasDeHoje = tarefas.filter(t => {
            const dataTarefa = t.collectionDate || t.collection_date; // Aceita os dois formatos
            return dataTarefa === hoje && t.status !== 'done';
        });

        if (tarefasDeHoje.length === 0) {
            statusDiv.innerHTML = "Nenhuma coleta pendente para hoje (" + hoje + ").";
            return;
        }

        statusDiv.innerHTML = `Localizadas <b>${tarefasDeHoje.length}</b> coletas para hoje.`;

        for (const tarefa of tarefasDeHoje) {
            // Pega os dados independente do nome da coluna ser camelCase ou snake_case
            const logradouro = tarefa.logradouro || tarefa.address;
            const numero = tarefa.numero || '';
            const cidade = tarefa.location || tarefa.city || 'Santo André';
            
            const enderecoCompleto = `${logradouro}, ${numero}, ${cidade}, SP`;
            await buscarCoordenadaEAdicionarPonto(tarefa, enderecoCompleto);
        }

    } catch (err) {
        console.error("Erro detalhado:", err);
        statusDiv.innerHTML = "Erro: " + err.message;
    }
}

async function buscarCoordenadaEAdicionarPonto(tarefa, endereco) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`;
        const response = await fetch(url);
        const results = await response.json();

        if (results && results.length > 0) {
            const { lat, lon } = results[0];
            const corPonto = tarefa.priority === 'high' ? '#e74c3c' : '#3498db';

            const marker = L.circleMarker([lat, lon], {
                radius: 10, fillColor: corPonto, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);

            const popupHtml = `
                <div style="font-family: sans-serif;">
                    <strong>${tarefa.name}</strong><br>
                    <small>${endereco}</small><br>
                    <hr>
                    <b>Motorista:</b> ${tarefa.responsible || 'S/N'}<br>
                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" 
                       target="_blank" style="display:block; margin-top:10px; text-align:center; background:#27ae60; color:white; padding:5px; border-radius:4px; text-decoration:none;">
                       Abrir no GPS
                    </a>
                </div>
            `;
            marker.bindPopup(popupHtml);
        }
    } catch (e) {
        console.warn("Endereço não encontrado:", endereco);
    }
}