var React = require("react");
var ReactDOM = require("react-dom");
var Router = require('react-router').Router
var Route = require('react-router').Route
var Link = require('react-router').Link
var browserHistory = require("react-router").browserHistory;

var Home = require("./docs/Home");
var NotFound = require("./docs/NotFound");

ReactDOM.render(
  (
    <div className="fixed-page">
    <Router history={browserHistory}>
        <Route path="*" component={Home}/>
    </Router>
    </div>
  ),
  document.getElementById("page")
);
