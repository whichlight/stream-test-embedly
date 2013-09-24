#!/usr/bin/env node
var fs = require('fs'),
    BufferStream = require('bufferstream'),
    http = require('http'),
    hyperquest = require('hyperquest');

var streamkey = process.env['EMBEDLY_STREAM_KEY']
var apikey = process.env['EMBEDLY_API_KEY']
var url = "http://stream.embed.ly?key=" + streamkey;
var timeout;
var EMBEDLY_HOST = "http://useastapi.embed.ly";
var FRACTION_EMBEDDED = process.env['EMBEDLY_SAMPLE_SIZE'] || "0.5"; //0 to 1 , increase to embed more

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
  try {
    var data = JSON.parse(line);
    if(data['embed']){
      var link = data['url'];
      if(Math.random() < FRACTION_EMBEDDED){
        runEmbed(link);
      }
    }
  } catch(e) {
    console.error(line);
    console.error(e.stack);
  }
}

function runEmbed(link){
    var call = EMBEDLY_HOST + "/1/oembed?url="+ link + "&key=" + apikey;
    var req = hyperquest.get(call);
    req.on('response', function(res){
        console.log('^_^ -> ' + link);
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
