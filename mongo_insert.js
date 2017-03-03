//script to insert data into a mongo db

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  
	var logSchema = mongoose.Schema({
	    app_name: String,
	    app_data_log: mongoose.Schema.Types.Mixed,
	    updated: { type: Date, default: Date.now },
	    user_agent: String
	});

	// NOTE: methods must be added to the schema before compiling it with mongoose.model()
	/*
	kittySchema.methods.speak = function () {
	  var greeting = this.name
	    ? "Meow name is " + this.name
	    : "I don't have a name";
	  console.log("speak func: " + greeting);
	}
	*/

	var Log = mongoose.model('Log', logSchema);

	var newlog = new Log({ app_name: "vish editor",
	    app_data_log: {"ve_version": "2", "ve_status":"online", "excursion_id": 12, "json":{"hola":"true"}},
	    updated: new Date,
	    user_agent: "Mozilla" 
	});

	//to mark it as modified and save it to db
	newlog.markModified('app_data_log');

	newlog.save(function (err, newlog) {
	  if (err) {return console.error(err);}
	  console.log("salvado el obj con id: " + newlog.id);
	  Log.find(function (err, logs) {
		  if (err) { return console.error(err);}
		  console.log("Resultado find: " + logs);
		  
		  mongoose.disconnect();
		  console.log("Conexión cerrada");
		})
	});


});