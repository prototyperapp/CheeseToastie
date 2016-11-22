var React = require("react");
var LeftSideBar = require("./LeftSideBar");
var RightSideBar = require("./RightSideBar");
var HttpServices = require("../services/HttpServices");
var Spinner = require("./Spinner");

module.exports = React.createClass({

  getRequired: function(param) {
    if (param.required) {
      return "Yes";
    } else {
      return "No";
    }
  },

  renderParameters: function() {
    var parameters = this.props.api.paths[this.props.methodName][this.props.method].parameters;

    if (parameters && parameters.length > 0) {
      return (
        <div className="section">
          <h3>Parameters</h3>
          <table>
            <tbody>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Required</th>
            </tr>

            {parameters.map(function(param) {
              return (
                <tr key={param.name}>
                  <td>{param.name}</td>
                  <td>{param.type}</td>
                  <td className="centered-cell">{this.getRequired(param)}</td>
                </tr>
              )
            }.bind(this))}

            </tbody>

          </table>

        </div>
      )
    } else {
      return null;
    }
  },

  render: function() {
    return (
      <div className="main-content">
        <h1>{this.props.methodName}</h1>
        <div>{this.props.api.paths[this.props.methodName][this.props.method].summary}</div>
        {this.renderParameters()}
        <div className="section">
          <h3>Response</h3>
        </div>
      </div>
    )
  }

});
