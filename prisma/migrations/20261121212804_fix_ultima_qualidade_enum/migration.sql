/*
  Warnings:

  - The `ultimaQualidade` column on the `Tarefa` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Tarefa" DROP COLUMN "ultimaQualidade",
ADD COLUMN     "ultimaQualidade" "QualidadeRevisao";
