var express = require('express');
var router = express.Router();
var configFile = '../config/config.json';
var Promise = require("bluebird");
var request = Promise.promisifyAll(require('request'));

// Load configuration
var config = {};
var appAccessToken = "";
try {
    config = require(configFile);
    appAccessToken = config.client_id + '|' + config.client_secret;
} catch (err) {
    console.log("Unable to read file '" + configFile + "': ", err)
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login_success', function(req, res, next) {
    var tokenDetails = getTokenDetails(req.query.code);
    tokenDetails.then(function(result) {
        //todo: save to db
        console.log('saving to db');
        console.log(JSON.stringify(result));
        res.render('index', { title: 'Success' });
    }).catch(function(e) {
        console.log('error: ' + e.message);
        res.render('index', { title: e.message });
    });
});

function getTokenDetails(code) {
    var reqObj = {
        url: 'https://graph.facebook.com/v2.3/oauth/access_token',
        qs: {
            client_id: config.client_id,
            redirect_uri: config.redirect_uri,
            client_secret: config.client_secret,
            code: code
        }
    };

    return request.getAsync(reqObj).spread(function (response, body) {
        var bodyJSON = JSON.parse(body);
        if (response.statusCode == 200) {
            return bodyJSON;
        } else {
            throw bodyJSON.error;
        }
    }).then(function(body) {
        return examineToken(body.access_token)
    });
}

function examineToken(inputToken) {
    var reqObj = {
        url: 'https://graph.facebook.com/v2.4/debug_token',
        qs: {
            input_token: inputToken, // facebook user's token
            access_token: appAccessToken // chronote's app access token
        }
    };

    return request.getAsync(reqObj).spread(function (response, body) {
        var bodyJSON = JSON.parse(body);
        if (response.statusCode == 200) {
            var result = bodyJSON.data;
            result["access_token"] = inputToken;
            return result;
        } else {
            throw bodyJSON.error;
        }
    });
}

module.exports = router;
