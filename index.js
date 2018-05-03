var express = require("express");
var fs = require("fs");

var authenticatorMethod = null;
var logMethod = null;
var routeMap = {};

const DEFAULT_DOCS_PATH = "/documentation";
const DEFAULT_DOCS_TITLE = "API Documentation";
const EDITABLE_MODE_ARG = "editable"
const DEFAULT_USER_TOKEN = "x-user-token";

// Loop through all of the directories under /api and add the route files to the route map
var addRouteFiles = function(basePath, directory) {
  fs.readdirSync(directory).forEach(function(file) {
    if (fs.statSync(directory + "/" + file).isDirectory()) {
      addRouteFiles(basePath, directory + "/" + file);
    } else if (file.toLowerCase() != ".ds_store") {
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

var logCall = function(methodDefinition, req, path, method, authUser, checkedParams, callback) {
  if (logMethod) {
    logMethod(methodDefinition, req, path, method, authUser, checkedParams, () => {
      return callback();
    });
  } else {
    return callback();
  }
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

    logCall(methodDefinition, req, path, method, authUser, checkedParams, () => {
      routeMap[path][method][req.method.toLowerCase()](req, checkedParams.parameters, environment, function(err, result, redirect, options) {
        if (options) {
          if (options.contentType) {
            res.setHeader("Content-Type", options.contentType);
  
            if (options.attachmentFilename) {
              res.setHeader("Content-disposition", "attachment; filename=" + options.attachmentFilename);
            }
            
            res.send(result);
            return;
          }
        }
        
        if (redirect) {
          res.redirect(redirect);
          return;
        } if (err) {
          res.status(500).send(err);
          return;
        } else {
          res.json(result);
          return;
        }
      });
    });

    
  });
}

var getAuthedUserFromHeaders = function(req, callback) {
  var userToken = null;

  if (req.headers && req.headers[DEFAULT_USER_TOKEN]) {
    userToken = req.headers[DEFAULT_USER_TOKEN];
  } else if (req.query && req.query[DEFAULT_USER_TOKEN]) {
    userToken = req.query[DEFAULT_USER_TOKEN];
  }

  if (userToken) {
    // We have a user token
    if (authenticatorMethod) {
      authenticatorMethod(userToken, function(authUser) {
        return callback(authUser);
      });
    } else {
      return callback(null);
    }
  } else {
    return callback(null);
  }
};

var addDocumentation = function(app, directory, options) {
  var docsPath = DEFAULT_DOCS_PATH;
  var docsTitle = DEFAULT_DOCS_TITLE;

  if (options && options.docs) {
    if (options.docs.path) {
      docsPath = options.docs.path;
    }

    if (options.docs.title) {
      docsTitle = options.docs.title;
    }
  }

  // Serve the bundle
  app.get("/api-docs-bundle/js", function(req, res) {
    res.sendFile(__dirname + "/docs/build/bundle.js");
  });

  // Serve the API Spec JSON File
  app.get("/api-docs-bundle/api.json", function(req, res) {
    fs.readFile(directory + "/api.json", 'utf8', function (err, data) {
      if (err) {
        res.status(500).send("Could not load JSON file");
        return;
      };

      var loadedJson = JSON.parse(data);
      res.json(loadedJson);
    });
  });

  // Serve the CSS
  app.get("/api-docs-bundle/css", function(req, res) {
    res.sendFile(__dirname + "/docs/build/static_docs_content/style.css");
  });

  //var scriptTags = '<script type="text/javascript" src="http://localhost:3001/docs/build/bundle.js"></script>';
  var scriptTags = '<script type="text/javascript" src="/api-docs-bundle/js"></script>';

  var fontIncludes = '<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700|Open+Sans:300,400" rel="stylesheet">';

  var html = '<html><head><title>' + docsTitle + '</title>'
    + '<link rel="stylesheet" type="text/css" href="/api-docs-bundle/css"/>'
    + fontIncludes
    + '</head>'
    + '<script src="https://use.fontawesome.com/8b1e958111.js"></script>'
    + '<body class="body"><div id="page"></div>'
    + scriptTags
    + '</body>'
    + '</html>';

  app.get(docsPath + "/*", function(req, res) {
    res.send(html);
  });

  app.get(docsPath, function(req, res) {
    res.send(html);
  });
};

exports.setAuthenticatorMethod = function(authMethod) {
  authenticatorMethod = authMethod;
};

exports.setLogMethod = function(loggingMethod) {
  logMethod = loggingMethod;
}

exports.handleMethod = handleMethod;

saveJsonFile = function(directory, apiJson) {
  fs.writeFile(directory + "/api.json", JSON.stringify(apiJson, null, "\t"), function(err) {
    if (err) {
      console.log(err);
    }
  });
};

setupAdminMode = function(app, directory, apiJson) {
  var adminMode = false;

  process.argv.forEach(function(arg) {
    if (arg == EDITABLE_MODE_ARG) {
      adminMode = true;
    }
  });

  app.get("/cheesetoastie/info", function(req, res) {
    res.send({editable: adminMode});
  });

  if (adminMode) {
    app.post("/cheesetoastie/info", function(req, res) {
      if (req.body.field && req.body.value) {
        apiJson.info[req.body.field] = req.body.value;
        saveJsonFile(directory, apiJson);
        reloadRoutes(app, directory, apiJson);
        res.send({message: "Updated"});
      } else {
        res.status(501).send({error: "You must provide a field and value to update"});
      }
    });

  }
};

reloadRoutes = function(app, directory, apiJson) {
  addRouteFiles(directory + "/api", directory + "/api");
  addRoutes(apiJson, app);
};

exports.start = function(directory, app, options) {
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

  setupAdminMode(app, directory, apiJson);
  reloadRoutes(app, directory, apiJson);

  if (!options || !options.docs || !options.docs.disable) {
    addDocumentation(app, directory, options);
  }
};
