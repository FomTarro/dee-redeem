# How to Use (First Time Setup!)

1. Extract the contents of this folder to some place on your desktop.
2. In OBS, make a Browser Source that takes up the entire screen (or as much of it as you'd like the redeem to occupy)
3. Check the "Local File" box, then click on "Browse" to find `index.html`.
4. In a browser ourside OBS, open [this link](https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=427fqooc0gofe9p8t7ep633y9vokvl&redirect_uri=https://twitchapps.com/tokengen/&scope=channel%3Aread%3Aredemptions%20chat%3Aread) to get a Twitch API token. Copy this token to your clipboard.
5. Right-click on the new Browser Source in the list of sources, and click `"Interact"`. This will allow you to input a token.
6. Click on the text entry box in the Interact window, and paste your token, then click on the `"Use Token"` button. If the above steps all work, you should now see your username on the page.
7. To link this effect to an actual channel redeem, click the `"Listen for Redeem Reward ID"` button in the Interact window, then go to your Twitch chat and fire off the redeem that you want to use. If this step works, you should now see the name of the redeem on the page. You can click the "Test Fire" button to see what it will do.
8. Close the Interact window. After about 5 seconds, the control panel area will automatically hide itself, and you should be good to go.

From there, you should be good to go until your token expires (about every 60 days). When that happens, you will need to repeat steps 1-6!

Feel free to let me know if you have any style or behavior adjustments you'd like.

