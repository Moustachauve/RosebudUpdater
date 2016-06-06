/*
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `agency`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `stops`;
DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `stop_times`;
DROP TABLE IF EXISTS `calendar`;
DROP TABLE IF EXISTS `calendar_dates`;
DROP TABLE IF EXISTS `fare_attributes`;
DROP TABLE IF EXISTS `fare_rules`;
DROP TABLE IF EXISTS `shapes`;
DROP TABLE IF EXISTS `frequencies`;
DROP TABLE IF EXISTS `transfers`;
DROP TABLE IF EXISTS `feed_info`;

SET FOREIGN_KEY_CHECKS = 1;
*/

CREATE TABLE IF NOT EXISTS `agency` 
(
	`agency_id`				varchar(3)			NOT		NULL,
	`agency_name`			varchar(40)			NOT		NULL,
	`agency_url`			varchar(60)			NOT		NULL,
	`agency_timezone`		varchar(20)			NOT		NULL,
	`agency_lang`			char(2)				DEFAULT NULL,
	`agency_phone`			varchar(25)			DEFAULT NULL,
	`agency_fare_url`		varchar(255)		DEFAULT NULL,
	`agency_email`			varchar(100)		DEFAULT NULL,

	PRIMARY KEY				(`agency_id`)
);

CREATE TABLE IF NOT EXISTS `stops` 
(
	`stop_id`				varchar(8)			NOT		NULL,
	`stop_code`				varchar(5)			DEFAULT NULL,
	`stop_name`				varchar(50)			NOT		NULL,
	`stop_desc`				varchar(150)		DEFAULT NULL,
	`stop_lat`				varchar(10)			NOT		NULL,
	`stop_lon`				varchar(10)			NOT		NULL,
	`zone_id`				varchar(20)			DEFAULT NULL,
	`stop_url`				varchar(60)			DEFAULT NULL,
	`location_type`			tinyint				DEFAULT NULL,
	`parent_station`		varchar(8)			DEFAULT NULL,
	`stop_timezone`			varchar(20)			DEFAULT NULL,
	`wheelchair_boarding`	tinyint				DEFAULT 0,

	PRIMARY KEY				(`stop_id`)
);

CREATE TABLE IF NOT EXISTS `routes` 
(
	`route_id`				varchar(3)			NOT		NULL,
	`agency_id`				varchar(3)			DEFAULT NULL,
	`route_short_name`		varchar(10)			NOT		NULL,
	`route_long_name`		varchar(40)			NOT		NULL,
	`route_desc`			varchar(100)		DEFAULT NULL,
	`route_type`			tinyint				NOT		NULL,
	`route_url`				varchar(100)		DEFAULT NULL,
	`route_color`			char(6)				DEFAULT 'FFFFFF',
	`route_text_color`		char(6)				DEFAULT '000000',

	PRIMARY KEY				(`route_id`)
);

CREATE TABLE IF NOT EXISTS `trips` 
(
	`trip_id`				varchar(20)			NOT		NULL,
	`service_id`			varchar(3)			NOT		NULL,
	`route_id`				varchar(3)			NOT		NULL,
	`trip_headsign`			varchar(50)			DEFAULT NULL,
	`trip_short_name`		varchar(20)			DEFAULT NULL,
	`direction_id`			tinyint				DEFAULT NULL,
	`block_id`				varchar(20)			DEFAULT NULL,
	`shape_id`				varchar(15)			DEFAULT NULL,
	`wheelchair_accessible`	tinyint				DEFAULT 0,
	`bikes_allowed`			tinyint				DEFAULT 0,
	`note_fr`				varchar(255)		DEFAULT NULL,
	`note_en`				varchar(255)		DEFAULT NULL,

	PRIMARY KEY				(`trip_id`)
);

CREATE TABLE IF NOT EXISTS `stop_times` 
(
	`trip_id`				varchar(20)			NOT		NULL,
	`arrival_time`			char(8)				NOT		NULL,
	`departure_time`		char(8)				NOT		NULL,
	`stop_id`				varchar(8)			NOT		NULL,
	`stop_sequence`			smallint UNSIGNED 	NOT		NULL,
	`stop_headsign`			varchar(50)			DEFAULT NULL,
	`pickup_type`			tinyint				DEFAULT 0,
	`drop_off_type`			tinyint				DEFAULT 0,
	`shape_dist_traveled`	varchar(10)			DEFAULT NULL,
	`timepoint`				tinyint				DEFAULT 1
);

CREATE TABLE IF NOT EXISTS `calendar` 
(
	`service_id`			varchar(3)			NOT		NULL,
	`monday`				tinyint				NOT		NULL,
	`tuesday`				tinyint				NOT		NULL,
	`wednesday`				tinyint				NOT		NULL,
	`thursday`				tinyint				NOT		NULL,
	`friday`				tinyint				NOT		NULL,
	`saturday`				tinyint				NOT		NULL,
	`sunday`				tinyint				NOT		NULL,
	`start_date`			char(8)				NOT		NULL,
	`end_date`				char(8)				NOT		NULL,

	PRIMARY KEY				(`service_id`)
);

CREATE TABLE IF NOT EXISTS `calendar_dates` 
(
	`service_id`			varchar(3)			NOT		NULL,
	`date`					char(8)				NOT		NULL,
	`exception_type`		tinyint				NOT		NULL,

	PRIMARY KEY				(`service_id`, `date`)
);

CREATE TABLE IF NOT EXISTS `fare_attributes` 
(
	`fare_id`				varchar(15)			NOT		NULL,
	`price`					decimal(6,2)		NOT		NULL,
	`currency_type`			char(3)				NOT		NULL,
	`payment_method`		tinyint				NOT		NULL,
	`transfers`				tinyint				DEFAULT NULL,
	`transfer_duration`		int UNSIGNED 		DEFAULT NULL,

	PRIMARY KEY				(`fare_id`)
);

CREATE TABLE IF NOT EXISTS `fare_rules` 
(
	`fare_id`				varchar(15)			NOT		NULL,
	`route_id`				varchar(3)			DEFAULT NULL,
	`origin_id`				varchar(15)			DEFAULT NULL,
	`destination_id`		varchar(15)			DEFAULT NULL,
	`contains_id`			varchar(15)			DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `shapes` 
(
	`shape_id`				varchar(15)			NOT		NULL,
	`shape_pt_lat`			varchar(10)			NOT		NULL,
	`shape_pt_lon`			varchar(10)			NOT		NULL,
	`shape_pt_sequence`		smallint UNSIGNED 	NOT		NULL,
	`shape_dist_traveled`	varchar(20)			DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `frequencies` 
(
	`trip_id`				varchar(20)			NOT		NULL,
	`start_time`			char(8)				NOT		NULL,
	`end_time`				char(8)				NOT		NULL,
	`headway_secs`			smallint UNSIGNED	NOT		NULL,
	`exact_times`			tinyint				DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `transfers` 
(
	`from_stop_id`			varchar(8)			NOT		NULL,
	`to_stop_id`			varchar(8)			NOT		NULL,
	`transfer_type`			tinyint				DEFAULT 0,
	`min_transfer_time`		int UNSIGNED 		DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `feed_info` 
(
	`feed_publisher_name`	varchar(50)			NOT		NULL,
	`feed_publisher_url`	varchar(100)		NOT		NULL,
	`feed_lang`				char(2)				NOT		NULL,
	`feed_start_date`		char(8)		 		DEFAULT NULL,
	`feed_end_date`			char(8)		 		DEFAULT NULL,
	`feed_version`			varchar(20)	 		DEFAULT NULL
);
