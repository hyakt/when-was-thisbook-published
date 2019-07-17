'use strict';
const express = require('express');
const line = require('@line/bot-sdk');
const request = require('request');
const moment = require('moment');
const PORT = process.env.PORT || 3000;
const config = {
  channelAccessToken: '',
  channelSecret: ''
};
const app = express();
app.post('/webhook', line.middleware(config), (req, res) => {
  console.log(req.body.events);
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});
const client = new line.Client(config);
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  request(`https://www.googleapis.com/books/v1/volumes?q='${event.message.text}&orderBy=newest`, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code
    const parsed = JSON.parse(body)
    const title = parsed.items[0].volumeInfo.title
    const author = parsed.items[0].volumeInfo.authors[0]
    const publishedDate = moment(parsed.items[0].volumeInfo.publishedDate)
    const salesInfo = parsed.items[0].saleInfo.buyLink
    const description = parsed.items[0].volumeInfo.description.slice(0, 30) + "..."
    const diffDate = moment().diff(publishedDate, 'days')
    console.log(diffDate)
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `📚:${title}\n🖋:${author}\n☀️:${publishedDate.format("YYYY-MM-DD")}
             \n概要: ${description}\n\n新刊が発売から、「${diffDate}」日たっています\n${salesInfo}`
    });
  });
}
app.listen(PORT);
console.log(`Server running at ${PORT}`);
