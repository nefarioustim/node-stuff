var sys = require("sys"),
    http = require("http"),
    port = 8124;

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("Hello World!");
    response.end();
}).listen(port);

sys.puts("Server running on port " + port);