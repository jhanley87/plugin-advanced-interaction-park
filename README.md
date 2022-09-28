# Advanced Interaction Parking Plugin
## Overview
This plugin has been developed to provide a 'park' feature when using [Flex Conversations](https://www.twilio.com/docs/flex/developer/conversations) along with [Flex UI 2.0](https://www.twilio.com/docs/flex/release-notes/flex-ui-release-notes-for-v2xx).

This plugin also enables some avanced features of converation parking such as scheduling an unpark time and routing options for when a conversation is unparked.

## Project structure
This project is split into 2 elements. The first is a plugin that is deployed to your Flex Project. The second is a Serverless Functions project that can be deployed to your account.

![](/Assets/Interaction%20Parking.png)

For Scheduling, this project ships with support for cronhooks.io, however can be easily expanded to work with a scheduler of your choice.


# Project Setup

## Serveless Functions

**_NOTE:_**  This setup will assume that you are using cronhooks as your scheduler. You can create a free account [here](https://app.cronhooks.io/#/account/register). Then create your API key in your [account settings](https://app.cronhooks.io/#/user/api-keys). Make a note of this API key for later.

To setup this project, firstly clone this repository
```
git clone https://github.com/jhanley87/plugin-advanced-interaction-park.git
```
Once this is complete, you can then configure and deploy your serverless functions to your Twilio account. Do this by moving into your serverless folder and installing dependencies
```
cd serverless-interaction-park
npm i
```
You can then copy the `.env.example` file to create your own configuration
```
cp ./public/appConfig.example.js ./public/appconfig.js
cp .env.example .env
```
Then you will need to enter your configuration into this new file
```
ACCOUNT_SID= #Your Twilio Account SID
AUTH_TOKEN= #Your Twilio Auth Token
SCHEDULER_API_KEY= #The API key that you set up in previous step
NGROK_ENDPOINT= #Used when developing locally, your ngrok endpoint
WORKSPACE_SID= #Your Twilio Task Router Workspace SID
```
After this we can use the Twilio CLI to deploy the project to your Twilio Account
```
npm run deploy
```
At this point grab the **Domain** output from the command it should look something like `serverless-interaction-park-1234-dev.twil.io`

## Flex Plugin
Now you are ready to deploy the Flex plugin. Firstly move over to the correct directory and install dependencies
```
cd ../plugin-advanced-interaction-park
npm i
```
With that done you can now configure your plugin
```
cp .env.example .env
```
Then you will need to enter your configuration into this new file
```
FLEX_APP_URL_PARK_AN_INTERACTION= https://{Domain that you noted in previous step}/park-interaction
```
Now you are ready to deploy your plugin to your Flex instance. Firstly create a production build of your plugin and deploy it
```
twilio flex:plugins:deploy --changelog="Initial deployment"
```
Next you will release the deployed version of the plugin so that your agents can see your new component
```
twilio flex:plugins:release --plugin plugin-advanced-interaction-park@0.0.1 --name "Release version 0.0.1" --description "Release initial deployment."
```