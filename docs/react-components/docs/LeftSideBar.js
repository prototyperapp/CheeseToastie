var React = require("react");
var Link = require("react-router").Link;
var MethodIndicator = require("./MethodIndicator");

module.exports = React.createClass({

  renderEditableContent: function() {
    if (false && this.props.editable) {
      return (
        <div className="editable-add">
          <div>+</div>
        </div>
      );
    } else {
      return null;
    }
  },

  render: function() {
    return (
        <div className="side-bar">
          <Link to={this.props.documentationPath}><div className="side-bar-category">Introduction</div></Link>
          <div className="side-bar-category">Uncategorised</div>
          <div className="side-bar-methods">
            {Object.keys(this.props.api.paths).map(function(path) {
              var apiPath = this.props.api.paths[path];

              return Object.keys(apiPath).map(function(method) {
                var apiMethod = apiPath[method]

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
          {this.renderEditableContent()}
        </div>
    )
  }

});
