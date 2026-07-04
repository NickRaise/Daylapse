CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`journal` text,
	`mood` text,
	`cover_media_id` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_date_unique` ON `entries` (`date`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`type` text NOT NULL,
	`uri` text NOT NULL,
	`thumbnailUri` text,
	`caption` text,
	`duration` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
