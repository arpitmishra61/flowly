-- AlterTable
ALTER TABLE "AvailableAction" ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "AvailableTrigger" ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT true;
