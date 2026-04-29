-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('min', 'sec');

-- AlterEnum
ALTER TYPE "MuscleGroup" ADD VALUE 'cardio';

-- AlterTable
ALTER TABLE "ExerciseSet" ADD COLUMN "durationUnit" "DurationUnit";
