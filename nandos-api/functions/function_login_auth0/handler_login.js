'use strict';

var https = require('https');

const GRANT_TYPE = 'password';

module.exports.login = function(event, context, callback) {

    var ipHost = process.env.IDENTITY_PROVIDER_HOST;
    var ipApiPort = process.env.IDENTITY_PROVIDER_API_PORT;
    var ipClientId = process.env.IDENTITY_PROVIDER_CLIENT_ID;
    var ipOauthApi = process.env.IDENTITY_PROVIDER_OAUTH_API;

    console.log("ip host: " + ipHost);
    console.log("ip api port: " + ipApiPort);
    console.log("ip client id: " + ipClientId);
    console.log("ip oauth api: " + ipOauthApi);

    var inputUsername, inputPassword;
    if (event.body !== null && event.body !== undefined) {
        let payload = event.body;

        if (payload.username == null && payload.username == undefined && payload.password == null && payload.password == undefined) {
            var error = new Error("Username/Password is missing.")
            callback(error);
        }

        var inputUsername = payload.username;
        var inputPassword = payload.password;
    }

    var options = {
        method: 'POST',
        host: ipHost,
        path: ipOauthApi,
        port: ipApiPort,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var request = https.request(options, (res) => {

      console.log("Calling IP for token");

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        var jwtToken = JSON.parse(chunk);
        console.log(jwtToken);
        callback(null, JSON.parse(JSON.stringify(jwtToken)));
      });

    });

    request.on('error', function(e) {
        console.log("Encountered an error " + e.message);
        var response = {
            statusCode: 500,
            body: e.message
        }
        callback(null, response)
    });

    var payload = {
        client_id: ipClientId,
        grant_type: GRANT_TYPE,
        username: inputUsername,
        password: inputPassword
    };

    request.write(JSON.stringify(payload));
    request.end();
};