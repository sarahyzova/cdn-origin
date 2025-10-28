-- AlterTable
ALTER TABLE `buckets` ADD COLUMN `e403_fallback_key` VARCHAR(191) NULL,
    ADD COLUMN `e404_fallback_key` VARCHAR(191) NULL,
    ADD COLUMN `index_key` VARCHAR(191) NULL;
