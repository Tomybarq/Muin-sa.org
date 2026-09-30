-- Step 1: Add governorateId column (nullable first)
ALTER TABLE "Association" ADD COLUMN "governorateId" INTEGER;

-- Step 2: Populate from city.governorateId
UPDATE "Association" a
SET "governorateId" = c."governorateId"
FROM "City" c
WHERE a."cityId" = c."id";

-- Step 3: Set default for any remaining nulls (first governorate)
UPDATE "Association"
SET "governorateId" = (SELECT "id" FROM "Governorate" ORDER BY "id" LIMIT 1)
WHERE "governorateId" IS NULL;

-- Step 4: Make it NOT NULL and add FK
ALTER TABLE "Association" ALTER COLUMN "governorateId" SET NOT NULL;
ALTER TABLE "Association" ADD CONSTRAINT "Association_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
