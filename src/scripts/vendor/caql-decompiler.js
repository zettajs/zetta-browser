var CaqlDecompiler = function() {
  this.fields = [];
  this.sorts = '';
  this.filter = [];
  this.params = {};
};

CaqlDecompiler.prototype.visit = function(node) {
  this['visit' + node.type](node);
};

CaqlDecompiler.prototype.decompile = function(ast) {
  ast.accept(this);

  var fields = [];
  var hasFields = false;
  
  this.fields.forEach(function(field) {
    if (field.name) {
      hasFields = true;
      if (field.alias) {
        fields.push(field.name + ' as ' + field.alias);
      } else {
        fields.push(field.name);
      }
    }
  });

  var statement = fields.length ? 'select ' + fields.join(', ') + ' ' : '';

  if (this.filter.length) {
    statement += 'where ' + this.filter.join(' ');
  }

  if (this.sorts) {
    statement += ' order by ' + this.sorts;
  }

  return statement;
};

CaqlDecompiler.prototype.visitSelectStatement = function(statement) {
  if (statement.fieldListNode.fields.length) {
    statement.fieldListNode.accept(this);
  }

  if (statement.filterNode) {
    statement.filterNode.accept(this);
  }
  if (statement.orderByNode) {
    statement.orderByNode.accept(this);
  }
};

CaqlDecompiler.prototype.visitFieldList = function(fieldList) {
  this.fields = fieldList.fields;
};

CaqlDecompiler.prototype.visitFilter = function(filterList) {
  filterList.expression.accept(this);
};

CaqlDecompiler.prototype.visitOrderBy = function(orderBy) {
  this.sorts = orderBy.sortList.sorts.map(function(sort) {
    var str = sort.field;
    if (sort.direction) {
      str += ' ' + sort.direction;
    }

    return str;
  }).join(', ');
};

CaqlDecompiler.prototype.visitLocationPredicate = function(location) {
  if (location.operator !== 'within') {
    return;
  }

  if (location.isNegated) {
    this.filter.push('not');
  }

  this.filter.push('location within');
  this.filter.push(location.value.distance);
  this.filter.push('of');
  this.filter.push(location.value.coordinates.lattitude + ',');
  this.filter.push(location.value.coordinates.longitude);
};

CaqlDecompiler.prototype.visitConjunction = function(conjunction) {
  if (conjunction.isNegated) {
    this.filter.push('not');
  }
  //this.filter.push('(');
  conjunction.left.accept(this);
  this.filter.push('and');

  if (conjunction.right.type === 'Disjunction') {
    this.filter.push('(');
    conjunction.right.accept(this);
    this.filter.push(')');
  } else {
    conjunction.right.accept(this);
  }
  //this.filter.push(')');
};

CaqlDecompiler.prototype.visitDisjunction = function(disjunction) {
  if (disjunction.isNegated) {
    this.filter.push('not');
  }
  this.filter.push('(');
  disjunction.left.accept(this);
  //this.filter.push('or');
  //disjunction.right.accept(this);
  //this.filter.push(')');
  if (disjunction.right.type === 'Disjunction') {
    this.filter.push('(');
    disjunction.right.accept(this);
    this.filter.push(')');
  } else {
    disjunction.right.accept(this);
  }
};

CaqlDecompiler.prototype.visitLikePredicate = function(like) {
  var isParam = false;

  if (typeof like.value === 'string'
      && like.value[0] === '@' && this.params) {
    like.value = this.params[like.value.substring(1)];
    isParam = true;
  }

  if (typeof like.value === 'string') {
    like.value = normalizeString(like.value, isParam);
  }

  var expr = [like.field, like.isNegated ? 'not like' : 'like', like.value];

  this.filter.push(expr.join(' '));
};

CaqlDecompiler.prototype.visitMissingPredicate = function(missing) {
  var isParam = false;

  if (typeof missing.value === 'string'
      && missing.value[0] === '@' && this.params) {
    missing.value = this.params[missing.value.substring(1)];
    isParam = true;
  }

  if (typeof missing.value === 'string') {
    missing.value = normalizeString(missing.value, isParam);
  }

  var expr = [missing.field, 'is', missing.isNegated ? 'not missing' : 'missing'];

  this.filter.push(expr.join(' '));

};

CaqlDecompiler.prototype.visitContainsPredicate = function(contains) {
  var isParam = false;

  if (typeof contains.value === 'string'
      && contains.value[0] === '@' && this.params) {
    contains.value = this.params[contains.value.substring(1)];
    isParam = true;
  }

  if (typeof contains.value === 'string') {
    contains.value = normalizeString(contains.value, isParam);
  }

  var expr = [contains.field, 'contains', contains.value];

  if (contains.isNegated) {
    expr.unshift('not');
  }

  this.filter.push(expr.join(' '));
};

CaqlDecompiler.prototype.visitComparisonPredicate = function(comparison) {
  if (!comparison.array) comparison.array = [];

  var isParam = false;
  if (typeof comparison.value === 'string'
      && comparison.value[0] === '@' && this.params) {
    comparison.value = this.params[comparison.value.substring(1)];
    isParam = true;
  }

  if (typeof comparison.value === 'string') {
    comparison.value = normalizeString(comparison.value, isParam);
  }

  var expr = [comparison.field, symbolify(comparison.operator), comparison.value];
  if (comparison.isNegated) {
    expr.unshift('not');
  }
  comparison.array.push(expr.join(' '));
  this.filter.push(expr.join(' '));
};


var symbolify = function(letters) {
  var map = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '='
  };

  return map.hasOwnProperty(letters) ? map[letters] : letters;
};

var normalizeString = function(str, isParam) {
  if (str[0] === '\'' && str[str.length - 1] === '\'') {
    return str;
  }

  if (!isParam && str[0] === '"' && str[str.length - 1] === '"') {
    str = str.substring(1, str.length - 1);
  }

  str = JSON.stringify(str);

  str = str.substring(1, str.length - 1);
  str = str.replace("'", "\\'");
  str = str.replace('\\"', '"');

  if (isNaN(Number(str))) {
    str = '"' + str + '"';
  }

  return str;
};
