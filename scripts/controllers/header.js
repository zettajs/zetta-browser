angular.module('zetta').controller('HeaderCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {

    $scope.servers = zettaShared.servers;
    $scope.breadcrumbs = zettaShared.breadcrumbs;
    $scope.follow = function(url) {
      url = url || zettaShared.root;
      navigator.transitionTo(url, { url: url });
    }
}]);
