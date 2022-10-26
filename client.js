// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://agario.tube/*
// @icon         https://www.google.com/s2/favicons?domain=agario.tube
// @grant        none
// ==/UserScript==

var license = "1234";
var wsUrl = "ws://localhost:7889";

// LoadUI
var botsUI = document.createElement("div");
botsUI.style["background-color"] = "#666";
botsUI.style["width"] = "100px";
botsUI.style["height"] = "30px";
botsUI.style["opacity"] = "0.9";
botsUI.style["position"] = "absolute";
botsUI.style["border-radius"] = "15px";
botsUI.style["color"] = "#fff";
botsUI.style["top"] = "0";
botsUI.style["right"] = "0";
botsUI.style["bottom"] = "calc(90% - 30px)";
botsUI.style["left"] = "0";
botsUI.style["text-align"] = "center";
botsUI.style["margin"] = "auto";
botsUI.innerHTML = "Bots: 0/0";

var restartButton = document.createElement("button");
restartButton.style["width"] = "80px";
restartButton.style["height"] = "30px";
restartButton.style["position"] = "absolute";
restartButton.innerHTML = "Restart Bots";


var moveTo = null;

document.body.appendChild(botsUI);
document.body.appendChild(restartButton);

function User(key) {

    this.ws = null;
    this.key = key;
}

function keydownEventListener(event) {
   if(event.keyCode == 90) {
       this.send(17);
   } else if(event.keyCode == 88) {
       this.send(21);
   }
}

User.prototype = {
    connect: function() {
        this.moveInterval = null;
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = this.onMessage;
    },

    reconnect: function() {
        if(this.ws && !this.ws.readyState == WebSocket.OPEN && this.ws.close) {
            this.ws.close();
        };
        setTimeout(function() {
            this.connect();
        }.bind(this), 3000);
    },

    send: function(data) {
        if(this.ws && this.ws.readyState == WebSocket.OPEN && data) {
            this.ws.send(data);
        };
    },

    onOpen: function() {
        console.log("Established connection with the server.");
        this.send("wss://" + host + '?SCode=' + SCodes);
        this.moveInterval = setInterval(function() {
            if(moveTo) {
                this.send(moveTo);
            }
        }.bind(this), 60)

        document.addEventListener("keydown", keydownEventListener.bind(this));
    },

    onClose: function() {
        console.log("Lost connection with the server.");
        this.reconnect()
    },

    onMessage: function(data) {
        let x = JSON.parse(data.data);
        botsUI.innerHTML = "Bots: " + x[0] + "/" + x[1];
    },
}

var user = new User(license);
user.connect();

function restartBots() {
    if(user.ws.close) {
        user.ws.close();
    }
    clearInterval(user.moveInterval);
    document.removeEventListener("keydown", keydownEventListener);
    delete user;
    user = new User(license);
    user.connect();
}

restartButton.onclick = function() {
    restartBots();
    botsUI.innerHTML = "Bots: 0/0";
};

WebSocket.prototype.oldSend = WebSocket.prototype.send;

WebSocket.prototype.send = function(p) {
    this.oldSend(p);
    if(typeof p == "string") return;
    if(this.url == wsUrl) return;
    if(p instanceof ArrayBuffer && p.byteLength == 21) {
        moveTo = p;
    }
    return;
};
