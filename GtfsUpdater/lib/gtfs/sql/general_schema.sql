/*
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `feed`;

SET FOREIGN_KEY_CHECKS = 1;
*/

CREATE TABLE IF NOT EXISTS `feed` 
(
	`feed_id`				int					NOT		NULL AUTO_INCREMENT,
    `database_name`			varchar(20)			NOT		NULL,
    `url_gtfs`				varchar(100)		NOT 	NULL,
    `data_valid`			tinyint				NOT		NULL,
	`last_edit`				timestamp			,
    `last_update`			timestamp	   NULL	DEFAULT NULL,
    `last_update_duration`	varchar(15)			DEFAULT NULL,

	PRIMARY KEY				(`feed_id`) 
);