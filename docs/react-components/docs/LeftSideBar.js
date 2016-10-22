var React = require("react");
var Link = require("react-router").Link;
var MethodIndicator = require("./MethodIndicator");

module.exports = React.createClass({

  render: function() {
    return (
        <div className="side-bar">
          {Object.keys(this.props.api.paths).map(function(path) {
            var apiPath = this.props.api.paths[path];

            return Object.keys(apiPath).map(function(method) {
              var apiMethod = apiPath[method]

              console.log(method, path);

              return (
                <Link key={method + "_" + path} to={this.props.documentationPath + "?method=" + method + "&method_name=" + path} className="white-link">
                  <div className="side-bar-method">
                    <MethodIndicator method={method}/>
                    {path}
                  </div>
                </Link>
              )
            }.bind(this));

          }.bind(this))}
        </div>
    )
  }

});
