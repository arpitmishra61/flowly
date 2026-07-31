-- CreateTable
CREATE TABLE "ActionExecution" (
    "id" SERIAL NOT NULL,
    "zapRunId" INTEGER NOT NULL,
    "sortingOrder" INTEGER NOT NULL,
    "result" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActionExecution_zapRunId_sortingOrder_key" ON "ActionExecution"("zapRunId", "sortingOrder");

-- AddForeignKey
ALTER TABLE "ActionExecution" ADD CONSTRAINT "ActionExecution_zapRunId_fkey" FOREIGN KEY ("zapRunId") REFERENCES "ZapRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
