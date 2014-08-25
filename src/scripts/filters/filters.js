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
  if(input > (1000 * 60 * 1.5)){ return (input / (1000 * 60)).toFixed(2) + " m"; }
  else if(input > 10000){ return (input / 1000).toFixed(1) + " s"; } 
  else {return input + " ms";}
 }
});
