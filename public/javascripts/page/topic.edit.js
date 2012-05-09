/*
 * topic edit
 */
require(['jquery', 'lib/pagedown/Markdown'], function($, Markdown){
  // Markdown editor
  $(function(){
    (function run_md_editor(){
      var converter = Markdown.getSanitizingConverter();
      var editor = new Markdown.Editor(converter);
      editor.run();	
    })();

    // tag
    $('.tags').delegate('input[type=checkbox]', 'change', function(event){
      console.log('change');
      var $checkbox = $(this)
        , $tag = $checkbox.parents('.tag')
        , checked_class = 'tag-checked';
      if($checkbox[0].checked){
        $tag.addClass(checked_class);
      }
      else{
        $tag.removeClass(checked_class);
      }
    });

    // 分享到首页
    $('#share2home').bind('change', function(event){
      if(this.checked){
        $('#share2home_file').slideDown();
      }
      else{
        $('#share2home_file').slideUp();
      }
    });
    
    // 初始化checkbox
    $('#share2home').trigger('change');

  });
});