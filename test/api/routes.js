module.exports = {
  "hello": {
    "get": function(req, params, environment, callback) {
      return callback(null, {message: "Hello from Cheese Toastie"});
    },
    "post": function(req, params, environment, callback) {
      return callback(null, {message: "Hello " + params.name + " from Cheese Toastie. You are " + params.age + " years old"});
    }
  }
}
