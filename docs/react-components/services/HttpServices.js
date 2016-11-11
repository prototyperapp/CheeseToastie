var request = require("superagent");

exports.get = function(url, callback) {
  request
    .get(url)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err) {
        if (res) {
          return callback(res.body);
        } else {
          return callback(err);
        }
      }

      if (res && res.body) {
        return callback(null, res.body);
      }

      return callback(err, res);
    });
};


exports.post = function(url, body, callback) {
  console.log(url);
  request
    .post(url)
    .send(body)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err) {
        if (res) {
          return callback(res.body);
        } else {
          return callback(err);
        }
      }

      if (res && res.body) {
        return callback(null, res.body);
      }

      return callback(err, res);
    });
};

exports.delete = function(url, body, callback) {
  request
    .delete(url)
    .send(body)
    .set('x-user-token', window.localStorage.token)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err) {
        if (res) {
          return callback(res.body);
        } else {
          return callback(err);
        }
      }

      if (res && res.body) {
        return callback(null, res.body);
      }

      return callback(err, res);
    });
};
