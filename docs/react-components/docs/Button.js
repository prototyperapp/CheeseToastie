var React = require("react");
var update = require("react-addons-update");

module.exports = React.createClass({

  renderContentOrSpinner: function() {
    if (this.props.loading) {
      return (
        <div className="spinner-small">
          <div className="spinner-small-inner"></div>
        </div>
      )
    } else {
      return this.props.title;
    }
  },

  render: function() {
    return (
      <div className="button" onClick={this.props.onClick}>
        {this.renderContentOrSpinner()}
      </div>
    )
  }

});
