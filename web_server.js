var util = require("util"),
    http = require('http'),
    url = require('url'),
    fs = require('fs'),
    qs = require('querystring');

var server;
var positions = {};

function removeOldMessages() {

    var currentTime = new Date();
    for (var key in positions) {
        if (positions[key].messages) {
            for (var i in positions[key].messages) {
                if (currentTime - positions[key].messages[i].time > 5000) {
                    delete positions[key].messages[i];
                }
            }
        }
    }
}

function removeInactiveSessions() {

    var currentTime = new Date();
    for (var key in positions) {
        if (currentTime - positions[key].time > 5000) {
            delete positions[key];
            console.log("Deleting session!");
        }
    }
}

String.prototype.escape = function() {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return this.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
};

fs.readFile('./index.html', function(err, html) {

    if (err) {
        throw err;
    }

    server = http.createServer(function(request, response) {

        if (request.method == "POST") {

            var data = "";

            request.on('data', function(chunk) {
                data += chunk;
            });

            request.on("end", function() {
                var json = qs.parse(data);
                var session = json.session;
                var color = json.color;
                var x = json.x;
                var y = json.y;
                var message = json.message;

                if (typeof positions[session] == "undefined")
                    positions[session] = new Object;

                positions[session].x = x;
                positions[session].y = y;
                positions[session].color = color;

                positions[session].time = new Date();

                if (typeof positions[session].messages == "undefined")
                    positions[session].messages = new Array;

                if (message != "" && message != undefined) {
                    positions[session].messages.push({
                        message: message.escape(),
                        time: new Date()
                    });
                }

            });

            removeOldMessages();
            removeInactiveSessions();

            response.writeHead(200, {
                "Content-Type": "application/json"
            });
            response.end(JSON.stringify(positions));

        } else {

            response.writeHead(200, {
                "Content-Type": "text/html"
            });
            response.write(html);
            response.end();

        }

    }).listen(80);

    console.log("Server is listening");

});