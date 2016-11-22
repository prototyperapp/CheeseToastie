var React = require("react");
var Link = require("react-router").Link;

module.exports = React.createClass({

  render: function() {
    var size = "method-small";

    if (this.props.size) {
      size = "method-" + this.props.size;
    }

    var methodClasses = size + " " + this.props.method + "-method";

    return (
      <div className={methodClasses}>{this.props.method.toUpperCase().substr(0,1)}</div>
    );

  }

});
