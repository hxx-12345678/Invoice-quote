-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "deliveryTerms" TEXT,
ADD COLUMN     "incoterms" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "reasonCode" TEXT,
ADD COLUMN     "validityPeriod" INTEGER;
