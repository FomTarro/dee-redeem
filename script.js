const TOKEN_KEY = `TWITCH_REDEEM_TOKEN_${document.title}`;
const REDEEM_KEY = `TWITCH_REDEEM_ID_${document.title}`;

const params = new URLSearchParams(location.search)
let listeningForRewardId = false;

function listenForRewardId() {
    listeningForRewardId = true;
    console.log("Listening for Reward ID..");
    document.getElementById("reward_title").innerHTML = "Listening for reward ID..."
}

function foundRewardId(id, title) {
    localStorage.setItem(REDEEM_KEY, JSON.stringify({
        title: title,
        id: id,
    }));
    listeningForRewardId = false;
    document.getElementById("reward_title").innerHTML = title;
}

if (localStorage.getItem(REDEEM_KEY)) {
    const rewardInfo = JSON.parse(localStorage.getItem(REDEEM_KEY));
    foundRewardId(rewardInfo.id, rewardInfo.title);
}

if (params.has('token')) {
    const token = params.get('token');
    localStorage.setItem(TOKEN_KEY, token);
    
    function nonce(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }


    function connect() {
        var heartbeatInterval = 1000 * 60; //ms between PING's
        var reconnectInterval = 1000 * 3; //ms to wait before reconnect
        var heartbeatHandle;

        const ws = new WebSocket('wss://pubsub-edge.twitch.tv');

        function heartbeat() {
            message = {
                type: 'PING'
            };
            ws.send(JSON.stringify(message));
        }
        
        function listen(topic) {
            message = {
                type: 'LISTEN',
                nonce: nonce(15),
                data: {
                    topics: [topic],
                    auth_token: token
                }
            };
            ws.send(JSON.stringify(message));
        }

        ws.onopen = function(event) {
            heartbeat();
            heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
            function responseHandler(){
                if (this.responseText) {
                    const parsed = JSON.parse(this.responseText);
                    const userId = parsed.user_id;
                    const userName = parsed.login;
                    document.getElementById('user_name').innerHTML = userName;
                    listen(`channel-points-channel-v1.${userId}`);
                }
            }
            const xhr = new XMLHttpRequest();
            xhr.addEventListener("load", responseHandler);
            xhr.open("GET", "https://id.twitch.tv/oauth2/validate");
            xhr.setRequestHeader("Authorization", `OAuth ${token}`);
            xhr.send();
        };

        ws.onerror = function(error) {
            console.error(error);
        };

        ws.onmessage = function(event) {
            message = JSON.parse(event.data);
            // console.log(message);
            if (message.type === 'RECONNECT') {
                console.log("Reconnecting...");
                setTimeout(connect, reconnectInterval);
            } else if (message.type === 'MESSAGE') {
                const innerMessage = JSON.parse(message.data.message);
                if (innerMessage.type === 'reward-redeemed') {
                    // console.log(innerMessage);
                    const rewardId = innerMessage.data.redemption.reward.id;
                    const rewardTitle = innerMessage.data.redemption.reward.title;
                    const rewardRedeemerName = innerMessage.data.redemption.user.login;
                    if (listeningForRewardId === true) {
                        foundRewardId(rewardId, rewardTitle);
                    }
                    // TODO: this can easily null out if there isn't a redeem stored.
                    if (rewardId === JSON.parse(localStorage.getItem(REDEEM_KEY)).id) {
                        console.log(rewardId + " : " + rewardRedeemerName);
                        redeem(rewardRedeemerName);
                    }
                }
            }
        };

        ws.onclose = function() {
            clearInterval(heartbeatHandle);
            setTimeout(connect, reconnectInterval);
        };
    }
    connect();
} else {
    if (localStorage.getItem(TOKEN_KEY)) {
        const token = localStorage.getItem(TOKEN_KEY);
        document.getElementById("token_input").value = token;
        document.getElementById("token_submit").click();
    }
}

function redeem(redeemerName) {
    const template = document.getElementById('reward_template');
    const area = document.getElementById("reward_space");
    const arrow = template.content.cloneNode(true).querySelector('div');
    arrow.querySelector('.reward_user').innerHTML = redeemerName;
    arrow.style.top = `${Math.random() * 100}%`;
    arrow.style.left = `${Math.random() * 100}%`;
    area.appendChild(arrow);
    const timeout = window.setTimeout(() => {
        arrow.remove();
    }, 10 * 1000);
}

let sleepTimeout;
addEventListener("mousemove", (event) => {
    document.getElementById("token_controls").classList.remove('hidden');
    if (sleepTimeout) {
        clearTimeout(sleepTimeout);
    }
    sleepTimeout = window.setTimeout(() => {
        document.getElementById("token_controls").classList.add('hidden');
    }, 5 * 1000);
})
// CLIENT ID imported from additional script
document.getElementById('token_link').href = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=https://twitchapps.com/tokengen/&scope=channel%3Aread%3Aredemptions%20chat%3Aread`
