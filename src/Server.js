(function () {
    var client, search;
    var PORT = 9000,
        express = require('express'),
        app = express(),
        server = app.listen(PORT, function () {
            console.log('Listening on port: %s', PORT);
        }),
        io = require('socket.io').listen(server);
    client = require('redis').createClient();

    client.on('connect', function () {
        console.log('connected to redis');
        search = new MonteCarloTreeSearch(client);
        search.init();
    });

    io.on('connection', function (socket) {
        console.log('connected to ' + socket.id);
        socket.on('getData', function (key, callback) {
            console.log("data: " + key);
            callback("data");
        });
    });

    app.use(express.static('.'));
    app.get('/', function (req, res) {
        res.sendFile('quoridor.html', {root: '/home/ben/workspace/quoridorserver'});
    });
})();