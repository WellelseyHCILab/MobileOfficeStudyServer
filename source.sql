use mobileoffice_db;

DROP TABLE users;

CREATE TABLE users (
	id varchar(9) not null primary key;
	name varchar(25);
	consent_signed varchar(57);
);