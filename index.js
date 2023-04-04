require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');

const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema  = new mongoose.Schema({
  url: String,
  shortUrl: Number
})

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  console.log("---- ")
  console.log("short_url", req.params.short_url);
  ShortUrl.findOne({shortUrl:req.params.short_url},function (err, data) {
      if (!data) {
        res.json({ error: 'invalid id' });
      } else {
        res.redirect(data.url);
      }
    });
});

app.post('/api/shorturl', function(req, res) {
  const oriUrl = req.body.url;
  let getUrl = oriUrl.replace(/^https?:\/\/(www\.)?([^/]+)\/.*$/, "$2");;
  console.log("==== ")
  console.log("url ",oriUrl)
  console.log("getUrl ",getUrl)
  dns.lookup(getUrl, function (err, address, family) {
    console.log("err ",err)
    if(err){
      res.json({ error: 'invalid url' });
    } else {
      ShortUrl.findOne({url:oriUrl},function (err, data) {
        if (!data) {
          ShortUrl.countDocuments({}, function (err, count) {
            const nextId = count+1;
            let msg = new ShortUrl({
              url: oriUrl,
              shortUrl: nextId,
            });
            msg.save(function (err) {
                res.json({
                  original_url: oriUrl,
                  short_url: nextId,
                });
            });
          });
        } else {
          res.json({
            original_url: data.url,
            short_url: data.shortUrl,
          });
        }
      });
    }
    console.log("address ",address)
    console.log("family ",family)
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
