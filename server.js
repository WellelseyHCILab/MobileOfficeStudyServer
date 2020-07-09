var express = require('express');
var app = express();
var mysql = require('mysql');
var fs = require('fs');
var bodyParser = require('body-parser');


// for parsing application/xwww-
app.use(bodyParser.urlencoded({extended: true}));

//create the connection parameters
var con = mysql.createConnection({
 	host: "0.0.0.0",
 	user: "mobileoffice",
 	password: "UtJsHCbKJ33Tvav",
	database: "mobileoffice_db",
	port: 3306
});

//establish connection with the database
con.connect(function(err) {
 	if (err) throw err;
 	console.log("Connected!");
});

//listening port
var server = app.listen(8133, function () {
 	var host = server.address().address
 	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port);
});

//handling the redirect
app.get('/consentform/',function(req,res){
	fs.readFile('0_consent.html', function(err,data){
		if(err){
			return console.error(err);
		}
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
        res.end();
	});
});

//handling the submission of the consent form
app.post('/consentform/',function(req,res){
	console.log('body');
    // the bodyParse creates this, as JS object with the form data
    console.log(req.body);

	req.on('data',function(data){
		console.log('data:');
		console.log(data.toString('utf8'));	
	});

	fs.appendFile('consentform.log',
	                 // JSON is easy to parse
	                 JSON.stringify(req.body)+'\n',
	                 function (err, data) {
	                     if(err) {
	                         console.log('error writing to consentform.log: '+err);
	                     }
	                 });

    res.redirect('http://cs.wellesley.edu/~mobileoffice/study/1_background.html');
    res.end();
});



