angular.module('zetta').controller('MainCtrl', [
  '$scope', '$state', 'navigator', 'appState', 'zettaShared',
  function($scope, $state, navigator, appState, zettaShared) {
    zettaShared.breadcrumbs = [];
    zettaShared.servers = [];

    $scope.init = function() {
      $scope.params = { url: appState.url || '' };
    };

    $scope.fetchUrl = function(params) {
      var url = params.url;
      appState.url = url;
      navigator.transitionTo(url, { url: url });
    };
  }
]);
