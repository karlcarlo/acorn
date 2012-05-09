/*
 * person profile
 */
require(['jquery', 'app/post_url'], function($, post_url){
  $(function(){
    
    $('#person_sidebar_nav > li.person-sidebar-profile').addClass('active');

    $('a.topic-destroy-action').bind('click', function(event){
      event.preventDefault();

      // ɾ����ǩ
      post_url({
        action: this.href,
        method: 'delete'
      });
    });

  });
});