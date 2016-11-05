/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// This application uses request to submit your challenge answer to
// our challenge service checker
var request = require('request');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var vcapServices = require('vcap_services');
var service = vcapServices.getCredentials('personality_insights');

app.get('/personality', function(req, res) {
  if(service && service.username) {
    // Configures the Watson Personality Insights service.
    var PersonalityInsightsV2 = require('watson-developer-cloud/personality-insights/v2');

    var personality_insights = new PersonalityInsightsV2({
      username: service.username,
      password: service.password
    });

    var fs = require('fs');
    var contents = fs.readFileSync('personality.txt', 'utf8');

    // Analyze personality of author.
    personality_insights.profile({
      text: 'Enter more than 100 unique words here...'
    }, function(err, personality) {
      if(err) {
        res.send(err);
      } else {
        // Change only the email address.
        var submission = {
          email: 'you@youremailaddress.com',
          data: JSON.stringify(personality),
          app: JSON.stringify({
            services: Object.keys(appEnv.services),
            host: appEnv.app.application_uris,
            space: appEnv.app.space_id,
            started_at: appEnv.app.started_at,
            application_id: appEnv.app.application_id,
            instance_id: appEnv.app.instance_id
          })
        };

        // Uncomment
        //request.post('https://code-checker.mybluemix.net/check/challengepersonalityinsights', {form: submission}, function(err, response, body) {
        //  res.send(body);
        //});
      }
    });
  } else {
    res.send('Personality Insights Service not bound to application.');
  }
});

// Start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // Print a message when the server starts listening
  console.log('server starting on '+appEnv.url);
});
