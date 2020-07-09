use mobileoffice_db;

ALTER TABLE Consentform DROP FOREIGN KEY Name;
ALTER TABLE Users DROP INDEX indexName;
DROP TABLE IF EXISTS Consentform;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
	UserId int unsigned AUTO_INCREMENT NOT NULL PRIMARY KEY,
	Name varchar(255) NOT NULL
);

CREATE INDEX indexName ON Users (Name);

CREATE TABLE Consentform (
	FormDate varchar(255),
	Name varchar(255) NOT NULL,
	CONSTRAINT FOREIGN KEY (Name) REFERENCES Users (Name)
	/*ON DELETE CASCADE
	ON UPDATE RESTRICT*/
	/*Userid int unsigned NOT NULL,
	FOREIGN KEY (Userid) REFERENCES Users(Userid),*/
) Engine = InnoDB; 
