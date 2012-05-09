/*
 * person tags
 */
require(['jquery', 'app/post_url'], function($, post_url){
  $(function(){
    
    $('#person_sidebar_nav > li.person-sidebar-comments').addClass('active');


    $('a.comment-destroy-action').bind('click', function(event){
      event.preventDefault();

      // 删除标签
      post_url({
        action: this.href,
        method: 'delete'
      });
    });

  });
});