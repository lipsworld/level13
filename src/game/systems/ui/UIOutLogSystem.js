define([
    'ash', 'game/nodes/LogNode', 'game/constants/UIConstants',
], function (Ash, LogNode, UIConstants) {
    var UIOutLogSystem = Ash.System.extend({
	
	logNodes: null,
	
	playerMovedSignal: null,
	
	lastUpdateTimeStamp: 0,
	updateFrequency: 1000 * 15,

        constructor: function (playerMovedSignal) {
	    this.playerMovedSignal = playerMovedSignal;
        },

        addToEngine: function (engine) {
	    var logSystem = this;
            this.logNodes = engine.getNodeList(LogNode);
	    this.onPlayerMoved = function(playerPosition) {
		logSystem.checkPendingMessages(playerPosition);
	    };
	    this.playerMovedSignal.add(this.onPlayerMoved);
        },

        removeFromEngine: function (engine) {
            this.logNodes = null;
	    this.playerMovedSignal.remove(this.onPlayerMoved);
        },

        update: function (time) {
	    var timeStamp = new Date().getTime();
	    var isTime = timeStamp - this.lastUpdateTimeStamp > this.updateFrequency;
	    var hasNewMessages = false;
	    
	    var messages = [];
            for (var node = this.logNodes.head; node; node = node.next) {
		messages = messages.concat(node.logMessages.messages);
		hasNewMessages = hasNewMessages || node.logMessages.hasNewMessages;
		node.logMessages.hasNewMessages = false;
            }
	    
	    if(!hasNewMessages && !isTime) return;
	    
	    this.pruneMessages();
	    this.refreshMessages(messages);
	    this.lastUpdateTimeStamp = timeStamp;
	},
	
	checkPendingMessages: function(playerPosition) {
	    var validLevel;
	    var validSector;
	    var validInCamp;
            for (var node = this.logNodes.head; node; node = node.next) {
		var pendingMessages = node.logMessages.messagesPendingMovement;
		for(var i in pendingMessages) {
		    var msg = node.logMessages.messagesPendingMovement[i];
		    validLevel = !msg.pendingLevel || msg.pendingLevel == playerPosition.level;
		    validSector = !msg.pendingSector || msg.pendingSector == playerPosition.sector;
		    validInCamp = (typeof msg.pendingInCamp === "undefined") || msg.pendingInCamp == playerPosition.inCamp;
		    if (validLevel && validSector && validInCamp) {
			node.logMessages.showPendingMessage(msg);
		    }
		}
            }
	},
	
	refreshMessages: function(messages) {
	    $("#log ul").empty();
	    	
	    var msg;
	    var liMsg;
	    for	(var index = 0; index < messages.length; index++) {
		msg = messages[index];
		var li = '<li';
		if (msg.loadedFromSave)
		    li += ' class="log-loaded"';
		li += '><span class="time">' + UIConstants.getTimeSinceText(msg.time) + " ago" + '</span> ';
		li += '<span class="msg">' + msg.text;
		if (msg.combined > 0) li += '<span class="msg-count"> (' + (msg.combined + 1) + ")</span>";
		li += '</span></li>';
		liMsg = $(li);
		$( "#log ul" ).prepend( liMsg );
	    }
	},
	
	pruneMessages: function() {
	    var maxMessages = 50;
	    var messagesToPrune = 10;
	    		
	    var nodeMessages;
	    for (var node = this.logNodes.head; node; node = node.next) {
		nodeMessages = node.logMessages.messages;		    
		if (nodeMessages.length > maxMessages) {
		    nodeMessages.splice(0, nodeMessages.length - maxMessages + messagesToPrune);
		}
	    }
	},

    });

    return UIOutLogSystem;
});