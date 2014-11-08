angular.module('zetta')
.filter('prettify', function() {
  return function(obj) {
    return JSON.stringify(obj, function(key, val) {
      return (key === '$$hashKey') ? undefined : val;
    }, 2);
  };
})
.filter('pluralize', function() {
  return function(ordinal, noun) {
    if (ordinal == 1) {
      return ordinal + ' ' + noun;
    } else {
      var plural = noun;
      if (noun.substr(noun.length - 2) == 'us') {
        plural = plural.substr(0, plural.length - 2) + 'i';
      } else if (noun.substr(noun.length - 2) == 'ch' || noun.charAt(noun.length - 1) == 'x' || noun.charAt(noun.length - 1) == 's') {
        plural += 'es';
      } else if (noun.charAt(noun.length - 1) == 'y' && ['a','e','i','o','u'].indexOf(noun.charAt(noun.length - 2)) == -1) {
        plural = plural.substr(0, plural.length - 1) + 'ies';
      } else if (noun.substr(noun.length - 2) == 'is') {
        plural = plural.substr(0, plural.length - 2) + 'es';
      } else {
        plural += 's';
      }
      return ordinal + ' ' + plural;
    }
  };
})
.filter('datetime', function($filter) {
  return function(input){
    if(input == null){ return ""; } 
    var _date = $filter('date')(new Date(input), 'yy-dd-MMM HH:mm:ss.sss');
    return _date.toUpperCase();
  };

})
.filter('elapsed', function() {
 return function(input){ 
  if(input < 1000){return input + " ms";}
  else if(input < (1000 * 60)){ return (input / 1000).toFixed(1) + " s"; }
  else if(input < (1000 * 60 * 60)){
    return (input / (1000 * 60)).toFixed(2) + " m";
  }else if(input < (1000 * 60 * 60 * 24)){
    var h = parseInt(input / (1000 * 60 * 60));
    var min = (input / (1000 * 60)) % 60;
    return h + "h " + min + "m";
  }
 }
})
.filter('idSafe', function(){
  return function(input){ return input.replace(/([^A-z0-9])+/g,''); }
})
.filter('validInputType', function(){
  return function(input){ 
    
    var valid = ['hidden', 'text', 'search', 'tel', 'url', 'email', 'password', 'datetime', 'date', 'month', 'week', 'time', 'datetime-local', 'number', 'range', 'color', 'checkbox', 'radio', 'file', 'image', 'button'];
    
    if(valid.indexOf(input.toLowerCase()) > -1){
      return input.toLowerCase();
    }else{
      return 'text';
    }
    
  }
})
.filter('purify', function() {
  return function(input) {
    var purified = {};

    ['class', 'properties', 'entities', 'actions', 'links'].forEach(function(prop) {
      if (input.hasOwnProperty(prop)) {
        purified[prop] = input[prop];
      }
    });

    if (purified.actions) {
      purified.actions = purified.actions.map(function(action) {
        var a = {};
        ['class', 'name', 'method', 'href', 'fields'].forEach(function(prop) {
          if (action.hasOwnProperty(prop)) {
            a[prop] = action[prop];
          }
        });

        return a;
      });
    }

    return purified;
  };
})
.filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
  });
