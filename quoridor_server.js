(function () {
    var server,
        http = require('http'),
        fs = require('fs'),
        PORT = 9000;

    function checkJSON(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function realPath(str) {
        try {
            fs.realpathSync(str);
        }
        catch (e) {
            console.log('resource not found');
            return false;
        }
        return true;
    }

    server = http.createServer(function (req, res) {
        var treehash = '',
            files = fs.readdirSync('treehash').length,
            path, content;
        console.log('req url '+req.url);

        switch (req.url) {
            case '/':
                path = 'quoridor.html';
                content = 'text/html';
                break;
            case '/quoridor/src/css/qstyle.css':
                path = 'quoridor/src/css/qstyle.css';
                content = 'text/css'
                break;
            case '/quoridor/dist/quoridor.js':
                path = 'quoridor/dist/quoridor.js';
                content = 'text/javascript';
                break;
            case '/treehash':
                path = 'treehash/hash' + Number(files - 1) + '.json';
                break;
        }

        req.on('data', function (chunk) {
            treehash += chunk;
        });
        req.on('end', function () {
            if (checkJSON(treehash)) {
                path = 'treehash/hash' + files + '.json';
                fs.writeFile(path, treehash, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    path = '';
                });
                console.log('POSTed: ' + treehash);
            }
            treehash = '';
        });

        if (realPath(path)) {
            fs.readFile(path, 'utf8', function (err, data) {
                if (err) {
                    return console.log('1 ' + err);
                }
                res.writeHead(200, {'Content-Type': content, 'Content-Length': data.length});
                res.write(data, 'utf8', function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    res.end(data);
                });
            });
        }
        else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end();
        }

    }).listen(PORT);

    console.log('Listening on port: '+PORT);
})();