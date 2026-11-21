-- AlterTable
ALTER TABLE "Meta" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "disciplinaId" TEXT;

-- AlterTable
ALTER TABLE "SessaoEstudo" ADD COLUMN     "anotacoesZen" TEXT,
ADD COLUMN     "concluidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modo" TEXT NOT NULL DEFAULT 'POMODORO';

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "estimativaMin" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "proximaRevisao" TIMESTAMP(3),
ADD COLUMN     "srsIntervalo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ultimaQualidade" TEXT;

-- CreateIndex
CREATE INDEX "Meta_disciplinaId_idx" ON "Meta"("disciplinaId");

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;
