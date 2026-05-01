const request = require('supertest');
const app = require('../server'); // Precisaremos exportar o app no seu server.js

describe('Testes de Integração - Módulo de Tarefas', () => {
    
    // Teste para garantir que não salvamos tarefa sem usuário (Evita o erro 400/500)
    it('Deve retornar erro 400 se tentar criar tarefa sem user_id', async () => {
        const res = await request(app)
            .post('/api/tarefas')
            .send({
                name: "Teste de Carga",
                status: "to-do"
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });

    // Teste de sucesso (Integração real com Supabase)
    it('Deve criar uma nova tarefa com um ID válido', async () => {
        const res = await request(app)
            .post('/api/tarefas')
            .send({
                user_id: '9c36792d-8856-4b1e-ab62-8dabf4b238f8', // Use um ID que você sabe que existe
                name: "Tarefa de Teste Unitário",
                status: "to-do"
            });
        
        // Se o ID existir no banco, deve retornar 201
        // Se retornar 400/500, o teste vai falhar e te dizer o porquê
        expect(res.statusCode).toBe(201);
    });
});