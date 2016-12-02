var request = require('request');
var cheerio = require('cheerio');
var fs = require("fs");

var baseURL = 'https://theinfosphere.org';
var directoryURL = '/Episode_Transcript_Listing';
var urlsToParse = [];
var responsesReceived = 0;

function Line(character, line, episodeNum){
    this.character = character;
    this.line = line;
    this.episodeNum = episodeNum;
}
 var lines = [];


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
        $('div.poem').each(function(j, element){
          var a = $(this);
          var text = a.text().split('⨂').pop().split(':');
          var character = text[0].trim();
          var characterLine = text[1].replace(/(\[.*?\])/g, '');
          characterLine = characterLine.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").replace(/\s+/g, " ").trim();
          console.log(character);
          console.log(characterLine);
          lines.push(new Line(character, characterLine, i));
        });
        responsesReceived++;
        if (responsesReceived == urlsToParse.length/70){
            cleanUp();
        }
      }
    });
  }
}

function cleanUp(){
    console.log('meow');
    for (var i=0; i < lines.length; i++){
      console.log(lines[i].character + ' ' + lines[i].line + '\n');
    }
}
