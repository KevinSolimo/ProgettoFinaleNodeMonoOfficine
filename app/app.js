const express = require("express");
const app = express();

//MongoDB
const MongoClient = require('mongodb').MongoClient;
//Cors per cossing site
const cors = require('cors');

app.use(cors());

//Home
app.get('/', function (req, res) {
    res.send({ message: 'WebService MonoOfficine' });
});

//---API---//

// Load Position Scooter
app.get('/api/monopattini', function (req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");
        var query = { usage: false };
        dbo.collection("Monopattini").find(query).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            db.close();
            res.send(result);
        });
    });
});

app.get('/api/unlock/:QR', function (req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");

        var query = { QR_Code: req.params.QR };

        dbo.collection("Monopattini").find(query).toArray(function (err, result) {
            if (err) throw err;

            if (result.length == 1) {

                var newvalues = { $set: { usage: true } };

                dbo.collection("Monopattini").updateOne(query, newvalues, function (err, result) {

                    if (err) throw err;

                    db.close();
                    res.send(result);

                });

            } else {

                db.close();
                res.send(result);

            }
        });
    });
});

app.get('/api/lock/:QR', function (req, res) {
    MongoClient.connect('mongodb+srv://ksolimo:wkyP8ch7MvVZnul8@cluster0-yosjr.mongodb.net/test?retryWrites=true,{useNewUrlParser: true}', function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Mono-Rent");

        var query = { QR_Code: req.params.QR };

        dbo.collection("Monopattini").find(query).toArray(function (err, result) {
            if (err) throw err;

            if (result.length == 1) {

                var newvalues = { $set: { usage: false } };

                dbo.collection("Monopattini").updateOne(query, newvalues, function (err, result) {

                    if (err) throw err;

                    db.close();
                    res.send(result);

                });

            } else {

                db.close();
                res.send(result);

            }
        });
    });
});

//---API---//

app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});