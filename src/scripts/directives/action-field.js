angular.module('zetta')
  .directive('includeReplace', function () {
      return {
          require: 'ngInclude',
          restrict: 'A', /* optional */
          link: function (scope, el, attrs) {
              el.replaceWith(el.children());
          }
      };
  })
  .directive('actionField', [function() {


    function link(scope, element, attrs) {
      var template = scope.field.type;
      var valid = ['hidden', 'text', 'search', 'tel', 'url', 'email', 'password', 'datetime', 'date', 'month', 'week', 'time', 'datetime-local', 'number', 'range', 'color', 'checkbox', 'radio', 'file', 'image', 'button'];
      
      if(valid.indexOf(scope.field.type) == -1){template = 'default'} //attempt to fail fast and gracefully
      else if(scope.field.type == 'text'){ template = 'default' }
      else if(['number', 'range'].indexOf(scope.field.type) > -1){ template = 'number'; } //normalize
      else if(['select', 'radio'].indexOf(scope.field.type) > -1){ template = 'dropdown'; } //normalize

      scope.contentUrl = 'partials/fields/'+template+'.html'
      //scope.contentUrl = 'partials/fields/default.html'
      console.log(scope.contentUrl);
    };

    return {
      restrict: 'E',
      scope: {
        field: '=value'
      },
      link: link,
      template: '<div ng-include="contentUrl"></div>'
    };
  }]);
