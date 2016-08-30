var express = require("express");
var fs = require("fs");

var authenticatorMethod = null;
var routeMap = {};

// Loop through all of the directories under /api and add the route files to the route map
var addRouteFiles = function(basePath, directory) {
  fs.readdirSync(directory).forEach(function(file) {
    if (fs.statSync(directory + "/" + file).isDirectory()) {
      addRouteFiles(basePath, directory + "/" + file);
    } else {
      var routeKey = directory.substr(basePath.length);
      routeMap[routeKey] = require(directory + "/" + file);
    }
  });
};

var addRoutes = function(apiJson, app) {
  Object.keys(apiJson.paths).forEach(function(pathKey) {
    var path = apiJson.paths[pathKey];

    Object.keys(path).forEach(function(method) {
      var methodDefinition = path[method];
      methodDefinition.method = method;
      methodDefinition.path = pathKey;

      // Replace any path parameters, e.g. {name} with :name as this is the way ExpressJS expects them to be
      while (methodDefinition.path.indexOf("{") >= 0) {
        var indexOfParamStart = methodDefinition.path.indexOf("{");
        var indexOfParamEnd = methodDefinition.path.indexOf("}");
        var paramLength = indexOfParamEnd - indexOfParamStart - 1;
        var param = methodDefinition.path.substr(indexOfParamStart + 1, paramLength);
        methodDefinition.path = methodDefinition.path.substr(0, indexOfParamStart) + ":" + param +  methodDefinition.path.substr(indexOfParamEnd + 1);
      }

      app[method](methodDefinition.path, function(req, res) {
        handleMethod(methodDefinition, req, res);
      });
    });
  });
}

var addUrlParamsToParams = function(params, req) {
  var newParams = params;

  if (!newParams) {
    newParams = {};
  }

  if (req.params) {
    Object.keys(req.params).forEach(function(key) {
      newParams[key] = req.params[key];
    });
  }

  return newParams;
}

var getRequestParameters = function(methodDefinition, req) {
  if (methodDefinition.method == "get") {
    return addUrlParamsToParams(req.query, req);
  } else if (methodDefinition.method == "post" || methodDefinition.method == "delete" || methodDefinition.method == "put" || methodDefinition.method == "patch") {
    return addUrlParamsToParams(req.body, req);
  } else {
    return req.params;
  }
};

var checkParameters = function(methodDefinition, req) {
  if (!methodDefinition.parameters || methodDefinition.parameters.length == 0) {
    return {errors: null, parameters: []};
  }

  // We have parameters, loop through and check them
  var verifiedParameters = {};
  var errors = [];

  var requestParams = getRequestParameters(methodDefinition, req);

  methodDefinition.parameters.forEach(function(parameter) {
    if (parameter.required && (!requestParams[parameter.name])) {
      errors.push("Missing required field '" + parameter.name + "'");
    } else {
      var fieldValue = requestParams[parameter.name];

      if (requestParams[parameter.name]) {
        // Parameter has a value, check its type if required
        if (parameter.type && parameter.type.toLowerCase() == "number") {
          if (!isNaN(fieldValue)) {
            fieldValue = Number(fieldValue);
          } else {
            errors.push("'" + parameter.name + "' must be a valid number");
          }
        }
      }

      // Everything ok
      if (errors.length == 0) {
        verifiedParameters[parameter.name] = fieldValue;
      }
    }
  });

  if (errors.length == 0) {
    errors = null;
  }

  return {errors: errors, parameters: verifiedParameters};

};


var convertFullUrlToApiRoute = function(url) {
  var routeToReturn = "";
  var currentParam = null;

  for (var i = 0; i < url.length; i++) {
      if (url.charAt(i) == ":") {
        currentParam = "";
      } else if (currentParam != null) {
        if (url.charAt(i) == "/") {
          // This is the end of the param
          routeToReturn += "{" + currentParam + "}/";
          currentParam = null;
        } else {
          currentParam += url.charAt(i);
        }
      } else {
        routeToReturn += url.charAt(i);
      }
  }

  // Do we have a currentParam left?
  if (currentParam != null) {
    routeToReturn += "{" + currentParam + "}";
  }

  return routeToReturn;
};

var handleMethod = function(methodDefinition, req, res) {
  var completePath = convertFullUrlToApiRoute(req.route.path);

  if (completePath.charAt(completePath.length - 1) == "/") {
    completePath = completePath.substr(0, completePath.length - 1);
  }

  var path = completePath.substr(0, completePath.lastIndexOf("/"));
  var method = completePath.substr(completePath.lastIndexOf("/") + 1);

  if (!routeMap[path]) {
    res.status(404).send('Could not find route');
    return;
  }

  if (!routeMap[path][method]) {
    res.status(404).send('Could not find method ' + method + " in " + path);
    return;
  }

  if (!routeMap[path][method][req.method.toLowerCase()]) {
    res.status(404).send('Could not find HTTP ' + req.method + ' method for ' + method);
    return;
  }

  var checkedParams = checkParameters(methodDefinition, req);

  if (checkedParams.errors && checkedParams.errors.length > 0) {
    res.status(400).send({errors: checkedParams.errors});
    return;
  }

  getAuthedUserFromHeaders(req, function(authUser) {
    if (methodDefinition.authRequired && !authUser) {
      res.status(401).send({error: "You must be logged in to call this service"});
      return;
    }

    var environment = {
      authUser: authUser
    };

    routeMap[path][method][req.method.toLowerCase()](req, checkedParams.parameters, environment, function(err, result) {
      if (err) {
        res.status(500).send(err);
        return;
      } else {
        res.json(result);
        return;
      }
    });
  });
}

var getAuthedUserFromHeaders = function(req, callback) {
  if (req.headers && req.headers["x-user-token"]) {
    // We have a user token
    if (authenticatorMethod) {
      authenticatorMethod(req.headers["x-user-token"], function(authUser) {
        return callback(authUser);
      });
    } else {
      return callback(null);
    }
  } else {
    return callback(null);
  }
};

exports.setAuthenticatorMethod = function(authMethod) {
  authenticatorMethod = authMethod;
};

exports.start = function(directory, app) {
  console.log("Starting CheeseToastie 🧀 🍞 ...");
  try {
    fs.statSync(directory + "/api.json");
  } catch (e) {
    console.log(e);
    console.error(directory + "/api.json file does not exist");
    return;
  }

  var apiJson = require(directory + "/api.json");

  if (!apiJson || !apiJson.paths || apiJson.paths.length == 0) {
    console.error("Could not find any endpoints in your API Json file");
    return;
  }

  addRouteFiles(directory + "/api", directory + "/api");
  addRoutes(apiJson, app);
};
