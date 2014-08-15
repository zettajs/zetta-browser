'use strict';

/* Services */

var sirenServices = angular.module('sirenServices', []);

// A way to connect to and display streaming data 

sirenServices.factory('getStreams', ['$q', '$http',
  function($q, $http) {
      return {
        atURL:function(href){
          var entity = $q.defer(); //I promise 
            
          $http.get(href).success(function(response) { 
            //default response
            var e = {
              streams: {},
              actions: {},
              totalStreams: 0,
              totalActions: 0
            };
          
            if (response.links) {
              //go over each action
              angular.forEach(response.links, function(link) {
                if (link.rel.indexOf('http://rels.zettajs.io/object-stream') !== -1) {
                  if (link.title === 'logs' || link.title === 'state') {
                    return;
                  }

//                if it has a stream, add it to e
                  var stream = {
                    action: link,
                    name: link.title.replace(/\//g, '_'),
                    data: [],
                    xFunction: function(){ return function(d){ return d[0]; } },
                    yFunction: function(){ return function(d){ return d[1]; } },
                    xTickFunction: function(d3) { return d3.time.format('%H:%M:%S'); },
                    min: null,
                    max: null
                  };
                  e.streams[link.title] = stream;
                  e.totalStreams++;
                } else {
//                if it has another action type, add it to e                  
                  /*var act = { 
                    name: link.title.replace(/\//g, '_'),
                    action: link
                  }
                  angular.extend(act, link);
                  e.actions[act.name] = act;
                  e.totalActions++;*/
                  
                }
              });
            }
            entity.resolve(e);
          });
          return entity.promise;
        }// /atURL
      }
    }
                                       
]);

sirenServices.factory('Page', function() {
   var title = 'Zetta Browser';
   return {
     title: function() { return title; },
     setTitle: function(newTitle) { title = newTitle + " - Zetta Browser"}
   };
});

//Breadcrumbs
//sirenServices.factory('breadcrumbs', ['$q', '$http',
