//script to connect to postgresql and console.log data

var Sequelize = require('sequelize');
var Promise = require('bluebird');
var mongoose = require('mongoose');

Promise.promisifyAll(mongoose);

//connection uri: 'postgres://user:pass@example.com:5432/dbname'
var sequelize = new Sequelize('postgres://postgres@localhost:5432/vish_september', {logging: false});
mongoose.connect('mongodb://localhost/vish_logs');
var logSchema = mongoose.Schema({
	    app_name: String,
	    app_data_log: {}, //same as mongoose.Schema.Types.Mixed
	    created_at: { type: Date, default: Date.now },
	    updated_at: { type: Date, default: Date.now },
	    tracking_system_entry_id: Number,
	    user_agent: String,
	    referrer: String, 
	    user_logged: Boolean,
	    related_entity_id: Number
	});

var Log = mongoose.model('Log', logSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function (callback) {	

	sequelize.query("SELECT COUNT(*) FROM tracking_system_entries", { type: sequelize.QueryTypes.SELECT})
	  .then(function(count) {
	  	console.log("hay filas: " + count[0].count);
	  	var min = 0;
	  	var max = count[0].count;
	  	var step = 100;

	  	var prom_arr = [];
	  	for (var i = min; (i+step) <= max; i=i+step) {
	  		prom_arr.push(query_select_and_save_in_mongo(i,i+step-1));
	  	};
	  	
		Promise.all(prom_arr).then(function(operators) {
	  		console.log("Hecho. Desconectamos las dos bbdd");  	
		  	sequelize.close();	  	
		  	mongoose.disconnect();
	  });
	});

});


var query_select_and_save_in_mongo  = function(from, to){
	if(from%1000===0){
		console.log("procesando fila: " + to);
	}
	return sequelize.query("SELECT * FROM tracking_system_entries WHERE id BETWEEN "+from+" and "+ to, { type: sequelize.QueryTypes.SELECT})
	  .then(function(tses) {
	  	var mis_proms = [];
	  	
	  	tses.forEach(function(element, index){
	  		var newlog = new Log({ 
	  			app_name: element.app_id,
			    app_data_log: element.data,
			    created_at: element.created_at,
			    updated_at: element.updated_at,
			    tracking_system_entry_id: element.tracking_system_entry_id,
			    user_agent: element.user_agent,
			    referrer: element.referrer, 
			    user_logged: element.user_logged,
			    related_entity_id: element.related_entity_id
			});

			//to mark it as modified and save it to db
			newlog.markModified('app_data_log');

			mis_proms.push(
				newlog.saveAsync().then(function(savedLog) {
				    //savedLog will be an array.  
				    //The first element is the saved instance of log
				    //The second element is the number 1
				    //console.log(JSON.stringify(savedLog));
				    return Promise.resolve();
				})
				.catch(function(err) {
				    console.log("There was an error");
				    console.log(err);
				})
			);			
	  	});
	  	return Promise.all(mis_proms);
	  });
};
