use mobileoffice_db;

DROP TABLE IF EXISTS Consentform;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Podcast;
DROP TABLE IF EXISTS Presentation;
DROP TABLE IF EXISTS Karaoke;
DROP TABLE IF EXISTS Audiobook;

CREATE TABLE Users (
	UserId int unsigned AUTO_INCREMENT NOT NULL PRIMARY KEY,
	IpAddress varchar(255) NOT NULL,
	StartTime varchar(255) NOT NULL,
	Name varchar(255) NOT NULL
);

CREATE INDEX indexName ON Users (Name);
CREATE INDEX indexID ON Users (UserId);
CREATE INDEX indexIP ON Users (IpAddress);

CREATE TABLE Consentform (
	FormDate varchar(255),
	UserId int unsigned NOT NULL PRIMARY KEY,
	CONSTRAINT FOREIGN KEY (UserId) REFERENCES Users (UserId),
	Name varchar(255) NOT NULL,
	CONSTRAINT FOREIGN KEY (Name) REFERENCES Users (Name),
	IpAddress varchar(255) NOT NULL,
	CONSTRAINT FOREIGN KEY (IpAddress) REFERENCES Users (IpAddress)
) Engine = InnoDB; 

CREATE TABLE Podcast (
	TaskNum varchar(255) NOT NULL,
	UserId int unsigned NOT NULL,
	VoiceVideo varchar(255) NOT NULL,
	GestureVideo varchar(255) NOT NULL,
	PreferredChoice varchar(255) NOT NULL,
	Explanation varchar(500) NOT NULL
);

CREATE TABLE Presentation (
	TaskNum varchar(255) NOT NULL,
	UserId int unsigned NOT NULL,
	VoiceVideo varchar(255) NOT NULL,
	GestureVideo varchar(255) NOT NULL,
	PreferredChoice varchar(255) NOT NULL,
	Explanation varchar(500) NOT NULL
);

Create TABLE Karaoke (
	TaskNum varchar(255) NOT NULL,
	UserId int unsigned NOT NULL,
	VoiceVideo varchar(255) NOT NULL,
	GestureVideo varchar(255) NOT NULL,
	PreferredChoice varchar(255) NOT NULL,
	Explanation varchar(500) NOT NULL
);

Create TABLE Audiobook (
	TaskNum varchar(255) NOT NULL,
	UserId int unsigned NOT NULL,
	VoiceVideo varchar(255) NOT NULL,
	GestureVideo varchar(255) NOT NULL,
	PreferredChoice varchar(255) NOT NULL,
	Explanation varchar(500) NOT NULL
);
