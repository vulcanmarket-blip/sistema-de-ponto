// CRIE OU SUBSTITUA este ficheiro em src/app/actions.js
//
// Este ficheiro contém todas as funções de backend que interagem com o banco de dados Neon.

'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const USER_ID_COOKIE = 'auth-user-id';

// --- Funções de Ajuda ---

// Função para buscar dados iniciais (departamentos e users) para a tela de login
export async function getInitialData() {
    try {
        const departamentos = await prisma.departamento.findMany({
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' },
        });

        const users = await prisma.user.findMany({
            select: { id: true, nome: true, departamentoId: true },
            orderBy: { nome: 'asc' },
        });

        return { departamentos, users, error: null };
    } catch (e) {
        console.error('Erro ao buscar dados iniciais:', e);
        return { departamentos: [], users: [], error: 'Erro ao conectar ao banco de dados.' };
    }
}

// Função para verificar se um User está logado via cookie
export async function getCurrentUser() {
    const userId = cookies().get(USER_ID_COOKIE)?.value;
    if (!userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, nome: true, cargo: true, password: true, departamentoId: true },
        });

        // Se o user existir e tiver a senha, ele está autenticado
        return user && user.password ? user : null;
    } catch (e) {
        console.error('Erro ao buscar usuário logado:', e);
        return null;
    }
}

// --- Funções de Autenticação ---

// 1. Lógica principal de Login/Primeiro Acesso
export async function handleLogin(data) {
    const { userId, password } = data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: 'Utilizador não encontrado.' };
        }

        if (!user.password) {
            // Primeiro acesso: pede para criar senha
            return { success: true, needsSetup: true };
        }

        // Login normal: verifica a senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { success: false, message: 'Senha incorreta.' };
        }

        // SUCESSO: Define o cookie e faz redirect
        cookies().set(USER_ID_COOKIE, user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 }); // 7 dias
        return { success: true, user: { nome: user.nome } };

    } catch (e) {
        console.error('Erro de login:', e);
        return { success: false, message: 'Erro interno do servidor.' };
    }
}

// 2. Lógica de Criação de Senha (Primeiro Acesso)
export async function handleSetupPassword(data) {
    const { userId, newPassword } = data;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
            select: { id: true, nome: true },
        });

        // SUCESSO: Define o cookie e faz redirect
        cookies().set(USER_ID_COOKIE, user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 }); // 7 dias
        return { success: true, user: { nome: user.nome } };

    } catch (e) {
        console.error('Erro de setup:', e);
        return { success: false, message: 'Erro ao configurar a senha.' };
    }
}

// 3. Logout
export async function handleLogout() {
    cookies().delete(USER_ID_COOKIE);
    redirect('/');
}

// --- Funções do Ponto (Time Tracking) ---

// Função para buscar os pontos do dia do usuário
export async function getTodayUserPoints(userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        const points = await prisma.ponto.findMany({
            where: {
                userId,
                horario: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            orderBy: { horario: 'asc' },
        });
        return points;
    } catch (e) {
        console.error('Erro ao buscar pontos do dia:', e);
        return [];
    }
}

// 4. Bater o Ponto (Check-in/Check-out)
export async function handleBaterPonto(data) {
    const { userId, tipo, relatorio } = data;

    try {
        await prisma.ponto.create({
            data: {
                userId,
                tipo,
                relatorio: relatorio || null,
            },
        });
        return { success: true };
    } catch (e) {
        console.error('Erro ao registrar ponto:', e);
        return { success: false, message: 'Falha ao registrar ponto.' };
    }
}
