var React = require("react");
var HttpServices = require("../services/HttpServices");
var update = require("react-addons-update");

module.exports = React.createClass({

  getInitialState: function() {
    return {
      contentEditable: false
    }
  },

  onDoubleClick: function() {
    if (this.props.editable && !this.state.contentEditable) {
      this.setState({
        contentEditable: true
      }, function() {
        setTimeout(function() {
          this.refs.contentEditable.focus();
        }.bind(this), 500);
      }.bind(this));
    }
  },

  setHtml: function() {
    return {__html: this.props.content};
  },

  save: function() {
    this.setState({
      contentEditable: false
    });

    var newValue = this.refs.editableField.innerHTML;

    var updatedApi = update(this.props.api, {$apply: function(api) {
      api[this.props.path][this.props.fileName] = newValue;
      return api;
    }.bind(this)});

    HttpServices.post("/cheesetoastie/" + this.props.path, {field: this.props.fieldName, value: newValue}, function(err, res) {
      if (err) {
        console.error(err);
      }
    });

    this.props.onApiUpdate(updatedApi);

  },

  render: function() {
    var classes = "";
    var buttons = null;

    if (this.props.className) {
      classes += this.props.className;
    }

    if (this.state.contentEditable) {
      classes += " content-editable";
      buttons = (
        <div className="content-editable-buttons">
          <div className="content-editable-button-save" onClick={this.save}>Save</div>
        </div>
      )
    }

    return (
      <div className={classes} onDoubleClick={this.onDoubleClick}>
        <div contentEditable={this.state.contentEditable} ref="editableField" dangerouslySetInnerHTML={this.setHtml()}></div>
        {buttons}
      </div>
    )
  }


});
