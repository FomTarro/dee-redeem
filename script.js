const TOKEN_KEY = `TWITCH_REDEEMS_TOKEN_${document.title}`;
const REWARD_KEY = `TWITCH_REDEEMS_REWARD_INFO_${document.title}`;
const SIZE_KEY = `TWITCH_REDEEMS_SIZE_${document.title}`;
const SIZE_VARIANCE_KEY = `TWITCH_REDEEMS_SIZE_VARIANCE_${document.title}`;

let listeningForRewardId = false;
const audio = new Audio('ding.wav');

document.getElementById('size-slider').addEventListener('change', () => {
    console.log(document.getElementById('size-slider').value);
    document.getElementById('size-slider-out').innerHTML = `${document.getElementById('size-slider').value}%`;
    localStorage.setItem(SIZE_KEY, document.getElementById('size-slider').value);
})

document.getElementById('variance-slider').addEventListener('change', () => {
    console.log(document.getElementById('variance-slider').value);
    document.getElementById('variance-slider-out').innerHTML = `${document.getElementById('variance-slider').value}%`;
    localStorage.setItem(SIZE_VARIANCE_KEY, document.getElementById('variance-slider').value);
})

if(localStorage.getItem(REWARD_KEY)){
    showRewardTitle(JSON.parse(localStorage.getItem(REWARD_KEY)).title);
}
if(localStorage.getItem(SIZE_KEY)){
    setSizeValue(localStorage.getItem(SIZE_KEY));
}
if(localStorage.getItem(SIZE_VARIANCE_KEY)){
    setVarianceValue(localStorage.getItem(SIZE_VARIANCE_KEY));
}

const urlParams = new URLSearchParams(location.search);
if(urlParams.has('token')){
    const authToken = urlParams.get('token');
    console.log("Using token: " + authToken);
    localStorage.setItem(TOKEN_KEY, authToken);
    var ws;
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
                auth_token: authToken
            }
        };
        ws.send(JSON.stringify(message));
    }
    
    function connect() {
        var heartbeatInterval = 1000 * 60; //ms between PING's
        var reconnectInterval = 1000 * 3; //ms to wait before reconnect
        var heartbeatHandle;
    
        ws = new WebSocket('wss://pubsub-edge.twitch.tv');
    
        ws.onopen = function(event) {
            heartbeat();
            heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
            function reqListener() {
                console.log(this.responseText);
                if(this.responseText){
                    const userId = JSON.parse(this.responseText).user_id;
                    const userName = JSON.parse(this.responseText).login;
                    listen(`channel-points-channel-v1.${userId}`);
                    document.getElementById('username').innerHTML = userName;
                }
            }
            const req = new XMLHttpRequest();
            req.addEventListener("load", reqListener);
            req.open("GET", "https://id.twitch.tv/oauth2/validate");
            req.setRequestHeader('Authorization', `OAuth ${authToken}`);
            req.send();
        };
    
        ws.onerror = function(error) {
            console.error(error);
        };
    
        ws.onmessage = function(event) {
            console.log(message);
            message = JSON.parse(event.data);
            if (message.type == 'RECONNECT') {
                setTimeout(connect, reconnectInterval);
            }else if(message.type == 'MESSAGE'){
                // there are sub-types in data.type...
                const innerMessage = JSON.parse(message.data.message);
                console.log(innerMessage);
                if(innerMessage.type == 'reward-redeemed'){
                    const redeemedBy = innerMessage.data.redemption.user.display_name;
                    const rewardId = innerMessage.data.redemption.reward.id;
                    const rewardTitle = innerMessage.data.redemption.reward.title;
                    if(listeningForRewardId == true){
                        setRewardId(rewardId, rewardTitle);
                    }else if(localStorage.getItem(REWARD_KEY)
                        && rewardId == JSON.parse(localStorage.getItem(REWARD_KEY)).id){
                        redeem(redeemedBy)
                        console.log("Redeemed!");
                    }
                    console.log(redeemedBy + " : " + rewardId);
                }
            }
        };
    
        ws.onclose = function() {
            clearInterval(heartbeatHandle);
            setTimeout(connect, reconnectInterval);
        };
    
    }
    connect();
}else{
    if(localStorage.getItem(TOKEN_KEY)){
        document.getElementById("token-input-field").value
        = localStorage.getItem(TOKEN_KEY);
        document.getElementById("token-input-submit").click();
    }
}

function nonce(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function setRewardId(rewardId, rewardTitle){
    console.log("Setting Reward ID: " + rewardId);
    localStorage.setItem(REWARD_KEY, JSON.stringify({
        id: rewardId,
        title: rewardTitle
    }));
    listeningForRewardId = false;
    showRewardTitle(rewardTitle);
}

function showRewardTitle(rewardTitle){
    document.getElementById("reward-title").innerHTML = rewardTitle;
}

function listenForRewardId(){
    console.log("Listening for Reward ID...");
    listeningForRewardId = true;
    document.getElementById("reward-title").innerHTML = "Listening for Reward...";
}

let sleepTimeout = undefined;
addEventListener("mousemove", (event) => {
    document.getElementById('controls').classList.remove('hidden');
    if(sleepTimeout){
        clearTimeout(sleepTimeout);
    }
    sleepTimeout = window.setTimeout(() => {
        document.getElementById('controls').classList.add('hidden');
    }, 5000)
});

function redeem(userName){
    const template = document.getElementById("redeem-template");
    const area = document.getElementById("redeem-area-inner");
    const arrow = template.content.cloneNode(true).querySelector("div");
    arrow.querySelector('.redeem-user').innerHTML = userName;
    arrow.style.top = `${Math.random()*100}%`
    arrow.style.left = `${Math.random()*100}%`
    const plusOrMinus = Math.random() < 0.5 ? -1 : 1;
    const variance = (+document.getElementById('variance-slider').value)/100;
    const arrowHeight = (+document.getElementById('size-slider').value);
    const finalArrowHeight = arrowHeight + (plusOrMinus * Math.random() * variance * arrowHeight);
    arrow.querySelector('.redeem-img').style.height = `${finalArrowHeight}vh`;
    arrow.querySelector('.redeem-user').style.fontSize = `${finalArrowHeight/5}vh`;
    arrow.querySelector('.redeem-user').style.marginTop = `${finalArrowHeight/16}vh`;
    area.appendChild(arrow);
    const timeout = window.setTimeout(() => {
        arrow.remove();
    }, 10000)
    audio.play();
}

function testRedeem(){
    redeem(document.getElementById("username").innerHTML);
}

function setSizeValue(value){
    document.getElementById('size-slider').value = +value;
    const event = new Event('change');
    document.getElementById('size-slider').dispatchEvent(event);
}

function setVarianceValue(value){
    document.getElementById('variance-slider').value = +value;
    const event = new Event('change');
    document.getElementById('variance-slider').dispatchEvent(event);
}

document.getElementById("token_link").href = href= `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=https://twitchapps.com/tokengen/&scope=channel%3Aread%3Aredemptions%20chat%3Aread`