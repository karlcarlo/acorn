/*
 * Application
 */
require(['jquery', 'app/fill_tag', '/javascripts/lib/google-code-prettify/prettify.js'], function($, fill_tag){
	$(function(){
		// init code highlight
		$('code').parent('pre').addClass('prettyprint linenums');
		window.prettyPrint && prettyPrint();

    // ÃÓ≥‰±Í«©
    fill_tag();

  });
});