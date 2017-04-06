# CheeseToastie ( 🧀 🍞 )
CheeseToastie is a NodeJS library that makes it really easy to build well thought out APIs based on Swagger JSON files.

## Features
* API defined via a JSON file (Swagger-like format)
* Validation of parameters (type, required, etc)
* Ability to include an authentication function that will run prior to secured endpoints being hit
* Uses ExpressJS as an underlying library

## JSON File
To use this library, you'll need to setup a JSON Swagger file that defines your API (endpoints, parameters, etc). More examples on this coming soon.

## Quick Start
```javascript
var express = require("express");
var bodyParser = require('body-parser');

var cheeseToastie = require("cheese-toastie");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start the CheeseToastie API
cheeseToastie.start(__dirname, app);

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log("You're ready to go 🧀 🍞");
});

```

## Authenticating Requests
You can mark routes in your JSON file as requiring authentication like this:
```javascript
...
"authRequired": true,
...
```

You must then provide an authenticator function to the CheeseToastie library that will run against authenticated requests and return either a user object or null (if the user is not logged in/their token is not valid).

```javascript
cheeseToastie.setAuthenticatorMethod(function(token, callback) {
  // Silly example, normally you'd be decoding a JSON Web Token
  if (token && token == "1234") {
    return callback({name: "Daryl"});
  }

  return callback(null);
});

cheeseToastie.start(__dirname, app);
```

## Callback options
When you return a callback to Cheese Toastie it should be of the following format:
```javascript
return callback(err, data, redirect, options)
```

* err - An error, if present
* data - The data response, by default this should be in JSON
* redirect - An optional redirect URL
* options - An optional object that contains