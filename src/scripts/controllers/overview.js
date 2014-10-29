angular.module('zetta').controller('OverviewCtrl', [
  '$scope', '$state', '$http', '$location', '$window', 'navigator', 'zettaShared',
    function($scope, $state, $http, $location, $window, navigator, zettaShared) {
  $scope.pinned = zettaShared.state.pinned;
  $scope.servers = zettaShared.state.servers;
  $scope.muted = zettaShared.state.muted;
  $scope.query = zettaShared.state.query;
  $scope.showAdvancedQuery = false;
  $scope.activeQuery = null; 
  $scope.queryError = null;
  
  $scope.pageNav = null;
  $scope.loading = true;
  $scope.hasDevices = false;

  $scope.init = function() {
    console.log('scope.query:', $scope.query);
    console.log('shared.query:', zettaShared.state.query);
    loadServers();
  };

  $scope.$watch('pageNav', function() {
    if ($scope.pageNav === null) {
      return;
    }

    if($('#' + $scope.pageNav).length){
      var pos = $('#' + $scope.pageNav)[0].offsetTop - $('nav:first').height() - $('#wampum').height() -32;
      
      $(window).scrollTop(pos);
      $scope.pageNav = null;
    }
  });    

  $scope.clearQuery = function() {
    $scope.servers.forEach(function(server) {
      server.lastSearch = null;
      server.devices.forEach(function(device) {
        device.available = true;
      });
    });

    $scope.activeQuery = null;
    $scope.query = null;
    zettaShared.state.query = null;

    delete $state.params.query;
    if (!$state.params.filter) {
      delete $state.params.filter;
    }

    $location.search($state.params);
  };

  $scope.submitQuery = function() {
    var isValid = false;

    try {
      caql.parse($scope.query);
      $scope.queryError = null;
      $scope.activeQuery = $scope.query;
      isValid = true;
      zettaShared.state.query = $scope.query;
    } catch(e) {
      $scope.queryError = e.message;
      $scope.activeQuery = null;
    }

    if (!isValid || !$scope.servers.length) {
      return;
    }

    $scope.servers.forEach(function(server) {
      var queryActions = server.actions.filter(function(action) {
        return action.name === 'query-devices';
      });

      if (!queryActions.length) {
        return;
      }

      var queryAction = queryActions[0];
      console.log(queryAction);

      var qlFields = queryAction.fields.filter(function(field) {
        return field.name === 'ql';
      });

      if (!qlFields.length) {
        return;
      }

      var qlField = qlFields[0];

      qlField.value = $scope.query;

      server.devices.forEach(function(device) {
        device.available = false;
      });

      $state.params.query = $scope.query;
      if (!$state.params.filter) {
        delete $state.params.filter;
      }
      $location.search($state.params);

      queryAction.execute(function(result) {
        server.lastSearch = result.config.url;
        var data = result.data;
        if (!data.entities.length) {
          return;
        }
        data.entities.forEach(function(entity) {
          var selfHref;

          entity.links.forEach(function(link) {
            if (link.rel.indexOf('self') !== -1) {
              selfHref = link.href;
            }
          });

          if (!selfHref) {
            return;
          }

          server.devices.forEach(function(device) {
            if (device.href === selfHref) {
              device.available = true;
            }
          });
        });
        console.log(data);
      });
    });
  };
      
  function loadServers() {
    
    zettaShared.state.root = $state.params.url;
    zettaShared.state.breadcrumbs = [];
    zettaShared.state.onStreamUpdate = function() {
      $scope.$apply();
    };

    var rootUrl = zettaShared.state.root;

    if (!rootUrl) {
      var parser = document.createElement('a');
      parser.href = $state.params.url;
      rootUrl = parser.protocol + '//' + parser.hostname;
      if (parser.port) {
        rootUrl += ':' + parser.port;
      }

      zettaShared.state.root = rootUrl;
    }

    if ($state.params.filter) {
      $scope.filter = $state.params.filter;

      zettaShared.state.breadcrumbs = [
        { title: 'root', href: $state.params.url },
        { title: $state.params.filter }
      ];
    }

    if (!zettaShared.state.servers.length) {
      zettaShared.state.loadServers(rootUrl, function() {
        if ($state.params.filter) {
          filterServer();
          console.log('state.params:', $state.params);
          if ($state.params.query) {
            console.log('has query');
            $scope.query = $state.params.query;
            $scope.submitQuery();
          }
        } else {
          zettaShared.state.servers.forEach(function(server) {
            server.available = true;
            if (server.devices && !$scope.hasDevices) {
              $scope.hasDevices = true;
            }
          })
        }

        $scope.loading = false;

        console.log('state.params:', $state.params);
        if ($state.params.query) {
          console.log('has query');
          $scope.query = $state.params.query;
          $scope.submitQuery();
        }
      });
    } else {
      if ($state.params.filter) {
        filterServer();
        console.log('state.params:', $state.params);
        if ($state.params.query) {
          console.log('has query');
          $scope.query = $state.params.query;
          $scope.submitQuery();
        }
      } else {
        zettaShared.state.servers.forEach(function(server) {
          server.available = true;
          if (server.devices && !$scope.hasDevices) {
            $scope.hasDevices = true;
          }
        })
      }
      $scope.loading = false;
      console.log('state.params:', $state.params);
      if ($state.params.query) {
        console.log('has query');
        $scope.query = $state.params.query;
        $scope.submitQuery();
      }
    }
  }

  $scope.loadServer = function(server) {
    $state.params.filter = server.name;
    $location.search($state.params);
    loadServers();
    $window.scrollTo(0, 0);
    
  };

  var filterServer = function() {
    var width = $('.dnastrip canvas').width();
    var height = $('.dnastrip canvas').height();

    $scope.servers.forEach(function(server) {
      if (server.name !== $state.params.filter) {
        server.available = false;
      } else {
        if (!server.devices) {
          return;
        }

        server.devices.forEach(function(device) {
          if (!device.streams) {
            return;
          }

          device.streams.forEach(function(stream) {
            if (typeof stream.refresh === 'function') {
              setTimeout(function() {
                stream.refresh(width);
              }, 100);
            }
          });
        });
      }
    });
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
