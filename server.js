var express = require('express');
var app = express();
var mysql = require('mysql');

//create the connection parameters
var con = mysql.createConnection({
 	host: "0.0.0.0",
 	user: "mobileoffice",
 	password: "balichmobileoffice",
	database: "mobileoffice_db",
	port: 10019
});

//establish connection with the database
con.connect(function(err) {
 	if (err) throw err;
 	console.log("Connected!");
});

//listening port
var server = app.listen(10019, function () {
 	var host = server.address().address
 	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port);
});

// //handling the submission of the consent form
// app.post('/consentform/',function(req,res){
// 	console.log("submission received");
// 	req.on('data',function(data){
// 		console.log(JSON.parse(data.name));
// 		console.log(data.date)
// 	});
// 	return res.redirect('http://cs.wellesley.edu/~mobileoffice/study/background.html');
// });
