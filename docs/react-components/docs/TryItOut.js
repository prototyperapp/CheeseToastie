var React = require("react");
var RightTabs = require("./RightTabs");
var Button = require("./Button");
var HttpServices = require("../services/HttpServices");
  var Highlight = require('react-highlight');

module.exports = React.createClass({

  _startTime: null,

  getInitialState: function() {
    return {
      trying: false,
      response: null,
      timing: null,
      maximizedResponse: false
    };
  },

  renderTypeBox: function(type) {
    if (!type) {
      return null;
    } else {
      return (
        <div className="type-box">{type.toUpperCase().substr(0,1)}</div>
      );
    }
  },

  componentWillReceiveProps: function() {
    this.setState({
      error: null,
      trying: false,
      response: null
    })
  },

  handleResponse: function(err, res) {
    var timeTaken = new Date().getTime() - this._startTime;

    if (err) {
      console.error(err);
    } else {
      console.log(res);
    }

    this.setState({
      trying: false,
      response: res,
      error: err,
      timing: timeTaken
    });
  },

  onTryItClick: function() {
    this.setState({
      trying: true,
      error: null,
      response: null,
      timing: null
    });

    var paramsObj = {};
    var queryStr = "?";
    var params = this.props.api.paths[this.props.methodName][this.props.method].parameters;

    if (params && params.length > 0) {
        params.forEach(function(param) {
          if (param.in && param.in == "body") {
            paramsObj[param.name] = this.refs["field_" + param.name].value;
          }
        }.bind(this));
    }

    this._startTime = new Date().getTime();


    if (this.props.method.toLowerCase() == "get") {
        HttpServices.get(this.props.methodName, this.handleResponse);
    } else {
      HttpServices[this.props.method](this.props.methodName, paramsObj, this.handleResponse);
    }
  },

  maximizeResponse: function() {
    this.setState({
      maximizedResponse: !this.state.maximizedResponse
    });
  },

  wrapStringifiedJson: function(json) {
    if (this.state.maximizedResponse) {
      return (
        <Highlight>
          {JSON.stringify(json, null, 2)}
        </Highlight>
      )
    } else {
      return JSON.stringify(json, null, "\t");
    }
  },

  renderTiming: function() {
    if (this.state.maximizedResponse) {
      return null;
    } else {
      return (
        <div className="timing">Took {this.state.timing}ms</div>
      );
    }
  },

  renderResponse: function() {
    var holderClasses = "";
    var iconClasses = "fa fa-window-maximize";

    if (this.state.maximizedResponse) {
      holderClasses = "response-maximized";
      iconClasses = "fa fa-window-close";
    }

    if (this.state.response) {
      return (
        <div className={holderClasses}>
          <div className="ok-response">
            <div>Response</div>
            <i className={iconClasses} onClick={this.maximizeResponse}></i>
          </div>
          <div className="response-holder">
            {this.wrapStringifiedJson(this.state.response)}
          </div>

          {this.renderTiming()}
        </div>
      )
    } else if (this.state.error) {
      return (
        <div className={holderClasses}>
          <div className="error">
            <div>Error</div>
            <i className={iconClasses} onClick={this.maximizeResponse}></i>
          </div>
          <div className="response-holder">
            {this.wrapStringifiedJson(this.state.error)}
          </div>
        </div>
      );
    } else {
      return null;
    }
  },

  renderParameters: function() {
    var params = this.props.api.paths[this.props.methodName][this.props.method].parameters;

    if (params && params.length > 0) {
      return (
        <div>
          {params.map(function(param) {
            return (
              <div key={param.name} className="try-it-param">
                <div className="try-it-field-title-holder">
                  {this.renderTypeBox(param.type)}
                  <div className="try-it-field-title">{param.name}</div>
                </div>
                <input ref={"field_" + param.name} type="text" className="try-it-textbox"/>
              </div>
            )
          }.bind(this))}
        </div>
      );
    } else {
      return null;
    }
  },

  render: function() {
    var methodDefinition = this.props.api.paths[this.props.methodName][this.props.method];

    return (
      <div className="right-side-content">
        {this.renderParameters()}
        <Button loading={this.state.trying} title="Try It" onClick={this.onTryItClick}/>
        {this.renderResponse()}
      </div>
    )
  }
});
