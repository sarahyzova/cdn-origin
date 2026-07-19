-- AlterTable
ALTER TABLE `files` ADD COLUMN `expires_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `files_expires_at_idx` ON `files`(`expires_at`);
