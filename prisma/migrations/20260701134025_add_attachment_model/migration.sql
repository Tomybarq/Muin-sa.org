-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT NOT NULL,
    "data" BYTEA,
    "storePath" TEXT,
    "storage" TEXT NOT NULL DEFAULT 'db',
    "accessToken" TEXT,
    "resModel" TEXT,
    "resId" INTEGER,
    "resField" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_checksum_key" ON "Attachment"("checksum");

-- CreateIndex
CREATE INDEX "Attachment_resModel_resId_idx" ON "Attachment"("resModel", "resId");

-- CreateIndex
CREATE INDEX "Attachment_checksum_idx" ON "Attachment"("checksum");
