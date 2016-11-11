var React = require("react");
var LeftSideBar = require("./LeftSideBar");
var RightSideBar = require("./RightSideBar");
var HttpServices = require("../services/HttpServices");
var Spinner = require("./Spinner");
var Method = require("./Method");
var ContentEditable = require("./ContentEditable");

module.exports = React.createClass({

  getInitialState: function() {
    return {
      loading: true,
      api: null,
      documentationPath: "/documentation/",
      editable: false
    };
  },

  componentDidMount: function() {
    HttpServices.get("/api-docs-bundle/api.json", function(err, apiJson) {
      console.log("Loaded API JSON");
      if (err || !apiJson) {
        this.setState({
          loading: false,
          error: "Could not load documentation"
        });
      } else {
        if (window.location.href.toLowerCase().indexOf("localhost") >= 0) {
          // Check if admin-editable
          HttpServices.get("/cheesetoastie/info", function(req, res) {
            this.setState({
              loading: false,
              api: apiJson,
              editable: res.editable
            });
          }.bind(this));
        } else {
          this.setState({
            loading: false,
            api: apiJson
          });
        }
      }
    }.bind(this));
  },

  getTitle: function() {
    if (this.state.api.info && this.state.api.info.title) {
      return this.state.api.info.title;
    } else {
      return "API Documentation";
    }
  },

  getDescription: function() {
    if (this.state.api.info && this.state.api.info.description) {
      return this.state.api.info.description;
    } else {
      return "Here you'll find all of the documentation for your API";
    }
  },

  onApiUpdate: function(api) {
    this.setState({
      api: api
    });
  },

  renderContent: function() {
    if (this.props.location.query.method && this.props.location.query.method_name) {
      return (
        <Method
          documentationPath={this.state.documentationPath}
          method={this.props.location.query.method}
          methodName={this.props.location.query.method_name}
          api={this.state.api}
          editable={this.state.editable}
          />
      )
    } else {
      return (
        <div className="main-content-top">
          <h1>
            <ContentEditable
              api={this.state.api}
              content={this.getTitle()}
              editable={this.state.editable}
              fieldName="title"
              path="info"
              onApiUpdate={this.onApiUpdate}/>
          </h1>
          <div>
          <ContentEditable
            api={this.state.api}
            content={this.getDescription()}
            editable={this.state.editable}
            fieldName="description"
            path="info"
            onApiUpdate={this.onApiUpdate}/>
          </div>
        </div>
      )
    }
  },

  render: function() {
    if (this.state.loading) {
      return (
        <Spinner/>
      );
    }

    return (
      <div className="layout">
        <LeftSideBar
          api={this.state.api}
          documentationPath={this.state.documentationPath}
          editable={this.state.editable}/>
        <div className="main-content">
          {this.renderContent()}
          <div className="main-content-bottom">

          </div>

        </div>
        <RightSideBar
          api={this.state.api}
          documentationPath={this.state.documentationPath}
          method={this.props.location.query.method}
          methodName={this.props.location.query.method_name}
          editable={this.state.editable}
          />
      </div>

    )
  }

});
