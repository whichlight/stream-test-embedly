var fs = require('fs'),
    BufferStream = require('bufferstream'),
    http = require('http'),
    hyperquest = require('hyperquest');

var apikey = process.env['EMBEDLY_KEY']
var url = "http://stream.embed.ly?key=" + apikey;
var timeout;
var EMBEDLY_HOST = "http://useastapi.embed.ly";
var FRACTION_EMBEDDED = "0.5"; //0 to 1 , increase to embed more

var bs = new BufferStream({size:'flexible'});
bs.enable();

function startStream(){
  bs.reset();
  console.log('start stream');
  var r = hyperquest(url);
  r.pipe(bs);
  r.on('close', function(){
    console.log('stream closed');
    process.exit();

  });
  r.on('error', function(err){
    console.log(err.message);
  });
}

function processUrls(line){
  var data = JSON.parse(line);
  if(data['embed']){
    var link = data['url'];
    if(Math.random() < FRACTION_EMBEDDED){
      runEmbed(link);
    }
  }
}

function runEmbed(link){
    console.log(link);
    var call = EMBEDLY_HOST + "/1/oembed?url="+ link + "&key=" + apikey;
    var req = hyperquest.get(call);
    req.on('response', function(res){
        console.log(link);
    });
    req.on('error', function(res){
        console.log('oops');
    });
}

bs.split("\n", function(line){
  if(timeout){
    clearTimeout(timeout)
  }
  timeout = setTimeout(function(){
    console.error('stream timeout occurred');
    process.exit();
  },20000);

  try{
      processUrls(line.toString());
  }
  catch(e){
    console.error(e.stack);
  }
});

bs.on("error", function(e){
  console.log(e);
});

startStream();
