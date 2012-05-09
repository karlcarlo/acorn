define(['jquery'], function($){
  return function(options){

      var settings = $.extend({
        container: '.sidebar > .smart-tags'
      }, options || {});

      // 填充标签
      var $container = $(settings.container);
      if($container.length){
        $.get('/tags.json', function(json){
          if(!json || !json.success){
            return;
          }

          var str = []
            , tags = json.tags;

          for(var i = 0; i < tags.length; i++){
            str.push('<a href="/topics?tag=' + tags[i]._id + '" title="' + tags[i].description + '">' + tags[i].name + '</a>');
          }

          $container.html(str.join(''));

        });
      }
  };
});