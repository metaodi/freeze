var http = require('http');
var Botkit = require('botkit');
var _ = require('underscore');
var controller = Botkit.slackbot();

var freeze = controller.spawn({
  token: process.env.token
});
freeze.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

function matcher(text) {
    return function(pattern) {
        var re = new RegExp(pattern, 'i');
        return re.test(text);
    };
}

var requestConfig = [
    {
        'pattern': ['hi', 'hello', 'hey', 'uptime', 'identify yourself', 'who are you', 'what is your name', 'what do you do', 'can you help me'],
        'answerFn': uptime
    },
];

function uptime(bot, message) {
    var hostname = os.hostname();
    var uptime = format.uptime(process.uptime());
    
    var msg = ':robot_face: I am a bot that has been running for ' + uptime + ' on ' + hostname + ".\n";
    bot.reply(message, msg);
}

function didNotUnderstand(bot, message) {
    var msg = 'Sorry, I did not understand you.' + "\n";
    bot.reply(message, msg);
}


controller.hears(['.*'], ['direct_message,direct_mention'], function(bot, message) {
    var noAnswer = _.every(requestConfig, function(request) {
        var matched = _.any(request.pattern, matcher(message.text));
        if (matched) {
            request.answerFn(bot, message);
            return false; //break out of every()
        }
        return true; // continue with next requestConfig
    });
    if (noAnswer) {
        didNotUnderstand(bot, message);
    }
});


// To keep Heroku's free dyno awake
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Ok, dyno is awake.');
}).listen(process.env.PORT || 5000);
