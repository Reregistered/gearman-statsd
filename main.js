#!/usr/bin/env node

var exec 	    = require('child_process').exec
  , optimist	= require('optimist')
  , args 		  = optimist.usage('Usage: $0 ')
    .default('interval', '10000')
    .argv;

var stat = require('statsd-node')();

var env   = process.env;
env.PATH += ':/usr/local/bin/';


////////////////////////////////////////////////
// used to keep track of the measure interval
var measure;

var statsInterval = args.interval;

var stats       = ['Queued', 'InProgress', 'Workers'];
var baseString  = 'gearmand.{functionname}.{param}';


exec('which gearadmin',{env:env},
  function (error, stdout, stderr) {
    if (error !== null) {
      console.log("Gearadmin is not installed on the system");
      return;
    }
    ///////////////////////////////////////////////////
    // we are all setup, so start the timer to get the gearmand status
    //var measure = setInterval(statsInterval,sendStatus);
    measure = setInterval(sendStatus,statsInterval);

  });

function sendStatus(){

  // read the status
  exec('gearadmin --status',{env:env},
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log("There was a problem retreiving Gearman's status");
        console.log("Exiting !!!");
        clearInterval(measure);
        return;
      }

      var output  =  stdout.split('\n');
      var funcs   = 0;

      while ((funcs <  output.length) && (output[funcs] != '.')) {
        var func_stats = output[funcs].split('\t');
        var func_baseString = baseString.replace('{functionname}',func_stats[0]);

        var funcs_stat  = 1;
        while (funcs_stat <  func_stats.length){

          var stat_string = func_baseString.replace('{param}', stats[funcs_stat-1]);

          //console.log(stat_string + ' : ' + func_stats[funcs_stat]);
          stat.gauge(stat_string,func_stats[funcs_stat]);

          funcs_stat++;
        }
        funcs++;
      }
    });

  // send it
}