//imports
var request = require('request');
var cheerio = require('cheerio');
var fs = require("fs");

/* variables
 *
 */
var baseURL = 'https://theinfosphere.org';
var directoryURL = '/Episode_Transcript_Listing';
var urlsToParse = [];
var responsesReceived = 0;
var prodSeason = 0;
var lines = [];
//this
var prodSeasonsBreaks = [13,32,54,72,88,114,140];

/* classes
 *
 */
function Line(season, episodeNum, character, line){
    this.season = season;
    this.episodeNum = episodeNum;
    this.character = character;
    this.line = line;
}

//Start here and request HTML for transcript directory
request({
    uri: baseURL + directoryURL,
    method: "GET",
    timeout: 10000
    }, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    //load html using cheerio for jQuery functionality
    var $ = cheerio.load(html);
    $('td.oLeft').each(function(i, element){
      var a = $(this);
      var extURL = a.children('b').children('a').attr('href');
      var episodeName = a.children('b').text().split(':').pop();
      var episodeNumber = parseInt(a.next().next().next().next().text());
      if (extURL != undefined){
        urlsToParse.push(extURL);
      }
    });
    doWork(0);
    }else{
      console.log("BAD NEWS EVERYONE:\n Something b0rked the initial request, make sure you have internet\n");
      process.exit();
  }
});


/* functions
 *
 */

 //this function recursively makes a request to each transcript page and waits for a return
function doWork(i){
request({
    uri: baseURL + urlsToParse[i],
    method: "GET",
    timeout: 10000
    }, function (error, response, html) {
      if (!error && response.statusCode == 200) {
          //load html using cheerio for jQuery functionality
        var $ = cheerio.load(html);
        //look for each div with class poem
        $('div.poem').each(function(j, element){
          var a = $(this);
          var text = a.text().split('⨂').pop().split(':');
          var character = text[0].trim();
          if(text[1]!=undefined){
              var characterLine = text[1].replace(/(\[.*?\])/g, '') //replace everything in brackets
              .replace(/(\r\n|\n|\r)/gm,'') //replace all line breaks
              .replace(/["]+/g, '') // replace quotation marks
              .trim();
             //characterLine = characterLine.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").replace(/\s+/g, " ").trim();
              console.log(character);
              console.log(characterLine);
              console.log(responsesReceived + 1);
              if(responsesReceived >= prodSeasonsBreaks[prodSeason]){
                  prodSeason++;
              }
              lines.push(new Line(prodSeason+1, responsesReceived+1, character, characterLine));
          }
        });
        responsesReceived++;
        if (responsesReceived != urlsToParse.length){
            doWork(responsesReceived);
        }else{
            cleanUp();
        }
    }else{
        console.log("BAD NEWS EVERYONE:\n Something b0rked a request\n");
        process.exit();
    }

    });
}

//this function is called once every URL hs been requested and all HTML has been parsed
function cleanUp(){
    //setup first line of CSV
    var data = 'Season, Episode, Character, Line\n';
    var lineCount = 0;

    for (var i = 1; i < prodSeasonsBreaks.length + 1; i++){
        var seasonData = 'Season, Episode, Character, Line\n';

        for (var j = lineCount; j < lines.length; j++){
            if (lines[j].season == i){
                seasonData = seasonData + (lines[j].season + ', ' + lines[j].episodeNum + ', ' + lines[j].character + ', '+ lines[j].line + '\n');
            }else{
                lineCount = j++;
                break;
            }
            data = data + (lines[j].season + ', ' + lines[j].episodeNum + ', ' + lines[j].character + ', '+ lines[j].line + '\n');
            console.log(lines[j].character + ' ' + lines[j].line + lines[j].episodeNum + '\n');
        }

        //write season CSV to disk
        fs.writeFile('Season-' + i + '.csv', seasonData, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log('The file was saved!');
        });
    }

    //write complete CSV to disk
    fs.writeFile('AllSeasons.csv', data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log('The file was saved!');
    });
}
