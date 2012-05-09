/*
 * home index
 */
require(['jquery', 'app/fill_avatar'], function($, fill_avatar){
  $(function(){
    
    fill_avatar({
      container: '#people_avatars' 
    });

  });
});