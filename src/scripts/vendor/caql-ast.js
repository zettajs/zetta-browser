var CaqlAst = {};

CaqlAst.SelectStatementNode = function(fieldListNode, filterNode, orderByNode) {
  this.fieldListNode = fieldListNode;
  this.filterNode = filterNode;
  this.orderByNode = orderByNode;
  this.type = 'SelectStatement';
};

CaqlAst.FieldListNode = function(seed) {
  this.fields = [];

  if (seed) {
    this.fields.push(seed);
  }

  this.type = 'FieldList';
};

CaqlAst.FieldListNode.prototype.push = function(field) {
  this.fields.push(field);
};

CaqlAst.ColumnNode = function(name, alias) {
  this.name = name;
  this.alias = alias;

  this.type = 'Column';
};

CaqlAst.FilterNode = function(expression) {
  this.expression = expression;
  this.type = 'Filter';
};

CaqlAst.NotNode = function(expression){
  expression.negate();
  this.expression = expression;
  this.type = 'Not';
};

CaqlAst.DisjunctionNode = function(left, right) {
  this.isNegated = false;
  this.left = left;
  this.right = right;
  this.type = 'Disjunction';
};

CaqlAst.DisjunctionNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.ConjunctionNode = function(left, right) {
  this.isNegated = false;
  this.left = left;
  this.right = right;
  this.type = 'Conjunction';
};

CaqlAst.ConjunctionNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.ComparisonPredicateNode = function(field, operator, value) {
  this.field = field;
  this.operator = operator;
  this.value = value;
  this.isNegated = false;
  this.type = 'ComparisonPredicate';
};

CaqlAst.ComparisonPredicateNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.ContainsPredicateNode = function(field, value) {
  this.field = field;
  this.operator = 'contains';
  this.value = value;
  this.isNegated = false;
  this.type = 'ContainsPredicate';
};

CaqlAst.ContainsPredicateNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.LikePredicateNode = function(field, value) {
  this.field = field;
  this.operator = 'like';
  this.value = value;
  this.isNegated = false;
  this.type = 'LikePredicate';
};

CaqlAst.LikePredicateNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.LocationPredicateNode = function(field, value) {
  this.field = field;
  this.operator = 'within';
  this.value = value;
  this.isNegated = false;
  this.type = 'LocationPredicate';
};

CaqlAst.LocationPredicateNode.prototype.negate = function() {
  this.isNegated = !this.isNegated;
  return this;
};

CaqlAst.LocationNode = function(distance, coordinates) {
  this.distance = distance;
  this.coordinates = coordinates;
  this.type = 'Location'
};

CaqlAst.CoordinatesNode = function(lattitude, longitude) {
  this.lattitude = lattitude;
  this.longitude = longitude;
  this.type = 'Coordinates';
};

CaqlAst.OrderByNode = function(sortList) {
  this.sortList = sortList;
  this.type = 'OrderBy';
};

CaqlAst.SortListNode = function(initial) {
  this.sorts = [initial];
  this.type = 'SortList';
};

CaqlAst.SortListNode.prototype.push = function(item) {
  this.sorts.push(item);
};

CaqlAst.SortNode = function(field, direction) {
  this.field = field;
  this.direction = direction ? direction.toLowerCase() : 'asc';
  this.type = 'Sort';
};

Object.keys(CaqlAst).forEach(function(key) {
  if (CaqlAst.hasOwnProperty(key)) {
    CaqlAst[key].prototype.accept = function(visitor) {
      visitor.visit(this);
    };
  }
});


