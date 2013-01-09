require.config({
  baseUrl: '/javascripts'
});

/*
 * Application
 */
require([
  'jquery', 
  'app/fill_tags',
  'app/fill_topics',

  'lib/bootstrap/js/bootstrap',
  '/javascripts/lib/google-code-prettify/prettify.js'
], function(
  $, 
  fill_tags,
  fill_topics
){
  $(function(){
    // init code highlight
    $('code').parent('pre').addClass('prettyprint linenums');
    window.prettyPrint && prettyPrint();

    fill_tags();
    fill_topics();

  });
});