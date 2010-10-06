var SERVER_PORT = 8124,
    sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    events = require("events"),
    twitter = http.createClient(80, 'api.twitter.com'),
    tweet_emitter = new events.EventEmitter(),
    load_static_file = function(uri, response) {
        var filename = path.join(process.cwd(), uri);
        path.exists(filename, function(exists) {
            if(!exists) {
                response.writeHead(404, {"Content-Type": "text/plain; charset=UTF-8"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }
        
            fs.readFile(filename, "binary", function(err, file) {
                if(err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }
            
                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            });
        });
    };

setInterval(function(){
    var request = twitter.request('GET', '/1/statuses/public_timeline.json', {'host': 'api.twitter.com'});
    
    request.on('response', function(response) {
        var body = '';
        
        sys.puts(JSON.stringify(response.headers));
        
        response.on('data', function(chunk) {
            body += chunk;
        });
        
        response.on('end', function() {
            var tweets = JSON.parse(body);
            if (tweets.length > 0) {
                tweet_emitter.emit('tweets', tweets);
            }
        });
    });
    
    request.end();
}, 5000);

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    if (uri === '/stream') {
        var listener = tweet_emitter.on('tweets', function(tweets) {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
            response.write(JSON.stringify(tweets));
            response.end();
            
            clearTimeout(timeout);
        });
        
        var timeout = setTimeout(function(){
            response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
            response.write(JSON.stringify(''));
            response.end();
            
            sys.put(listener);
            
            //tweet_emitter.removeListener(listener);
        }, 10000);
    } else {
        load_static_file(uri, response);
    }
}).listen(SERVER_PORT);

sys.puts('Server running at localhost:' + SERVER_PORT);