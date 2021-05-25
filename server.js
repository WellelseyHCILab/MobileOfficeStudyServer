var express = require('express');
var cors = require('cors');
const app = express();
var mysql = require('mysql');
var fs = require('fs');
var https = require('https');
var http = require("http");
var util = require('util');
var bodyParser = require('body-parser');
var expressip = require('express-ip');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var path = require('path');
var multer = require('multer');
//var storage = multer.memoryStorage(); 
//var upload = multer({ dest: 'uploads/' });

// var storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, 'uploads/')
// 	},
// 	filename: function (req, file, cb) {
// 		//cb(null, Date.now() + '.webm') //Appending .webm
// 		cb(null, Date.now() + '-' + file.originalname)
// 	}
// })

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		console.log(req.session.usrid)
		console.log(req.body.taskNum);
		let taskType = req.route.path;
		let userNum = "User_"+req.session.usrid;
		let taskNum = "task_"+req.body.taskNum;
		let totalPath = 'uploads/'+userNum +taskType+taskNum;
		fs.exists(totalPath, exist =>{
			if(!exist){
				return fs.mkdir(totalPath, {recursive: true}, error => cb(error, totalPath));
			}
			return cb(null, totalPath);
		})
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})

var upload = multer({ storage: storage });

//print out console.logs if debug is true
var debug = true;

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//for getting IP address info
app.use(expressip().getIpInfoMiddleware);

app.use(cookieParser());

//for handling CORS errors
app.use(cors({ credentials: true, origin: true }));
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
	res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Vary");
	next();
});

//connection parameters
const options = {
	host: "0.0.0.0",
	user: "mobileoffice",
	password: "UtJsHCbKJ33Tvav",
	database: "mobileoffice_db",
	port: 3306
}

const con = mysql.createConnection(options);

const sessionStore = new MySQLStore({}, con);

//initialize session
app.use(session({
	key: 'gHjKrqgyAk',
	secret: 'V44GiruXLF',
	store: sessionStore,
	resave: false,
	saveUninitialized: false,
	clearExpired: true,
	expiration: 86400000,
	checkExpirationInterval: 900000
}));


//establish connection with the database
con.connect(function (err) {
	if (err) throw err;
	console.log("Connected!");
});


//get certificates for server
//const optionsSecure = {
//	key: fs.readFileSync('../certs/cs.wellesley.edu.key'),
//	cert: fs.readFileSync('../certs/cs_wellesley_edu_cert.cer')
//};

// serverconnection over https
//https.createServer(optionsSecure, app).listen(8133, function () {

app.listen(8133, () => {
	console.log('App is running on port: 8133');
})

//route for index.html page after submission, sends users to consent form
app.post('/start/', function (req, res) {
	if (debug) {
		console.log("Starting route and destroying session vars...\n");
		req.session.destroy();
		sessionStore.close();
	}
	res.redirect('http://ec2-3-80-137-223.compute-1.amazonaws.com/0_consent.html');
	res.end();
});


//handling the submission of the consent form
app.post('/consentform/', function (req, res) {
	//if user has already submitted the form, send them to the next page.
	if (req.session.usrid) {
		if (debug) {
			console.log("Consent form has already been submitted for..." + req.session.usrid);
		};
	//if this is the first time the user submits the consent form.
		//gets IP adress and stores in the session
		var ipAddress = req.ipInfo.ip;

		//gets the name and date
		var name = req.body.name;
		var date = req.body.date;

		if (debug) {
			console.log("Name is...");
			console.log(name);
			console.log("Date is...");
			console.log(date);
		}

		//adds the name, IP adress, and time stamp (called StartTime) to verify when users began the survey to the Users table
		var d = new Date();

		var usrSql = "INSERT INTO Users (Name,StartTime,IpAddress) VALUES (?, ?, ?)";

		//var usrSql = "INSERT INTO Users (Name,StartTime,IpAddress) VALUES ('"+name+"','"+d+"','"+ipAddress+"')";

		con.query(usrSql, [name, d, ipAddress], function (err, result) {
			if (err) { throw err; }
			else {
				storeUserID();
			}
		});

		//gets and stores the user ID of the user who just submitted the form
		function storeUserID() {
			var getIDSql = "select UserId from Users where Name=? AND StartTime=? AND IpAddress=?";
			//var getIDSql = "select UserId from Users where Name='"+name+"' AND StartTime='"+d+"' AND IpAddress='"+ipAddress+"'";

			con.query(getIDSql, [name, d, ipAddress], function (err, result) {
				if (err) { throw err; }
				else {
					//sends users to the next part of the study
					consentFormInsert(result[0].UserId);
					req.session.usrid = result[0].UserId;
					req.session.save(function (err) {
						// session saved
						//debugging
						res.redirect('http://ec2-3-80-137-223.compute-1.amazonaws.com/1_background.html');
						res.end();
					})
				};
			});
		}

		//adds the name, id, and date of the consent form submission to Consentform table
		function consentFormInsert(userID) {
			var consentSql = "INSERT INTO Consentform (FormDate, Name, UserId, IpAddress) VALUES (?,?,?,?)";
			//var consentSql = "INSERT INTO Consentform (FormDate, Name, UserId, IpAddress) VALUES ('"+date+"','"+name+"','"+userID+"','"+ipAddress+"')";

			con.query(consentSql, [date, name, userID, ipAddress], function (err, result) {
				if (err) throw err;
				console.log("1 record inserted in Consent table");
			});
		}

		//adds data to the consentform log
		fs.appendFile('consentform.log',
			// JSON is easy to parse
			JSON.stringify(req.body) + '\n',
			function (err, data) {
				if (err) {
					console.log('error writing to consentform.log: ' + err);
				}
			});
	}
});

//redirect users to a randomly selected work task after they complete the example scenario
app.post('/worktask/', function (req, res) {


	//Generate a random number, 0 or 1 inclusive, to determine which task they go to
	var randNum = Math.floor(Math.random() * 2);
	var goingToWorkTask = Math.floor(Math.random() * 2);
	if (goingToWorkTask) {
		if (debug) {
			console.log("\nIn work task...");
		}
		if (randNum) {
			//Generate a random number, 1 to 6 inclusive, to determine which podcast task to go
			//let randTaskNum = 1 + Math.floor(Math.random() * 6);
			if (debug) {
				console.log(`Entering podcast task 1`);
			}
			res.redirect(`http://ec2-3-80-137-223.compute-1.amazonaws./5_podcast_t1.html`);
			res.end();
		}
		else {
			//Generate a random number, 1 to 8 inclusive, to determine which podcast task to go
			let randTaskNum = 1 + Math.floor(Math.random() * 8);
			if (debug) {
				console.log(`Entering presentation task 1`);
			}
	}
		if (debug) {
			console.log("\nIn leisure task...");
		}
		if (randNum) {
			//Generate a random number, 1 to 6 inclusive, to determine which podcast task to go
			if (debug) {
				console.log(`Entering karaoke task 1`);
			}
			res.redirect(`http://ec2-3-80-137-223.compute-1.amazonaws.com/6_karaoke_t1.html`);
			res.end();
		}
		else {
			//Generate a random number, 1 to 8 inclusive, to determine which podcast task to go
			//let randTaskNum = 1 + Math.floor(Math.random() * 8);
			if (debug) {
				console.log(`Entering presentation task 1`);
			}
			res.redirect(`http://ec2-3-80-137-223.compute-1.amazonaws.com/7_audiobook_t1.html`);
			res.end();
		}
	}





});

//get user submission from Podcast tasks
app.post('/podcast/', upload.array('blobs', 2), function (req, res) {
	var taskType = req.body.taskType;
	var taskNum = req.body.taskNum;
	var select = req.body.select;
	var textArea = req.body.textarea;
	var userID = req.session.usrid;
	var voiceVideoPath = req.files[0].path;
	var gestureVideoPath = req.files[1].path;
	req.session.hasDoneTaskBefore = true;

	if (debug) {
		console.log("\nTask type is..." + JSON.stringify(taskType));
		console.log("Task num is..." + JSON.stringify(taskNum));
		console.log("Select is..." + JSON.stringify(select));
		console.log("Textarea is..." + JSON.stringify(textArea));
	}
	//if submit button has already been pressed, update the session
	if (req.session["podcast"+taskNum]) {
		var podcastUpdate = 'UPDATE Podcast SET PreferredChoice=?, Explanation=? WHERE UserId=?';

		con.query(podcastUpdate, [select, textArea, userID], function (err, result) {
			if (err) throw err;
			console.log("1 response updated in Podcast table");
		});
	}
	else {
		req.session["podcast"+taskNum] = true;
		var podQuery = "INSERT INTO Podcast (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES (?,?,?,?,?,?)";
		var podQueryForDebug = "INSERT INTO Podcast (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES ('" + taskNum + "'," + userID + ",'" + voiceVideoPath + "','" + gestureVideoPath + "','" + select + "','" + textArea + "')";
		if (debug) {
			console.log("Pod query is...");
			console.log(podQueryForDebug);
		}

		//query to insert user response into table
		con.query(podQuery, [taskNum, userID, voiceVideoPath, gestureVideoPath, select, textArea], function (err, result) {
			if (err) throw err;
			console.log("1 response inserted in Podcast table");
		});
	}
	res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
	res.setHeader("Vary", "Origin");
	res.send();
	//res.redirect('/leisuretask/');
	res.end();

});

//get user submission from Presentation tasks
app.post('/presentation/', upload.array('blobs', 2), function (req, res) {
	var taskType = req.body.taskType;
	var taskNum = req.body.taskNum;
	var select = req.body.select;
	var textArea = req.body.textarea;
	var userID = req.session.usrid;
	var voiceVideoPath = req.files[0].path;
	var gestureVideoPath = req.files[1].path;
	req.session.hasDoneTaskBefore = true;

	if (debug) {
		console.log("\nTask type is..." + JSON.stringify(taskType));
		console.log("Task num is..." + JSON.stringify(taskNum));
		console.log("Select is..." + JSON.stringify(select));
		console.log("Textarea is..." + JSON.stringify(textArea));
	}
	//if submit button has already been pressed, update the session
	if (req.session["presentation"+taskNum]) {
		//var presentationUpdate = 'UPDATE Presentation SET PreferredChoice="'+select+'", Explanation="'+textArea+'" WHERE UserId='+userID
		var presentationUpdate = 'UPDATE Presentation SET PreferredChoice=?, Explanation=? WHERE UserId=?';

		con.query(presentationUpdate, [select, textArea, userID], function (err, result) {
			if (err) throw err;
			console.log("1 response updated in Presentation table");
		});
	}
	else {
		req.session["presentation"+taskNum] = true;
		var presQuery = "INSERT INTO Presentation (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES (?,?,?,?,?,?)";
		var presQueryForDebug = "INSERT INTO Presentation (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES ('" + taskNum + "'," + userID + ",'" + voiceVideoPath + "','" + gestureVideoPath + "','" + select + "','" + textArea + "')";
		if (debug) {
			console.log("Pres query is...");
			console.log(presQueryForDebug);
		}

		//query to insert user response into table
		con.query(presQuery, [taskNum, userID, voiceVideoPath, gestureVideoPath, select, textArea], function (err, result) {
			if (err) throw err;
			console.log("1 response inserted in Presentation table");
		});
	}
	res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
	res.setHeader("Vary", "Origin");
	res.send();

});

//get user submission from Karaoke tasks
app.post('/karaoke/', upload.array('blobs', 2), function (req, res) {
	var taskType = req.body.taskType;
	var taskNum = req.body.taskNum;
	var select = req.body.select;
	var textArea = req.body.textarea;
	var userID = req.session.usrid;
	var voiceVideoPath = req.files[0].path;
	var gestureVideoPath = req.files[1].path;
	req.session.hasDoneTaskBefore = true;

	if (debug) {
		console.log("\nTask type is..." + JSON.stringify(taskType));
		console.log("Task num is..." + JSON.stringify(taskNum));
		console.log("Select is..." + JSON.stringify(select));
		console.log("Textarea is..." + JSON.stringify(textArea));
	}
	//if submit button has already been pressed, update the session
	if (req.session["karaoke"+taskNum]) {
		//var karaokeUpdate = 'UPDATE Karaoke SET PreferredChoice="'+select+'", Explanation="'+textArea+'" WHERE UserId='+userID
		var karaokeUpdate = 'UPDATE Karaoke SET PreferredChoice=?, Explanation=? WHERE UserId=?';
		con.query(karaokeUpdate, [select, textArea, userID], function (err, result) {
			if (err) throw err;
			console.log("1 response updated in Karaoke table");
		});
	}
	else {
		req.session["karaoke"+taskNum] = true;
		var karaokeQuery = "INSERT INTO Karaoke (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES (?,?,?,?,?,?)";
		var karaokeQueryForDebug = "INSERT INTO Karaoke (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES ('" + taskNum + "'," + userID + ",'" + voiceVideoPath + "','" + gestureVideoPath + "','" + select + "','" + textArea + "')";
		if (debug) {
			console.log("Karaoke query is...");
			console.log(karaokeQueryForDebug);
		}

		//query to insert user response into table
		con.query(karaokeQuery, [taskNum, userID, voiceVideoPath, gestureVideoPath, select, textArea], function (err, result) {
			if (err) throw err;
			console.log("1 response inserted in Karaoke table");
		});
	}
	res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
	res.setHeader("Vary", "Origin");
	res.send();

});

//get user submission from Audiobook tasks
app.post('/audiobook/', upload.array('blobs', 2), function (req, res) {
	var taskType = req.body.taskType;
	var taskNum = req.body.taskNum;
	var select = req.body.select;
	var textArea = req.body.textarea;
	var userID = req.session.usrid;
	var voiceVideoPath = req.files[0].path;
	var gestureVideoPath = req.files[1].path;
	req.session.hasDoneTaskBefore = true;

	if (debug) {
		console.log("\nTask type is..." + JSON.stringify(taskType));
		console.log("Task num is..." + JSON.stringify(taskNum));
		console.log("Select is..." + JSON.stringify(select));
		console.log("Textarea is..." + JSON.stringify(textArea));
	}
	//if submit button has already been pressed, update the session
	if (req.session["audiobook"+taskNum]) {
		//var audiobookUpdate = 'UPDATE Audiobook SET PreferredChoice="'+select+'", Explanation="'+textArea+'" WHERE UserId='+userID
		var audiobookUpdate = 'UPDATE Audiobook SET PreferredChoice=?, Explanation=? WHERE UserId=?';
		con.query(audiobookUpdate, [select, textArea, userID], function (err, result) {
			if (err) throw err;
			console.log("1 response updated in Audiobook table");
		});
	}
	else {
		req.session["audiobook"+taskNum] = true;
		var audiobookQuery = "INSERT INTO Audiobook (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES (?,?,?,?,?,?)";
		var audiobookQueryForDebug = "INSERT INTO Audiobook (TaskNum, UserId, VoiceVideo, GestureVideo, PreferredChoice, Explanation) VALUES ('" + taskNum + "'," + userID + ",'" + voiceVideoPath + "','" + gestureVideoPath + "','" + select + "','" + textArea + "')";
		if (debug) {
			console.log("Audiobook query is...");
			console.log(audiobookQueryForDebug);
		}

		//query to insert user response into table
		con.query(audiobookQuery, [taskNum, userID, voiceVideoPath, gestureVideoPath, select, textArea], function (err, result) {
			if (err) throw err;
			console.log("1 response inserted in Audiobook table");
		});
	}
	res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
	res.setHeader("Vary", "Origin");
	res.send();

});
// //redirect people to a randomly selected leisure task after they complete one of the work scenarios
// app.get('/leisuretask/', function (req, res) {
// 	if (debug) {
// 		console.log("\nIn leisure task...");
// 		console.log("The session usrid is..." + req.session.usrid);
// 	}

// 	//Generate a random number, 0 or 1 inclusive, to determine which task they go to
// 	var randNum = Math.floor(Math.random() * 2);
// 	if (debug) { randNum = 1; }
// 	if (randNum) {
// 		//Generate a random number, 1 or 5 inclusive
// 		let randTaskNum = 1 + Math.floor(Math.random() * 5);
// 		res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
// 		res.redirect(`http://ec2-3-80-137-223.compute-1.amazonaws.com/6_karaoke_t${randTaskNum}.html`);
// 		res.send();
// 	} else {
// 		let randTaskNum = 1 + Math.floor(Math.random() * 5);
// 		res.setHeader("Access-Control-Allow-Origin", "http://ec2-3-80-137-223.compute-1.amazonaws.com");
// 		res.redirect(`http://ec2-3-80-137-223.compute-1.amazonaws.com/7_audiobook_t${randTaskNum}.html`);
// 		res.end();
// 	}
// });

app.post('/end/', function (req, res) {
	req.session.destroy();
	sessionStore.close();
});

app.get("/hasdonetask", function(req, res) {
	res.send(req.session);
})

app.get('/test', function (req, res) {
	res.send("Ok")
});
