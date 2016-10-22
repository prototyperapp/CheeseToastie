var React = require("react");
var RightTabs = require("./RightTabs");
var TryItOut = require("./TryItOut");

module.exports = React.createClass({

  getInitialState: function() {
    return {
      tab: {id: "try"}
    }
  },

  onChangeTab: function(tab) {
    this.setState({
      tab: tab
    });
  },

  renderContent: function() {
    if (this.state.tab.id == "try") {
      return (
        <TryItOut
          method={this.props.method}
          methodName={this.props.methodName}
          api={this.props.api}/>
      )
    } else {
      return (
        <div></div>
      )
    }
  },

  render: function() {
    if (this.props.method) {
      return (
        <div className="right-side-bar">
          <RightTabs onChangeTab={this.onChangeTab}/>
          {this.renderContent()}
        </div>
      )
    } else {
      return (
        <div className="right-side-bar">
        </div>
      )
    }

  }



});
