define(['jquery'], function($){
  return function(options){

    var settings = $.extend({
      action: '',
      method: 'post',
      callback: null
    }, options || {});

    if(settings.action == ''){
      return;
    }

    var form = [
      '<form action="', settings.action, '" method="', (settings.method == 'get'? 'get' : 'post'), '">',
      '<input type="hidden" name="_method" value="', settings.method, '">',
      '</form>'
    ].join('');

    var $form = $(form);

    $('body').append($form);

    $form.submit(function(){
      if($.isFunction(settings.callback)){
        settings.callback();
      }
    });

    $form.trigger('submit');
  };
});