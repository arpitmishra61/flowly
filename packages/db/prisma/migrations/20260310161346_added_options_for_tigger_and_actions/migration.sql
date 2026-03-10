-- CreateTable
CREATE TABLE "ActionOption" (
    "id" SERIAL NOT NULL,
    "actionid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ActionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerOption" (
    "id" SERIAL NOT NULL,
    "triggerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TriggerOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionOption" ADD CONSTRAINT "ActionOption_actionid_fkey" FOREIGN KEY ("actionid") REFERENCES "AvailableAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerOption" ADD CONSTRAINT "TriggerOption_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "AvailableTrigger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
