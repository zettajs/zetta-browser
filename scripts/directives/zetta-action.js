angular.module('zetta').directive('zettaAction', ['$compile', 'navigator', function($compile, navigator) {
  function link(scope, element, attrs) {
    if (!scope.action) {
      return;
    }

    var container = $('<div>').addClass("actionContent " + scope.action.name);
    var visible = false;
    
    function Label(obj){
      var defaults = {
        'class' : "control-label pure-u-1-3",
        'for'   : "zettaAction",
        'text'  : "Action"
      }
      var params = $.extend(defaults, obj);
      return $('<label>')
        .addClass(params.class)
        .attr('for',params.for)
        .text(params.text);
    }
    
    function Button(obj, scope){
      var defaults = {
        'dclass'  : "pure-button pure-button-primary",
        'class'   : "",
        'type'    : "submit",
        'icons'   : '<i class="fa fa-refresh fa-spin"></i><i class="fa fa-check"></i>',
        'html'    : "Update"
      }
      var params = $.extend(defaults, obj);
      var btn = $('<button>')
        .addClass(params.class)
        .addClass(params.dclass)
        .attr('type',params.type)
        .html(params.html + "&nbsp;" + params.icons);
      
      btn.click(function(e) {
        btn.addClass('loading');
        scope.action.execute(function() {
          btn.removeClass('loading');
          btn.addClass('success');
          setTimeout(function() {
            btn.removeClass('success');
          }, 1000);
        });
      });
      
      return btn;
      
    }
    
    function Input(obj){
      var defaults = {
        'name'        : "action",
        'class'       : "pure-input-2-3",
        'id'          : "zettaAction",
        'type'        : "text",
        'ng-model'    : "",
        'value'       : ""
      }
      var params = $.extend(defaults, obj);
      var output = $('<input>')
        .addClass(params.class)
        .attr('name', params.name)
        .attr('id', params.id)
        .attr('type', params.type)
        .attr('ng-model', params['ng-model'])
        .val(params.value);
      
      if(params.plaeholder !== 'undefined'){
        output.attr('placeholder', params.placeholder)
      }
      
      if(params['file-model'] !== 'undefined'){
        output.attr('file-model', params['file-model'])
      }
      
      return output;
      
    }
    
    for(var i = 0; i < scope.action.fields.length; i++) {
      var field = scope.action.fields[i];

      var label = Label({
          'for' : scope.action.name + field.name,
          'text': field.title || field.name
        });
      
      var controls = $('<div>').addClass('controls pure-g');
      
      var iput = {
          'name'      :   field.name,
          'id'        :   scope.action.name + field.name,
          'type'      :   field.type || 'text',
          'ng-model'  :   'action.fields[' + i + '].value',
          'value'     :   field.value
      }
       
      if(iput.type === 'text'){
        controls.addClass('text');
        iput.placeholder = field.title || field.name; 
        iput.class = "pure-input-1";
      }
      if(iput.type === 'file'){ 
        controls.addClass('file');
        iput['file-model'] = 'action.fields[' + i + '].file'; 
      }
      if(iput.type === 'hidden'){ 
        controls.addClass('hidden'); 
      }
      if(iput.type === 'number'){
        controls.addClass('number');
      }
      
      if (iput.type === 'radio' || iput.type === 'checkbox') {
        iput.value.forEach(function(val) {
          var input = $('<input>')
            .attr('name', iput.name)
            .attr('id', scope.action.name + field.name + val.value)
            .attr('type', iput.type)
            .attr('ng-model', iput['ng-model'])
            .val(val.value);

          $compile(input)(scope);

          var con = $('<div>').addClass('pure-u-1');

          con.append(input);

          var label = $('<label>')
            .attr('for', scope.action.name + field.name + val.value)
            .text(val.title || val.value);

          con.append('   ');
          con.append(label);
          con.append($('<br/>'));
          controls.append(con);
        });
      } else {
        var input = Input(iput);
        
        $compile(input)(scope);

        controls.append(input);
      }

      if (iput.type !== 'hidden') {
        visible = true;
        if (iput.type !== 'text') { controls.prepend(label) };
      }
      
      container.append(controls);
    }; //for actions loop


    if (!visible) {
      container.addClass("trigger");
      var btn = Button({
        'class' : 'action-button',
        'html'  : scope.action.name 
      }, scope);
      container.addClass("trigger");
    } else {
      var btn = Button({
        'class' : 'submit-button',
        'html'  : scope.action.name 
      }, scope);
    }

    $compile(btn)(scope);
      
    container.append(btn);
    
    element.replaceWith(container);
  }

  return {
    restrict: 'E',
    scope: {
      action: '=value'
    },
    link: link
  };
}])

