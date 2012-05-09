define(['jquery', 'lib/mustache', '/javascripts/lib/jquery.validate.js'], function($, mustache){
  return function(options){
    var settings = {
      wrapper_id: 'comment_wrapper'
      
    };
    $.extend(settings, options || {});

    var $wrapper = $('#' + settings.wrapper_id)
      , topic_id = $wrapper.attr('data-id');


    var data = { 
      topic_id: topic_id,
      is_signin: false,
      avatar: '/images/icon_avatar.png',
      comments: []
    }
    , template = {
      comment: [
        '<ol class="comment-list unstyled">',
        '</ol>',
        '{{#is_signin}}',
        '<form action="#" method="post" class="form-horizontal comment-post well">',
        '  <div class="control-group">',
        '    <div class="control-label"><img src="{{avatar}}" alt="" width="32" height="32" class="avatar"/></div>',
        '    <div class="controls"><textarea name="content" rows="3" placeholder="发布评论" class="comment-content span8 required" minlength="10"></textarea></div>',
        '  </div>',
        '  <div class="form-actions"><input type="hidden" name="tid" value="{{topic_id}}"/><input type="submit" value="评论" class="btn btn-primary"/></div>',
        '</form>',
        '{{/is_signin}}'
      ].join('\n'),
      /*
        
        "comments":[{
          "_id": id,
          "content": content,
          "created_at": create_at,
          "author":{
            "_id": author.id,
            "avatar": author.avatar,
            "email": author.email,
            "name": author.name
          },
          "topic":{
            "_id": topic.id,
            "title": topic.title
          }
        }]
       */
      comments_list: [
        '{{#comments}}',
        '  <li class="well"><img width="32" height="32" class="avatar" alt="" src="{{author.avatar}}"><span>{{author.name}}</span> | <small class="meta-date">{{created_at}}</small><p>{{&content}}</p></li>',
        '{{/comments}}'
      ].join('\n')
    };

    init();

// private functions
    function init(){

      // 加载评论
      $.get('/comments.json', { tid: topic_id }, function(json){
        if(!json || !json.success){
          return;
        }

        // 同步登录状态
        if(typeof json.avatar == 'string' && json.avatar != ''){
          data.avatar = json.avatar;
          data.is_signin = true;
        }
        

        // 渲染评论布局
        $wrapper.html(mustache.render(template.comment, data));
        if(data.is_signin){
          var $form = $('form.comment-post', $wrapper);
          $form.validate({
            submitHandler: post_comment,
            messages: {
              content: {
                required: '评论内容不能为空！',
                minlength: '评论内容不能少于10个字符！'}
            },
            wrapper: 'span.help-block'
          });
        }
        
        // 渲染评论列表
        data.comments = pretty_created_at(json.comments);
        $wrapper
        .find('ol.comment-list')
        .eq(0)
        .html(mustache.render(template.comments_list, data));

      }, 'json');
      
    }

    function post_comment(form){

      var $form = $(form);

      // 提交评论内容
      $.post('/comments', $form.serialize(), function(json){
        comment_count_increment();
        get_comments();
      }, 'json');
      return false;
    }

    function comment_count_increment(){
      if($('#comment_count').length){
        var count = parseInt($('#comment_count').text());
        if(isNaN(count)){ return };
        
        // 评论数加1
        count += 1;
        $('#comment_count').text(count);
      }
    }

    function get_comments(callback){
      $.get('/comments.json', { tid: topic_id }, function(json){
        if(!json || !json.success){
          return;
        }

        data.comments = pretty_created_at(json.comments);
        if(typeof json.avatar == 'string' && json.avatar != ''){
          data.avatar = json.avatar;
          data.is_signin = true;
        }
        

        $wrapper
        .find('ol.comment-list')
        .eq(0)
        .html(mustache.render(template.comments_list, data));

        if($.isFunction(callback)){
          callback();
        }
      }, 'json');
      
    }

    function pretty_created_at(list){
      if(!$.isArray(list)){
        return list;
      }

      for( var i = 0; i < list.length; i++){
        var obj = list[i]
          , str_date = obj.created_at
          , obj_date = new Date(str_date)
          , year = obj_date.getFullYear()
          , month = obj_date.getMonth() + 1
          , date = obj_date.getDate()
          , hours = obj_date.getHours()
          , minutes = obj_date.getMinutes();

        if(year == new Date().getFullYear()){
          // 如果是今年则隐藏年份
          year = '';
        }
        else{
          year += '-';
        }

        if(month < 10){
          month = '0' + month + '-';
        }
        else {
          month += '-';
        }

        if(date < 10){
          date = '0' + date;
        }

        if(hours < 10){
          hours = '0' + hours + ':';
        }
        else {
          hours += ':';
        }

        if(minutes < 10){
          minutes = '0' + minutes;
        }

        list[i].created_at = year + month + date + ' ' + hours + minutes;
      }

      return list;
    }

  };
});