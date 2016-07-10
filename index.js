/*
 Bunch of var
 */
var Twitter = require('twitter'),
    fs = require("fs"),
    secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8')),
    funicularData = JSON.parse(fs.readFileSync('funicular_data.json', 'utf8')),
    cron = require('node-cron'),
    TelegramBot = require('node-telegram-bot-api'), // https://github.com/yagop/node-telegram-bot-api
    token = secrets['telegram_token'],
    bot = new TelegramBot(token, {polling: true}),
    client = new Twitter({
        consumer_key: secrets['twitter_consumer_key'],
        consumer_secret: secrets['twitter_consumer_secret'],
        access_token_key: secrets['twitter_access_token_key'],
        access_token_secret: secrets['twitter_access_token_secret']
    });

/*
 Save JSON to funicular_data.json
 TODO: https://www.npmjs.com/package/jsonfile
 */
function writeToData(myData) {
    var outputFilename = 'funicular_data.json';
    fs.writeFile(outputFilename, JSON.stringify(myData, null, 2), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + outputFilename);
            console.dir(myData);
        }
    });
}

/*
 Create the data file - we just need the latest tweet id when launching the script
 */
funicularData.twitterUsersToListenTo.forEach(function (screen_name) {
    client.get('statuses/user_timeline', {screen_name: screen_name, count: 2}, function (error, tweets, response) {
        if (!error) {
            debug = true;
            if (debug) { // Take previous last tweet to fake a new tweet (test purpose)
                console.dir(tweets[1].created_at + " " + tweets[1].id);
                funicularData.twitterUsersData[screen_name] = {};
                funicularData.twitterUsersData[screen_name].lastTweetID = tweets[1].id;
                funicularData.twitterUsersData[screen_name].lastTweetIDstr = tweets[1].id_str;
                funicularData.twitterUsersData[screen_name].lastTweetCreateAt = tweets[1].created_at;
            } else {
                funicularData.twitterUsersData[screen_name] = {};
                funicularData.twitterUsersData[screen_name].lastTweetID = tweets[0].id;
                funicularData.twitterUsersData[screen_name].lastTweetIDstr = tweets[0].id_str;
                funicularData.twitterUsersData[screen_name].lastTweetCreateAt = tweets[0].created_at;
            }
            writeToData(funicularData);
        }
    });
});

/*
 Telegram subscribe function
 */
bot.onText(/[Ss]ubscribe/, function (msg, match) {
    var twitterUsersLinks = funicularData.twitterUsersToListenTo.map(function (usr) {
        return "https://twitter.com/" + usr.substring(1);
    });
    // TODO: check if user present and avoid to redo something already done
    console.log(msg.from);
    funicularData.telegramUsersToUpdate[msg.from.id] = msg.from;
    writeToData(funicularData);

    console.log(" - log: #" + msg.from.id + " (" + msg.from.first_name + " " + msg.from.last_name + " aka " + msg.from.username + ") subscribed");

    // TODO: send subscription link in X messages
    bot.sendMessage(msg.from.id, "Thanks, you've subscribed to " + twitterUsersLinks.join(", "));
});

/*
 Telegram unsubscribe (quit) function
 */
bot.onText(/[Qq]uit/, function (msg, match) {
    delete funicularData.telegramUsersToUpdate[msg.from.id];
    writeToData(funicularData);

    console.log(" - log: #" + msg.from.id + " (" + msg.from.first_name + " " + msg.from.last_name + " aka " + msg.from.username + ") unsubscribed");

    bot.sendMessage(msg.from.id, "Bye");
});

function sendNewTweetToTelegram(data) {
    // TODO: find a better way to reload the date (fs-watcher?)
    reloadedFunicularData = JSON.parse(fs.readFileSync('funicular_data.json', 'utf8'));
    console.log(data);
    tweet = "🚟 This is @" + data.user.screen_name + "'s new tweet:";
    tweet += "\n\n";
    tweet += data.text;
    tweet += "\n\n";
    tweet += "\t└ read tweet online: https://twitter.com/" + data.user.screen_name + "/status/" + data.id_str;
    for (var i in reloadedFunicularData.telegramUsersToUpdate) {
        bot.sendMessage(i, tweet);
    }
}

/*
 X minutes the cron.schedule will fetch new statuses and push the to telegram
 */
cron.schedule('* * * * *', function () {
    console.log(" - log: fetching new tweets");
    funicularData.twitterUsersToListenTo.forEach(function (screen_name) {
        //console.log(" - log: " + funicularData.twitterUsersData[screen_name].lastTweetID + " " + funicularData.twitterUsersData[screen_name].lastTweetIDstr);
        console.log("    └ for " + screen_name);
        // https://dev.twitter.com/rest/reference/get/statuses/user_timeline
        client.get('statuses/user_timeline', {
            screen_name: screen_name,
            since_id: funicularData.twitterUsersData[screen_name].lastTweetIDstr
        }, function (error, tweets, response) {
            if (!error) {
                if (tweets.length) {
                    // great! fishing has been good ☺
                    // TODO (!!!) Update last tweet information in funicularData
                    tweets.map(function (tweet) {
                        //console.dir(tweet.text);
                        funicularData.twitterUsersData[screen_name] = {};
                        funicularData.twitterUsersData[screen_name].lastTweetID = tweet.id;
                        funicularData.twitterUsersData[screen_name].lastTweetIDstr = tweet.id_str;
                        funicularData.twitterUsersData[screen_name].lastTweetCreateAt = tweet.created_at;
                        //writeToData(funicularData); // ?? Is cache enough for that ?
                        sendNewTweetToTelegram(tweet);
                    });
                } else {
                    console.log("    └ no new status found for " + screen_name);
                }

            }
        });
    });
});