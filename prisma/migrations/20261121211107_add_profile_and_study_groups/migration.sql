/*
  Warnings:

  - You are about to drop the column `imagemUrl` on the `Disciplina` table. All the data in the column will be lost.
  - You are about to drop the column `dataLimite` on the `Meta` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Meta` table. All the data in the column will be lost.
  - You are about to drop the column `disciplinaId` on the `Meta` table. All the data in the column will be lost.
  - You are about to drop the column `anotacoesZen` on the `SessaoEstudo` table. All the data in the column will be lost.
  - You are about to drop the column `concluidaEm` on the `SessaoEstudo` table. All the data in the column will be lost.
  - You are about to drop the column `modo` on the `SessaoEstudo` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `estimativaMin` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `imagemUrl` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `prazo` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `proximaRevisao` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `srsIntervalo` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `ultimaQualidade` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PapelGrupo" AS ENUM ('OWNER', 'MEMBER');

-- DropForeignKey
ALTER TABLE "Meta" DROP CONSTRAINT "Meta_disciplinaId_fkey";

-- DropIndex
DROP INDEX "SessaoEstudo_userId_concluidaEm_idx";

-- DropIndex
DROP INDEX "Tarefa_userId_status_idx";

-- AlterTable
ALTER TABLE "Disciplina" DROP COLUMN "imagemUrl",
ADD COLUMN     "studyGroupId" TEXT,
ALTER COLUMN "corHex" SET DEFAULT '#3D4F3D',
ALTER COLUMN "publica" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Meta" DROP COLUMN "dataLimite",
DROP COLUMN "descricao",
DROP COLUMN "disciplinaId",
ADD COLUMN     "prazo" TIMESTAMP(3),
ALTER COLUMN "horasAlvo" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "horasAtuais" SET DEFAULT 0,
ALTER COLUMN "horasAtuais" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SessaoEstudo" DROP COLUMN "anotacoesZen",
DROP COLUMN "concluidaEm",
DROP COLUMN "modo",
ADD COLUMN     "anotacao" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Tarefa" DROP COLUMN "descricao",
DROP COLUMN "estimativaMin",
DROP COLUMN "imagemUrl",
DROP COLUMN "prazo",
DROP COLUMN "proximaRevisao",
DROP COLUMN "srsIntervalo",
DROP COLUMN "ultimaQualidade",
ADD COLUMN     "fatorFacilidade" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "intervaloDias" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "proximaRevisaoEm" TIMESTAMP(3),
ADD COLUMN     "repeticoes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "studyGroupId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "bio" VARCHAR(280),
ADD COLUMN     "fatorFacilidadePadrao" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "metaDiariaMinutos" INTEGER NOT NULL DEFAULT 120;

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" VARCHAR(400),
    "inviteCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PapelGrupo" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaConclusao" (
    "id" TEXT NOT NULL,
    "tarefaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarefaConclusao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroup_inviteCode_key" ON "StudyGroup"("inviteCode");

-- CreateIndex
CREATE INDEX "StudyGroup_ownerId_idx" ON "StudyGroup"("ownerId");

-- CreateIndex
CREATE INDEX "StudyGroupMember_userId_idx" ON "StudyGroupMember"("userId");

-- CreateIndex
CREATE INDEX "StudyGroupMember_groupId_idx" ON "StudyGroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupMember_groupId_userId_key" ON "StudyGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "TarefaConclusao_tarefaId_idx" ON "TarefaConclusao"("tarefaId");

-- CreateIndex
CREATE INDEX "TarefaConclusao_userId_idx" ON "TarefaConclusao"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TarefaConclusao_tarefaId_userId_key" ON "TarefaConclusao"("tarefaId", "userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Disciplina_studyGroupId_idx" ON "Disciplina"("studyGroupId");

-- CreateIndex
CREATE INDEX "SessaoEstudo_disciplinaId_idx" ON "SessaoEstudo"("disciplinaId");

-- CreateIndex
CREATE INDEX "SessaoEstudo_userId_idx" ON "SessaoEstudo"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Tarefa_userId_idx" ON "Tarefa"("userId");

-- CreateIndex
CREATE INDEX "Tarefa_studyGroupId_idx" ON "Tarefa"("studyGroupId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- AddForeignKey
ALTER TABLE "StudyGroup" ADD CONSTRAINT "StudyGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMember" ADD CONSTRAINT "StudyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMember" ADD CONSTRAINT "StudyGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaConclusao" ADD CONSTRAINT "TarefaConclusao_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaConclusao" ADD CONSTRAINT "TarefaConclusao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
