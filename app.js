var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var five = require("johnny-five");


var buf = [],
  interval = 1000, //msec
  curTime = new Date().getTime();
var board = new five.Board();


server.listen(8081);
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static('static'));

board.on("ready", function () {
  var temp = new five.Temperature({
    pin: "A0",
    controller: "LM35"
  });

  sendData(temp);
});

function sendData(temp) {
  io.on('connection', function (socket) {
    temp.on("change", function () {
      console.log("Temp: %d", this.celsius);
      avgTemp(this.celsius, function(val) {
        console.log('Avg temp ===> ', val);
        socket.emit('temp', {data: val});
      });
    });
  });
}

function avgTemp(temp, cb) {
  if(new Date().getTime() - curTime <= interval) {
    buf.push(temp);
  } else {
    var avgVal = buf.reduce(function(a, b) { return a + b; }, 0);
    avgVal /= buf.length;

    //reset
    buf = []; curTime =  new Date().getTime();

    cb(avgVal);
  }
}