import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  StatusTarefa,
  QualidadeRevisao,
} from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "estudante@mindly.app" },
    update: {},
    create: {
      name: "Carlos Manoel",
      email: "estudante@mindly.app",
      emailVerified: true,
      role: "USER",
      bio: "Estudos estruturados com revisão espaçada e foco profundo.",
      metaDiariaMinutos: 150,
      fatorFacilidadePadrao: 2.5,
    },
  });

  const calculo = await prisma.disciplina.create({
    data: {
      nome: "Cálculo Diferencial e Integral I",
      descricao: "Limites, continuidade, derivadas e aplicações de taxas relacionadas.",
      corHex: "#3D4F3D",
      metaHorasSem: 8,
      publica: true,
      userId: user.id,
      tarefas: {
        create: [
          {
            titulo: "Revisar definição formal de limite (ε-δ)",
            descricao: "Resolver os 10 exercícios iniciais da lista 1.",
            estimativaMin: 45,
            status: StatusTarefa.CONCLUIDA,
            srsIntervalo: 4,
            proximaRevisao: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            ultimaQualidade: QualidadeRevisao.FACIL,
            userId: user.id,
          },
          {
            titulo: "Regra da cadeia e derivação implícita",
            descricao: "Focar em funções trigonométricas inversas.",
            estimativaMin: 60,
            status: StatusTarefa.PENDENTE,
            srsIntervalo: 1,
            proximaRevisao: new Date(),
            userId: user.id,
          },
        ],
      },
    },
  });

  await prisma.meta.create({
    data: {
      titulo: "Concluir bloco de derivadas antes da P1",
      descricao: "Completar todas as listas e sessões de revisão.",
      horasAlvo: 20,
      horasAtuais: 6.5,
      disciplinaId: calculo.id,
      userId: user.id,
    },
  });

  await prisma.sessaoEstudo.create({
    data: {
      duracaoMin: 50,
      modo: "POMODORO",
      anotacao: "Estudo focado de limites fundamentais.",
      disciplinaId: calculo.id,
      userId: user.id,
    },
  });

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });