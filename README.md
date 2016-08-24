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
var cheeseToastie = require("cheese-toastie");

var app = express();

// Start the CheeseToastie API
cheeseToastie.start(__dirname, app);

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log("You're ready to go 🧀 🍞");
});

```
