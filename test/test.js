var express = require("express");
var bodyParser = require('body-parser');
var cheeseToastie = require("../index.js");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start the CheeseToastie API
console.log(__dirname);
cheeseToastie.start(__dirname, app);

// Start the server
var server = app.listen('3000', function () {
  console.log("Started cheese toastie test app 🧀 🍞");
});
