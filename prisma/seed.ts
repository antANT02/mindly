import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  StatusTarefa,
  QualidadeRevisao,
} from "../lib/generated/prisma";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed do MindLy...");

  // 1. Usuário curador principal das trilhas públicas
  const curador = await prisma.user.upsert({
    where: { email: "curadoria@mindly.app" },
    update: {},
    create: {
      name: "Carlos Manoel",
      email: "curadoria@mindly.app",
      emailVerified: true,
      role: "ADMIN",
    },
  });

  // 2. Disciplinas públicas de referência
  const disciplinasData = [
    {
      id: "disc-arquitetura-software",
      nome: "Arquitetura de Software & Sistemas Web",
      descricao:
        "Modelagem relacional, padrões de projeto, renderização híbrida no Next.js e segurança de sessões.",
      corHex: "#1E3A2F",
      metaHorasSem: 8,
      publica: true,
    },
    {
      id: "disc-calculo-algebra",
      nome: "Cálculo Diferencial e Álgebra Linear",
      descricao:
        "Limites, derivadas, transformações lineares e aplicações em computação gráfica e análise de algoritmos.",
      corHex: "#2C4C3B",
      metaHorasSem: 6,
      publica: true,
    },
    {
      id: "disc-harmonia-jazz",
      nome: "Harmonia Funcional & Improvisação",
      descricao:
        "Progressões II-V-I, dominantes secundários, substituição trítono, voice leading e transcrição de solos.",
      corHex: "#4A3B2C",
      metaHorasSem: 5,
      publica: true,
    },
    {
      id: "disc-filosofia-contemporanea",
      nome: "Filosofia Existencial & Teoria Crítica",
      descricao:
        "Leitura dirigida de textos fundamentais do século XIX e XX com fichamentos analíticos e revisão espaçada.",
      corHex: "#3A322C",
      metaHorasSem: 4,
      publica: true,
    },
  ];

  for (const disc of disciplinasData) {
    await prisma.disciplina.upsert({
      where: { id: disc.id },
      update: {
        nome: disc.nome,
        descricao: disc.descricao,
        corHex: disc.corHex,
        metaHorasSem: disc.metaHorasSem,
        publica: disc.publica,
      },
      create: {
        ...disc,
        userId: curador.id,
      },
    });
  }

  // 3. Tarefas com ciclos de Revisão Espaçada (SRS)
  const hoje = new Date();
  const emTresDias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);
  const emSeteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tarefasData = [
    {
      id: "tar-prisma-7-adapters",
      titulo: "Driver Adapters e Connection Pooling no Prisma 7",
      descricao:
        "Comparar conexões diretas vs pooler no Neon PostgreSQL e validar queries tipadas em Server Components.",
      estimativaMin: 45,
      status: StatusTarefa.CONCLUIDA,
      srsIntervalo: 7,
      proximaRevisao: emSeteDias,
      ultimaQualidade: QualidadeRevisao.FACIL,
      disciplinaId: "disc-arquitetura-software",
    },
    {
      id: "tar-auth-sessions-cookies",
      titulo: "Fluxo de Sessão HttpOnly e Proteção CSRF",
      descricao:
        "Revisar armazenamento de tokens na tabela Session e validação server-side em rotas protegidas.",
      estimativaMin: 35,
      status: StatusTarefa.EM_ANDAMENTO,
      srsIntervalo: 3,
      proximaRevisao: emTresDias,
      ultimaQualidade: QualidadeRevisao.BOM,
      disciplinaId: "disc-arquitetura-software",
    },
    {
      id: "tar-teorema-valor-medio",
      titulo: "Demonstração e Aplicações do Teorema do Valor Médio",
      descricao:
        "Resolver lista de 8 exercícios de taxas relacionadas e esboço de curvas com concavidade.",
      estimativaMin: 50,
      status: StatusTarefa.PENDENTE,
      srsIntervalo: 1,
      proximaRevisao: hoje,
      ultimaQualidade: null,
      disciplinaId: "disc-calculo-algebra",
    },
    {
      id: "tar-voice-leading-ii-v-i",
      titulo: "Condução de Vozes (3ª e 7ª) em II-V-I Menor",
      descricao:
        "Praticar encadeamentos em todas as 12 tonalidades sem saltos maiores que uma terça.",
      estimativaMin: 30,
      status: StatusTarefa.CONCLUIDA,
      srsIntervalo: 4,
      proximaRevisao: emTresDias,
      ultimaQualidade: QualidadeRevisao.BOM,
      disciplinaId: "disc-harmonia-jazz",
    },
    {
      id: "tar-fichamento-subsolo",
      titulo: "Fichamento Analítico: Memórias do Subsolo (Parte I)",
      descricao:
        "Mapear a crítica ao racionalismo determinista e sintetizar argumentos centrais.",
      estimativaMin: 40,
      status: StatusTarefa.PENDENTE,
      srsIntervalo: 1,
      proximaRevisao: hoje,
      ultimaQualidade: null,
      disciplinaId: "disc-filosofia-contemporanea",
    },
  ];

  for (const tarefa of tarefasData) {
    await prisma.tarefa.upsert({
      where: { id: tarefa.id },
      update: {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        estimativaMin: tarefa.estimativaMin,
        status: tarefa.status,
        srsIntervalo: tarefa.srsIntervalo,
        proximaRevisao: tarefa.proximaRevisao,
        ultimaQualidade: tarefa.ultimaQualidade,
      },
      create: {
        ...tarefa,
        userId: curador.id,
      },
    });
  }

  // 4. Metas e Sessões de Estudo concluídas
  await prisma.meta.upsert({
    where: { id: "meta-fullstack-semestre" },
    update: {},
    create: {
      id: "meta-fullstack-semestre",
      titulo: "Concluir Arquitetura Completa do MindLy",
      descricao: "Entregar autenticação, painel de estudo, SRS e modo foco.",
      horasAlvo: 40,
      horasAtuais: 18,
      disciplinaId: "disc-arquitetura-software",
      userId: curador.id,
    },
  });

  await prisma.sessaoEstudo.upsert({
    where: { id: "sessao-inicial-01" },
    update: {},
    create: {
      id: "sessao-inicial-01",
      modo: "POMODORO_50_10",
      duracaoMin: 50,
      anotacoesZen:
        "Configuração de migrations e validação de conexões pooled no Neon.",
      disciplinaId: "disc-arquitetura-software",
      userId: curador.id,
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });