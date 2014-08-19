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
});
