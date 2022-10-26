const { WebSocketServer } = require('ws');
const fs = require("fs");
const WebSocket = require('ws');

var Bots = [];
var proxies = fs.readFileSync("./proxies.txt", {encoding:"utf-8"}).split("\r\n");

function getBuffer(len) {
    return new DataView(new ArrayBuffer(len));
}

var splitBuffer = getBuffer(1);
splitBuffer.setUint8(0, 17);
splitBuffer = splitBuffer.buffer;

var ejectMassBuffer = getBuffer(1);
ejectMassBuffer.setUint8(0, 21);
ejectMassBuffer = ejectMassBuffer.buffer;

var moveToData = null;

proxies.filter(x => x == new RegExp("\d+\.\d+\.\d+\.\d+:\d+"));

const Bot = require('./botclass.js').bot;
const resetConnected = require("./botclass.js").resetConnected;
var wsUrl = null;
var botAmount = parseInt(require("./config.json").botsAmount);

function startBots(clientWS) {
    if(Bots.length > 0) {
        Bots.forEach(x => {
            if(x.ws.close) {
                x.ws.close();
                x.ws = null;
            };
            x.closed = true;
	        clearInterval(x.spawnLoop);
	        delete x;
        });
        resetConnected();
    }
    for (let i=0; i < botAmount; i++) {
        Bots[i] = new Bot('agario.tube', i);
        Bots[i].connect(wsUrl, proxies[Math.floor(Math.random()*proxies.length)], clientWS); 
    };
}

function moveBots() {

    Bots.forEach(x => {
        x.send(moveToData);
    })

}

function executeCommand(x) {
    let cmd = x == "17" ? splitBuffer : (x=="21") ? ejectMassBuffer : null;
    if(!cmd) return;
    Bots.forEach(x => {
        x.send(cmd);
    });
}

var server = new WebSocketServer({
    port: 7889
})

server.on("connection", function(ws) {
    ws.on("open", function() {
        console.log("Server connection open, stable.");
    });

    ws.on("message", function(data) {
        if(data.toString("utf-8", 0, 6) === "wss://") {
            wsUrl = data.toString();
            startBots(ws);
            return;
        };
        if(data.buffer.byteLength == 8) {
            executeCommand(parseInt(data.toString()));
            return;
        }
        moveToData = data;
        moveBots();
    });
});