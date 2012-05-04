var fs = require('fs');
//var request = require('request');
var cheerio = require('cheerio');

var body = '';
$ = cheerio.load(body);

fs.readdir( "./data/", function( err, files) {
    if ( err ) {
        console.log("Error reading files: ", err);
    } else { //console.log( files );
        $.each( files, function(fileno, file){ 
            if(!/\.txt$/.test( file ) ) return; //only process .txt files!
            var type = file.split('.txt')[0].toLowerCase().replace(/^q/, '');
            console.log('Processing TYPE: \t' + type +'\t\tfrom File: ' + file);
            file = "data/" + file;
            fs.readFile(file, "utf-8", function(err, data){
                if(err){
                    console.log(err);
                } else{
                    var result = "", map = {};
                    console.log(file + " file was read");

                    $.each( data.split('\n'), function(lineno, line){
                        result += line.replace(/\"/g, "\\\"") + "\\n\\\n";
                    });
                    result = "var type='" + type + "', _DATA = \"" + result + "\"; gq.cookdata(type, _DATA);";
                    fs.writeFile(file + "_script.js", result, function(err) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log(file + " info was saved!");
                        }
                    });
                }
            });
        });
    }
});