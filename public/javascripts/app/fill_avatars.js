define(['jquery'], function($){
  return function(options){

      var settings = $.extend({
        container: ''
      }, options || {});

      // 填充会员头像
      $.get('/people.json', function(json){
        if(!json || !json.success){
          return;
        }

        var avatars = []
          , people = json.people;

        for(var i = 0; i < people.length; i++){
          avatars.push('<a href="#"><img width="40" height="40" src="' + people[i].avatar + '" alt="' + people[i].name + '" title="' + people[i].name + '" class="team-avatar" /></a>');
        }

        var $container = $(settings.container);

        if($container.length){
          $container.html(avatars.join(''));
        }

      });
  };
});