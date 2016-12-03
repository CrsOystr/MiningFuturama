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
    doWork(0);
  }
});

function doWork(i){
    request(baseURL + urlsToParse[i], function (error, response, html) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        $('div.poem').each(function(j, element){
          var a = $(this);
          var text = a.text().split('⨂').pop().split(':');
          var character = text[0].trim();
          var characterLine;
          if(text[1]!=undefined){
              characterLine = text[1].replace(/(\[.*?\])/g, '').trim();
             //characterLine = characterLine.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").replace(/\s+/g, " ").trim();
              console.log(character);
              console.log(characterLine);
              console.log(responsesReceived + 1);
              lines.push(new Line(character, characterLine, responsesReceived + 1));
          }
        });
        responsesReceived++;
        if (responsesReceived == urlsToParse.length-1){
            cleanUp();
        }else{
            doWork(responsesReceived);
        }
      }
    });
}

function cleanUp(){
    var data = "Season, Episode, Character, Line\n"

    for (var i=0; i < lines.length; i++){
      console.log(lines[i].character + ' ' + lines[i].line + lines[i].episodeNum + '\n');
      data = data + ('1, ' + lines[i].episodeNum + ', ' + lines[i].character + ', '+ lines[i].line + '\n');
    }

    fs.writeFile("test.csv", data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}
