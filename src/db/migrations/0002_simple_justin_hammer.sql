CREATE TABLE `montages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`date_range_start` text NOT NULL,
	`date_range_end` text NOT NULL,
	`output_uri` text NOT NULL,
	`duration` integer,
	`createdAt` integer NOT NULL
);
