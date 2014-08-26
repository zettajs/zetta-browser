angular.module('zetta').controller('OverviewCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {
  $scope.pinned = zettaShared.state.pinned;
  $scope.servers = zettaShared.state.servers;
  $scope.muted = zettaShared.state.muted;

  $scope.init = function() {
    $scope.servers = zettaShared.state.servers = [];
    zettaShared.state.root = $state.params.url;
    zettaShared.state.breadcrumbs = [ { title: 'root', href: $state.params.url }];
    zettaShared.state.loadServers($state.params.url, zettaShared.state.execute);
  };

  $scope.resolve = function(href) {
    navigator.transitionTo(href, { url: href });
  };

  $scope.pin = function(characteristic) {
    characteristic.pinned = true;

    if (characteristic.muted) {
      $scope.unmute(characteristic);
    }

    if ($scope.pinned.indexOf(characteristic) === -1) {
      $scope.pinned.push(characteristic);
      setTimeout(function() {
        characteristic.pinOpen = true;
        $scope.$apply();
      }, 1);
    } else {
      $scope.unpin(characteristic);
    }
  };

  $scope.unpin = function(characteristic) {
    var index = $scope.pinned.indexOf(characteristic);
    if (index > -1) {
      characteristic.pinned = false;
      characteristic.pinOpen = false;
      setTimeout(function() {
        $scope.pinned.splice(index, 1);
      }, 1);
    }
  };

  $scope.mute = function(characteristic) {
    if (characteristic.pinned) {
      $scope.unpin(characteristic);
    }

    if ($scope.muted.indexOf(characteristic) === -1) {
      $scope.muted.push(characteristic);
      setTimeout(function() {
        characteristic.open = false;
        characteristic.muteOpen = true;
        $scope.$apply(function() {
          setTimeout(function() {
            characteristic.muted = true;
            $scope.$apply();
          }, 500);
        });
      }, 1);
    } else {
      $scope.unmute(characteristic);
    }
  };

  $scope.unmute = function(characteristic) {
    var index = $scope.muted.indexOf(characteristic);
    if (index > -1) {
      $scope.muted[index].muted = false;
      characteristic.muteOpen = false;
      setTimeout(function() {
        if (characteristic.available) {
          characteristic.open = true;
        }
        $scope.muted.splice(index, 1);
        $scope.$apply();
      }, 1);
    }
  };
}]);
