angular.module('zetta').directive('zettaAdvancedQuery', [function() {
  function link(scope, element) {
    var emptyFilter = function() {
      return {
        field: null,
        operator: 'eq',
        value: null
      }
    };

    scope.filters = [emptyFilter()];

    scope.addNewFilter = function() {
      scope.filters.push(emptyFilter());
    };

    scope.removeFilter = function(i) {
      scope.filters.splice(i, 1);
      if (scope.filters.length === 0) {
        scope.addNewFilter();
      }
    };

    scope.performQuery = function() {
      var filters = scope.filters.filter(function(filter) {
        return !!filter.field;
      });

      if (filters.length) {
        scope.setQueryFilters(filters);
        scope.submit();
      }
    };

    scope.$watchCollection('current', function() {
      scope.filters = scope.current;
    });
  }

  return {
    restrict: 'E',
    scope: {
      dismiss: '&',
      submit: '&',
      current: '=',
      setQueryFilters: '='
    },
    templateUrl: 'partials/advanced-query.html',
    link: link
  };
}]);
