CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`key_type` text NOT NULL,
	`key_prefix` text NOT NULL,
	`key_hash` text NOT NULL,
	`last_used_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_api_keys_dataset_type` ON `api_keys` (`dataset_id`,`key_type`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `dataset_access_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`action` text NOT NULL,
	`key_type` text,
	`ip_hash` text,
	`user_agent` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_access_logs_dataset_action` ON `dataset_access_logs` (`dataset_id`,`action`,`created_at`);--> statement-breakpoint
CREATE TABLE `dataset_schema_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`field_key` text NOT NULL,
	`label` text NOT NULL,
	`field_type` text NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`archived_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`event_name` text NOT NULL,
	`actor_id` text,
	`session_id` text,
	`source` text,
	`status` text,
	`occurred_at` text NOT NULL,
	`received_at` text DEFAULT (datetime('now')) NOT NULL,
	`dim1` text,
	`dim2` text,
	`dim3` text,
	`dim4` text,
	`dim5` text,
	`dim6` text,
	`dim7` text,
	`dim8` text,
	`dim9` text,
	`dim10` text,
	`metric1` real,
	`metric2` real,
	`metric3` real,
	`payload_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_dataset_occurred` ON `events` (`dataset_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_events_dataset_event_name` ON `events` (`dataset_id`,`event_name`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_events_dataset_actor` ON `events` (`dataset_id`,`actor_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_events_dataset_status` ON `events` (`dataset_id`,`status`,`occurred_at`);