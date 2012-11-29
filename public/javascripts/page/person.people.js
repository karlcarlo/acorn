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

    
    // 设置激活状态
    $('input.person-active-action').bind('change', function(event){
      event.preventDefault();

      // 冻结或激活用户状态
      post_url({
        action: $(this).attr('data-href'),
        method: 'put',
        param: {
          active: this.checked
        }
      });
    });
    
    

  });
});