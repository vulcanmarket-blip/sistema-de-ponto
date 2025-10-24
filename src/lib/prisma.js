// CRIE OU SUBSTITUA este ficheiro em src/lib/prisma.js
//
// Este é o nosso "conector" do banco de dados (o 'singleton' do Prisma)
// para impedir que o app crie centenas de ligações ao banco de dados.

import { PrismaClient } from '@prisma/client';

// Declara o nosso 'cachedPrisma' global
let prisma;

// Verifica se já temos uma instância 'cached'
if (process.env.NODE_ENV === 'production') {
  // Na produção, crie uma nova instância
  prisma = new PrismaClient();
} else {
  // Em desenvolvimento, reutilize a instância 'cached' para não esgotar as ligações
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

// Exporta a instância única do Prisma
export default prisma;
