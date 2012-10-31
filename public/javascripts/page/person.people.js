/*
 * person set_password
 */
require(['jquery', 'app/post_url'], function($, post_url){
  $(function(){
    
    $('#person_sidebar_nav > li.person-sidebar-people').addClass('active');

    $('a.person-destroy-action').bind('click', function(event){
      event.preventDefault();

      // 删除标签
      post_url({
        action: this.href,
        method: 'delete'
      });
    });

  });
});