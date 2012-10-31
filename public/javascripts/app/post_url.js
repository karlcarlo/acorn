define(['jquery'], function($){
  return function(options){

    var settings = $.extend({
      action: '',
      method: 'post',
      callback: null,
      param: null
    }, options || {});

    if(settings.action == ''){
      return;
    }

    var form = [
      '<form action="', settings.action, '" method="', (settings.method == 'get'? 'get' : 'post'), '">',
      '<input type="hidden" name="_method" value="', settings.method, '">'
    ];
    
    if(settings.param){
      var param = settings.param;
      for(key in param){
        if(param.hasOwnProperty(key)){
          form.push('<input type="hidden" name="' + key + '" value="' + param[key] + '">');
        }
      }
    }
    
    form.push('</form>');

    var $form = $(form.join(''));

    $('body').append($form);

    $form.submit(function(){
      if($.isFunction(settings.callback)){
        settings.callback();
      }
    });

    $form.trigger('submit');
  };
});