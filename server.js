var express = require('express');
var app = express();
var mysql = require('mysql');
var fs = require('fs');
var https = require('https');
var bodyParser = require('body-parser');
var expressip = require('express-ip');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
//print out console.logs if debug is true
var debug = true;

// for parsing application/xwww-
app.use(bodyParser.urlencoded({extended: true}));

//for getting IP address info
app.use(expressip().getIpInfoMiddleware);

app.use(cookieParser());

//connection parameters
const options = {
 	host: "0.0.0.0",
 	user: "mobileoffice",
 	password: "UtJsHCbKJ33Tvav",
	database: "mobileoffice_db",
	port: 3306,
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
con.connect(function(err) {
 	if (err) throw err;
 	console.log("Connected!");
});


//get certificates for server
const optionsSecure = {
    key: fs.readFileSync('../certs/cs.wellesley.edu.key'),
    cert: fs.readFileSync('../certs/cs_wellesley_edu_cert.cer')
};

// serverconnection over https
https.createServer(optionsSecure, app).listen(8133, function () {
  console.log("App listening at port 8133");
})

//route for index.html page after submission, sends users to consent form
app.post('/start/',function(req,res){
	if(debug){console.log("Starting route and destroying session vars...\n");
			 req.session.destroy();
			 sessionStore.close();
			 }
	res.redirect('https://cs.wellesley.edu/~mobileoffice/study/0_consent.html');
    res.end();
});


//handling the submission of the consent form
app.post('/consentform/',function(req,res){
	//if user has already submitted the form, send them to the next page.
	if(req.session.usrid)
	 {
		if(debug){
			console.log("Consent form has already been submitted for..."+req.session.usrid);
		};
		res.redirect('https://cs.wellesley.edu/~mobileoffice/study/1_background.html');
				res.end();
   	} 
	//if this is the first time the user submits the consent form.
	else
	  {
		//gets IP adress and stores in the session
		var ipAddress = req.ipInfo.ip;

		//gets the name and date
		var name = req.body.name;
		var date = req.body.date;

		//adds the name, IP adress, and time stamp (called StartTime) to verify when users began the survey to the Users table
		var d = new Date();

		var usrSql = "INSERT INTO Users (Name,StartTime,IpAddress) VALUES ('"+name+"','"+d+"','"+ipAddress+"')";

		con.query(usrSql, function (err, result) {
			if (err) {throw err;} 
			else{
				storeUserID();
			}
		});

		//gets and stores the user ID of the user who just submitted the form
		function storeUserID(){
			var getIDSql = "select UserId from Users where Name='"+name+"' AND StartTime='"+d+"' AND IpAddress='"+ipAddress+"'";

			con.query(getIDSql, function (err, result) {
				if (err) {throw err;} 
				else {
					//sends users to the next part of the study
					consentFormInsert(result[0].UserId);
					req.session.usrid = result[0].UserId;
					res.redirect('https://cs.wellesley.edu/~mobileoffice/study/1_background.html');
					res.end();
				};
			});
	}
	
	//adds the name, id, and date of the consent form submission to Consentform table
	function consentFormInsert(userID){
		var consentSql = "INSERT INTO Consentform (FormDate, Name, UserId, IpAddress) VALUES ('"+date+"','"+name+"','"+userID+"','"+ipAddress+"')";
	
		con.query(consentSql, function (err, result) {
		if (err) throw err;
			console.log("1 record inserted in Consent table");
		});
	}

	//adds data to the consentform log
	fs.appendFile('consentform.log',
	                 // JSON is easy to parse
	                 JSON.stringify(req.body)+'\n',
	                 function (err, data) {
	                     if(err) {
	                         console.log('error writing to consentform.log: '+err);
	                     }
	                 });
   }
});

//redirect users to a randomly selected work task after they complete the example scenario
app.post('/worktask/',function(req,res){
	
	if(debug){
		console.log("\nIn work task...");
		console.log("The session usrid is..."+req.session.usrid);
	}
	
	//Generate a random number, 0 or 1 inclusive, to determine which task they go to
	var randNum = Math.floor(Math.random() * 2);
	
	if(debug){randNum = 1;}
	
	if (randNum){
		if(debug){console.log("randNum is: "+randNum);}
		res.redirect('https://cs.wellesley.edu/~mobileoffice/study/5_podcast_t1.html');
    	res.end();
	} 
	else 
	{
		if(debug){console.log("randNum is: "+randNum);}
		res.redirect('https://cs.wellesley.edu/~mobileoffice/study/8_presentation_t1.html');
    	res.end();
	}
});

//get user submission from Podcast tasks
app.post('/podcast/',function(req,res){
	if(debug){
		console.log("Task type is..."+req.body.taskType);
		console.log("Task num is..."+req.body.taskNum);
		console.log("Select is..."+req.body.select);
		console.log("Textarea is..."+req.body.textarea);
	}
	
	var taskType = req.body.taskType;
	var taskNum = req.body.taskNum;
	var select = req.body.select;
	var textArea = req.body.textarea;
	var userID = req.session.usrid
	
	//if submit button has already been pressed, update the session
	if (req.session.podSubmitted) 
	{
		var podcastUpdate = 'UPDATE Podcast SET PreferredChoice="'+select+'", Explanation="'+textArea+'" WHERE UserId='+userID
		
		con.query(podcastUpdate, function (err, result) {
		if (err) throw err;
			console.log("1 response updated in Podcast table");
		});
	} 
	else 
	{
		req.session.podSubmitted = 1;	
		
		//get session var for Blob
		req.session.

		//query to insert user response into table
		con.query('INSERT INTO Podcast (TaskNum, UserId, PreferredChoice, Explanation) VALUES ("'+taskNum+'",'+userID+',"'+select+'","'+textArea+'")', function (err, result) {
		if (err) throw err;
			console.log("1 response inserted in Podcast table");
		});
	}
	
	var nextTask = parseInt(taskNum, 10)+1;
	
	if(debug){ console.log("Next task num is..."+nextTask)
			   console.log("Full URL for nextTask is..."+'https://cs.wellesley.edu/~mobileoffice/study/5_podcast_t'+nextTask+'.html')
			 }
	
	res.redirect('https://cs.wellesley.edu/~mobileoffice/study/5_podcast_t'+nextTask+'.html');
    res.end();
});

//redirect people to a randomly selected leisure task after they complete one of the work scenarios
app.post('/leisuretask/',function(req,res){
	
	//Generate a random number, 0 or 1 inclusive, to determine which task they go to
	var randNum = Math.floor(Math.random() * 2);
	if(debug){console.log("randNum is: "+randNum);}
	if (randNum){
		res.redirect('https://cs.wellesley.edu/~mobileoffice/study/6_karaoke_t1.html');
    	res.end();
	} else {
		res.redirect('https://cs.wellesley.edu/~mobileoffice/study/7_audiobook_t1.html');
    	res.end();
	}
});


app.post('/end/',function(req,res){
	req.session.destroy();
	sessionStore.close();
});

