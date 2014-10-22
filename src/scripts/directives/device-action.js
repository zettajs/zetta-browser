angular.module('zetta').directive('zettaDeviceAction', [function() {
  var link = function(scope, element) {

    if (scope.action.fields.length === 2 && (scope.action.fields[0].type === 'radio' || scope.action.fields[1].type === 'radio')) {
      var radio = scope.action.fields.filter(function(field) {
        return field.type === 'radio';
      })[0];

      scope.action.radioField = {
        name: radio.name,
        value: radio.value
      };

      scope.action.radioField.value.forEach(function(val) {
        val.execute = function() {
          radio.value = val.value;
          scope.execute();
        };
      });
      scope.action.renderOptionsAsRadioButtons = true;
    } else {

      if (scope.action.fields.length > 2) {
        scope.action.renderOptionsAsMultipleInputs = true;
      } else {
        scope.action.renderOptionsAsButton = true;
      }

      scope.action.inputFields = scope.action.fields; // create copy so mutations dont show up in api response section
      scope.action.inputFields.forEach(function(field, i) {
        if (!field.type) {
          field.type = 'text';
        }

        field.isHidden = (field.type === 'hidden') ? true : false;

        if (field.type === 'radio') {
          field.options = field.value;
          field.value = '';

        }

        // When no value is set, set as empty string.
        if (field.value === undefined) {
          field.value = '';
        }
      });
    }

    scope.execute = function() {
      var button = $('.' + scope.action.name + '-button', element);

      button.addClass('loading');
      scope.action.execute();
      button.removeClass('loading');
      button.addClass('success');
      setTimeout(function() {
        button.removeClass('success');
      }, 1000);
    };
  };

  return {
    restrict: 'E',
    scope: {
      action: '=value'
    },
    templateUrl: 'partials/device-actions.html',
    link: link
  };
}]);
