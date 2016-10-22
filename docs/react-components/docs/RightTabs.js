var React = require("react");
var update = require("react-addons-update");

module.exports = React.createClass({

  getInitialState: function() {
    return {
      tabs: [
        {id: "try", title: "Try", active: true},
        {id: "code", title: "Code", active: false}
      ]
    }
  },

  changeTab: function(tab) {
    var updatedTabs = update(this.state.tabs, {$apply: function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id == tab.id) {
          tabs[i].active = true;
        } else {
          tabs[i].active = false;
        }
      }

      return tabs;

    }});

    this.setState({
      tabs: updatedTabs
    }, function() {
      this.props.onChangeTab(tab);
    }.bind(this));

  },

  render: function() {
    return (
        <div className="right-tab-bar">
          {this.state.tabs.map(function(tab, index) {
            var boundClick = this.changeTab.bind(this, tab, index);
            var tabClasses = "right-tab";

            console.log(tab);

            if (tab.active) {
              tabClasses += " right-tab-active";
            }

            console.log(tabClasses);

            return (
              <div key={tab.id} className={tabClasses} onClick={boundClick}>{tab.title}</div>
            )
          }.bind(this))}
        </div>
    )
  }

});
