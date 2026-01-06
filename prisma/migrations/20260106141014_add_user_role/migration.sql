-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
