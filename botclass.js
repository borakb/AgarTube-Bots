const WebSocket = require("ws");
const fs = require("fs");
const { join } = require("path");
const config = require("./config.json");
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require("socks-proxy-agent");

let proxyType = 0
var proxyagent = {};
var socks = proxyType == 4 || proxyType == 5 ? proxyType : null;

if(config.proxyType == "socks5") {
    proxytype = 5;
} else if(config.proxyType == "socks4") {
    proxytype = 4;
} else if(config.proxyType == "https") {
    proxytype = 0;
};

var proxies = fs.readFileSync("./proxies.txt", {encoding: "utf-8"}).split("\r\n");
var botAmount = parseInt(require("./config.json").botsAmount);

var connected = 0;

function prepareData(a) {
    return new DataView(new ArrayBuffer(a));
}

function Bot(name, id) {

    this.hasConnected = false;

    this.nick = name;
    this.id = id;
    this.ws = null;
    this.cliWS = null;
    this.wsUrl = null;
    this.proxy = null;

}


Bot.prototype = {

    connect: function(wsUrl, proxy, cliWS) {


        let agent2;

        this.closed = false;
	    this.spawnLoop = null;
        this.wsUrl = wsUrl;
        this.cliWS = cliWS;
        this.retryCount = 0;
        // if this.proxy
        if(!proxy) {
            while(!proxy) {
                proxy = proxies[Math.floor(Math.random() * proxies.length)]
            }
        }

        if(typeof proxy == 'string') {
            this.proxy = proxy.split(":");
        }

        if(socks) {
            agent2 = new SocksProxyAgent({
                host: proxy[0],
                port: proxy[1],
                type: socks
            });
        } else {
            agent2 = new HttpsProxyAgent({
                host: proxy[0],
                port: proxy[1]
            })
        }

        this.ws = new WebSocket(wsUrl, {
            agent: agent2,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
                "Origin": "https://agario.tube"
            },
        });
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);

    },

    reconnect: function() {
        if(this.retryCount == 5) {
            this.proxy = proxies[Math.floor(Math.random()*proxies.length)];
            this.retryCount = 0;
        };
        this.retryCount++;
        if(this.ws && !this.ws.readyState == WebSocket.OPEN && this.ws.close) {
            this.ws.close();
        };

        setTimeout(function() {
            if(!this.closed) {
                    this.connect(this.wsUrl, this.proxy, this.cliWS);
            }
        }.bind(this), 1500);
    },

    onOpen: function() {
        console.log(`Bot #${this.id}: Connected to the server.`);
        connected++;
        this.hasConnected = true;
        this.sendCliWS(connected);
        this.sendInitKeys();
    },

    onClose: function() {
        console.log(`Bot #${this.id}: Disconnected from the server.`);
        if (this.hasConnected) {
            connected--;
	    this.hasConnected = false;
            this.sendCliWS(connected);
        }
        this.reconnect();
    },

    onError: function() {

        console.log(`Bot #${this.id}: Failed to connect. Retrying....`);

        // this.proxy = proxies[Math.floor(Math.random() * proxies.length)].split(":");
    },

    send: function(x) {
        if(this.ws && this.ws.readyState == WebSocket.OPEN) {
            this.ws.send(x);
        }
    },

    sendCliWS: function(x) {
        if(this.cliWS && this.cliWS.readyState == WebSocket.OPEN) {
            // let x = prepareData(2);
            // x.setUint8(0, connected);
            // x.setUint8(1, this.botsAmount);
            this.cliWS.send(JSON.stringify([connected, botAmount]));
        }
    },

    sendInitKeys: function() {
        var data;
        data = prepareData(5);
        data.setUint8(0, 254);
        data.setUint32(1, 5, true);
        this.send(data.buffer);
        data = prepareData(5);
        data.setUint8(0, 255);
        data.setUint32(1, 154669603, true);
        this.send(data.buffer);

        this.spawnLoop = setInterval(function() {
            this.spawn();
        }.bind(this), 1500);
    },

    spawn() {
        let textData = this.nick + '*254';
        var data = prepareData(1 + 2 * textData.length);
        data.setUint8(0, 0);
        var x1s = 0;
        for (; x1s < textData.length; ++x1s) {
          data.setUint16(1 + 2 * x1s, textData.charCodeAt(x1s), true);
        }
        this.send(data.buffer);
    },

}

function resetConnected() {
    connected = 0;
}

module.exports = { bot: Bot,  resetConnected: resetConnected};