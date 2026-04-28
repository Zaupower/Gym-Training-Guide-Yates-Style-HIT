CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrainingPlan_userId_idx" ON "TrainingPlan"("userId");

ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD COLUMN "planId" TEXT;

ALTER TABLE "Session" ADD CONSTRAINT "Session_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
