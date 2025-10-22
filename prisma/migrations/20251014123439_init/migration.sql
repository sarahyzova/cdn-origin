-- CreateTable
CREATE TABLE `buckets` (
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `owner` VARCHAR(191) NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `bucket_name` VARCHAR(191) NOT NULL,
    `owner` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `size` INTEGER NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `checksum` VARCHAR(191) NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `files_bucket_name_key_key`(`bucket_name`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `object_id` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `unique` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`object_id`, `tag`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_bucket_name_fkey` FOREIGN KEY (`bucket_name`) REFERENCES `buckets`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags` ADD CONSTRAINT `tags_object_id_fkey` FOREIGN KEY (`object_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
