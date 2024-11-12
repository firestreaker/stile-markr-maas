CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`test_id` integer NOT NULL,
	`student_id` integer,
	`marks_avalilable` integer NOT NULL,
	`marks_obtained` integer NOT NULL,
	`scannedAt` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `results` (`test_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
