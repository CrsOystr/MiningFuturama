var request = require('request');
var cheerio = require('cheerio');

var baseURL = 'https://theinfosphere.org';
var directoryURL = '/Episode_Transcript_Listing';
var urlsToParse = [];

request(baseURL + directoryURL, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    $('td.oLeft').each(function(i, element){
      var a = $(this);
      var extURL = a.children('b').children('a').attr('href');
      var episodeName = a.children('b').text().split(':').pop();
      var episodeNumber = parseInt(a.next().next().next().next().text());
      if (extURL != undefined){
        urlsToParse.push(extURL);
        console.log(episodeName);
        console.log(episodeNumber);
      }
    });
    doWork();
  }
});

function doWork(){
  for (var i=0; i < urlsToParse.length/70; i++){
    request(baseURL + urlsToParse[i], function (error, response, html) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        $('div.poem').each(function(i, element){
          var a = $(this);
          console.log(a.text());
        });
      }
    });
  }
}
