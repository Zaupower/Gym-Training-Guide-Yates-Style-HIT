-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "OverallFeel" AS ENUM ('strong', 'flat', 'distracted');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'calves', 'abs', 'other');

-- CreateEnum
CREATE TYPE "SetKind" AS ENUM ('warmup', 'working', 'drop');

-- CreateEnum
CREATE TYPE "TargetMetric" AS ENUM ('weight', 'reps', 'frequency', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "userId" TEXT NOT NULL,
    "unit" "Unit" NOT NULL DEFAULT 'kg',
    "deloadAfterWeeks" INTEGER NOT NULL DEFAULT 6,
    "weeklyTarget" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ExerciseLibrary" (
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseLibrary_pkey" PRIMARY KEY ("userId","name")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "energy" INTEGER,
    "sleep" INTEGER,
    "stress" INTEGER,
    "overallFeel" "OverallFeel",
    "dietNotes" TEXT NOT NULL DEFAULT '',
    "dietTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "preExhaustWith" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "kind" "SetKind" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL DEFAULT 'kg',
    "reps" INTEGER NOT NULL,
    "toFailure" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReview" (
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "observations" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReview_pkey" PRIMARY KEY ("userId","month")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "reviewUserId" TEXT NOT NULL,
    "reviewMonth" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "exerciseName" TEXT,
    "targetMetric" "TargetMetric" NOT NULL DEFAULT 'other',
    "targetValue" TEXT NOT NULL DEFAULT '',
    "achieved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentMarker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "whatChanged" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ExerciseLibrary_userId_idx" ON "ExerciseLibrary"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_date_idx" ON "Session"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_date_key" ON "Session"("userId", "date");

-- CreateIndex
CREATE INDEX "Exercise_sessionId_idx" ON "Exercise"("sessionId");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "ExerciseSet_exerciseId_idx" ON "ExerciseSet"("exerciseId");

-- CreateIndex
CREATE INDEX "MonthlyReview_userId_idx" ON "MonthlyReview"("userId");

-- CreateIndex
CREATE INDEX "Target_reviewUserId_reviewMonth_idx" ON "Target"("reviewUserId", "reviewMonth");

-- CreateIndex
CREATE INDEX "ExperimentMarker_userId_date_idx" ON "ExperimentMarker"("userId", "date");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLibrary" ADD CONSTRAINT "ExerciseLibrary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReview" ADD CONSTRAINT "MonthlyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_reviewUserId_reviewMonth_fkey" FOREIGN KEY ("reviewUserId", "reviewMonth") REFERENCES "MonthlyReview"("userId", "month") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentMarker" ADD CONSTRAINT "ExperimentMarker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
