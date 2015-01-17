var twilio = require('twilio'),
	client = twilio('ACCOUNTSID', 'AUTHTOKEN'),
	cronJob = require('cron').CronJob;
 
var express = require('express'),
	bodyParser = require('body-parser'),
	app = express();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));
 
var api_key = "YOUR-API-KEY";
var db = "dailysms";
var collection = "users";

var usersRef = require('datamcfly').init(db, collection, api_key);

var numbers = [];

//	When the app is first loaded, grab all current phone numbers...
usersRef.on('value', function( response ) {
	response.forEach( function( data ){
		var snapshot = data.value();
		numbers.push( snapshot.phonenumber );
		console.log( 'Added number ' + snapshot.phonenumber );
	});
});

//	listen for new phone numbers being added to the system...
usersRef.on('added', function(snapshot) {
	var snapshot = snapshot.value();
	numbers.push( snapshot.phonenumber );
	console.log( 'Added number ' + snapshot.phonenumber );
});
 
var textJob = new cronJob( '0 18 * * *', function(){
	for( var i = 0; i < numbers.length; i++ ) {
		client.sendMessage( { to:numbers[i], from:'YOURTWILIONUMBER', body:'Hello! Hope you’re having a good day.'}, function( err, data ) {
			console.log( data.body );
		});
	}
},  null, true);
 
app.post('/message', function (req, res) {
	var resp = new twilio.TwimlResponse();
	if( req.body.Body.trim().toLowerCase() === 'subscribe' ) {
		var fromNum = req.body.From;
		if(numbers.indexOf(fromNum) !== -1) {
			resp.message('You already subscribed!');
		} else {
			resp.message('Thank you, you are now subscribed. Reply "STOP" to stop receiving updates.');
			usersRef.push({phonenumber:fromNum});
		}
	} else {
		resp.message('Welcome to Daily Updates. Text "Subscribe" receive updates.');
	}
	res.writeHead(200, {
		'Content-Type':'text/xml'
	});
	res.end(resp.toString());
});
 
var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});
