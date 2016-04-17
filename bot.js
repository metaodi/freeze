var os = require('os');
var http = require('http');
var Botkit = require('botkit');
var _ = require('underscore');
var controller = Botkit.slackbot();

var freeze = controller.spawn({
  token: process.env.freezetoken
});
freeze.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

function uptime(bot, message) {
    var hostname = os.hostname();
    var uptime = uptimeFormat(process.uptime());
    
    var msg = ':robot_face: I am a bot that has been running for ' + uptime + ' on ' + hostname + ".\n";
    bot.reply(message, msg);
}

function uptimeFormat(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime !== 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

// answer direct questions with a generic uptime message
controller.hears(['.*'], ['direct_message,direct_mention'], function(bot, message) {
    uptime(bot, message);
});

controller.on('ambient', function(bot, message) {
    if (message.type === 'file_shared') {
        console.log("File has been shared!");
    }
    console.dir(message);
});

controller.on('message_received', function(bot, message) {
    if (message.type === 'file_shared') {
        console.log("File has been shared!");
        sendToClient(message); 
    }
    console.dir(message);
});

// serve the client page
var fs = require('fs');
var index = fs.readFileSync('index.html');
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(index);
}).listen(process.env.PORT || 5000);

// websocket server
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var connection;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

function sendToClient(jsonData) {
    if (connection && connection.connected) {
        connection.sendUTF(JSON.stringify(jsonData));
    }
}
