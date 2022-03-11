'use strict';

var https = require('https');
var querystring = require('querystring');
var jwt = require('jsonwebtoken');

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

    var payload = querystring.stringify({
        client_id: ipClientId,
        flow: 'standard',
        flow_version: '20180926095141534582',
        locale: 'en-US',
        redirect_uri: 'http://somewhere',
        response_type: 'token',
        form: 'signInForm',
        signInEmailAddress: inputUsername,
        currentPassword: inputPassword
    });

    var options = {
        method: 'POST',
        host: ipHost,
        path: ipOauthApi,
        port: ipApiPort,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': payload.length
        }
    };

    var request = https.request(options, (res) => {

        console.log("Calling IP for token");

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            var response = JSON.parse(chunk);
            var user = response.capture_user;

            var signOptions = {
                issuer: ipHost,
                subject: user.uuid,
                audience: ipClientId,
                expiresIn: '1h'
            }

            var token = jwt.sign({
                email: user.email,
                updated_at: user.lastUpdated,
                nickname: user.givenName,
                name: user.givenName + ' ' + user.familyName,
                email_verified: user.emailVerified
            }, 'secret', signOptions);

            var response = {
                access_token: response.access_token,
                id_token: token,
                expires_in: 3600,
                token_type: 'Bearer'
            }
            console.log(response);
            callback(null, JSON.parse(JSON.stringify(response)));
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

    request.write(payload);
    request.end();
};