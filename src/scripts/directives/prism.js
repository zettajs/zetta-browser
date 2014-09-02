angular.module('zetta').directive('prism', [function() {
    return {
        restrict: 'A',
        scope: {
            source: '@'
        },
        link: function(scope, element, attrs) {
            scope.$watch('source', function(v) {
                if(v) {
                    Prism.highlightElement(element.find("code")[0]);
                }
            });
        },
        template: "<code ng-bind='source'></code>"
    };
}]);