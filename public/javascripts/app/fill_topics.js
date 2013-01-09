define(['jquery'], function($){
  return function(options){

      var settings = $.extend({
        container: '.sidebar > .latest-topics'
      }, options || {});

      // 填充标签
      var $container = $(settings.container);
      if($container.length){
        $.get('/topics/latest.json', function(json){
          if(!json || !json.success){
            return;
          }

          var str = []
            , topics = json.topics;

          for(var i = 0; i < topics.length; i++){
            str.push('<a href="/topics/' + topics[i]._id + '" title="' + topics[i].title + '">' + topics[i].title.substr(0, 30) + '</a>');
          }

          $container.html(str.join(''));

        });
      }
  };
});