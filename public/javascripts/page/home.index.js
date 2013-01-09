/*
 * home index
 */
require(['jquery', 'app/fill_avatars'], function($, fill_avatars){
  $(function(){
    
    fill_avatars({
      container: '#people_avatars' 
    });

  });
});