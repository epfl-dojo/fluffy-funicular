# Fluffy Funicular
Fluffy Funicular is a telegram bot who get twitter statuses and push them to telegram

## How to use it
Open [Telegram](https://telegram.org/), add [@fluffy_funicular_bot](https://telegram.me/fluffy_funicular_bot) and `/subscribe`

## How to run it on my own server
  1. Rename `data/secrets-dummy.json` to `data/secrets.json`
  1. Talk to Telegram's [@BotFather](https://telegram.me/BotFather) to create a new bot and get the `telegram_token`
  1. Create a Twitter App on [https://apps.twitter.com/](https://apps.twitter.com/)
  1. Click around to get your Consumer Key (API Key), Consumer Secret (API Secret) - read only is enough, Access Token, Access Token Secret (read-only is enough)
  1. Edit `data/secrets.json` to enter:
    * `twitter_consumer_key`
    * `twitter_consumer_secret`
    * `twitter_access_token_key`
    * `twitter_access_token_secret`
    * `telegram_token`
  1. `npm start`
