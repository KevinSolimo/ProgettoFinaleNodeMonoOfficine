//Express
const express = require("express");
const app = express();

//MongoDB
const MongoClient = require('mongodb').MongoClient;

//Cors per cossing site
const cors = require('cors');

//Server per socket
var http = require('http').createServer(app);
//Socket.io
const io = require('socket.io')(8000);

//Middleware
app.use(cors());

//Home
app.get('/', function(req, res) {
    res.send({ message: 'WebService MonoOfficine' });
});

//---SOCKET---//
io.on('connection', (socket) => {

    console.log("Connect");

    socket.on('position', (data) => {

        MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
            if (err) throw err;
            var dbo = db.db("Mono-Rent");

            var query = { QR_Code: data.QR, id_Utente: data.id_Utente, ora_Sblocco: new Date(data.date) };
            console.log(query);
            dbo.collection("Noleggio").find(query).toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                if (result.length == 1) {

                    var newvalues = { $push: { percorso: { lat: data.position.latitude, lng: data.position.longitude } } };

                    dbo.collection("Noleggio").updateOne(query, newvalues, function(err, result) {
                        if (err) throw err;
                    });

                } else {
                    db.close();
                }
            });
        });

    });

    socket.on('fixed', (data) => {
        console.log(data);
        MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
            if (err) throw err;

            var dbo = db.db("Mono-Rent");

            var query = { QR_Code: data.QR };

            dbo.collection("Monopattini").find(query).toArray(function(err, result) {
                if (err) throw err;

                if (result.length == 1) {

                    var newvalues = { $set: { usage: false } };

                    dbo.collection("Monopattini").updateOne(query, newvalues, function(err, result) {

                        if (err) throw err;

                        db.close();

                    });

                } else {

                    db.close();
                }
            });
        });
    });

});


//---API---//

// Load Position Scooter
app.get('/api/monopattini', function(req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");
        var query = { usage: false };
        dbo.collection("Monopattini").find(query).toArray(function(err, result) {
            if (err) {
                throw err;
            }
            db.close();
            res.send(result);
        });
    });
});

app.get('/api/unlock/:QR/:id_Utente/', function(req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");

        var query = { QR_Code: req.params.QR };

        dbo.collection("Monopattini").find(query).toArray(function(err, result) {
            if (err) res.send({ state: 'ko' });;

            if (result.length == 1) {

                var newvalues = { $set: { usage: true } };
                dbo.collection("Monopattini").updateOne(query, newvalues, function(err, result) {

                    if (err) res.send({ state: 'ko' });

                    var date = new Date();

                    io.sockets.emit("unlock", { QR: req.params.QR, id_Utente: req.params.id_Utente, date: date });

                    var insert = { id_Utente: req.params.id_Utente, QR_Code: req.params.QR, ora_Sblocco: date, percorso: [] };
                    dbo.collection("Noleggio").insertOne(insert, function(err, result) {
                        if (err) throw err;
                        db.close();
                        res.send({ state: 'ok', date: date });
                    });
                });

            } else {

                db.close();
                res.send({ state: 'ko' });

            }
        });
    });
});

app.get('/api/lock/:QR/:id_Utente/:date', function(req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
        if (err) res.send({ state: 'ko' });

        var dbo = db.db("Mono-Rent");

        var query = { QR_Code: req.params.QR };

        dbo.collection("Monopattini").find(query).toArray(function(err, result) {
            if (err) res.send({ state: 'ko' });;

            if (result.length == 1) {

                var newvalues = { $set: { usage: false } };

                dbo.collection("Monopattini").updateOne(query, newvalues, function(err, result) {

                    if (err) res.send({ state: 'ko' });;

                    var search = { QR_Code: req.params.QR, id_Utente: req.params.id_Utente, ora_Sblocco: new Date(req.params.date) }
                    var insert = { $set: { ora_Blocco: new Date() } };
                    dbo.collection("Noleggio").updateOne(search, insert, function(err, result) {
                        if (err) throw err;
                        console.log(search);
                        db.close();
                        io.sockets.emit("lock", { QR: req.params.QR });
                        res.send({ state: 'ok' });
                    });
                });

            } else {

                db.close();
                res.send({ state: 'ko' });

            }
        });
    });
});

app.get('/api/broken/:QR', function(req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");

        var query = { QR_Code: req.params.QR };

        dbo.collection("Monopattini").find(query).toArray(function(err, result) {
            if (err) res.send({ state: 'ko' });;

            if (result.length == 1) {

                var newvalues = { $set: { usage: true } };

                dbo.collection("Monopattini").updateOne(query, newvalues, function(err, result) {

                    if (err) res.send({ state: 'ko' });;

                    db.close();
                    io.sockets.emit("broken", { QR: req.params.QR });
                    res.send({ state: 'ok' });

                });

            } else {

                db.close();
                res.send({ state: 'ko' });

            }
        });
    });
});


//---CLOSE API---//

http.listen(8080, function() {
    console.log('Example app listening on port 8080!');
});