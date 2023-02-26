/* jshint esversion: 6 */
/* global $, document, console */

(function() {
    "use strict";
    
    const _ellipsisSelector = ".post-excerpt"

    //On document ready
    $(document).ready(function () {
        
        //Loop over query selector and initialise the Dotdotdot lib to ensure content overflow ellipsis'
        if($(_ellipsisSelector).length > 0){
            $(_ellipsisSelector).each(function(){
                new Dotdotdot(this, {
                    ellipsis: " \u2026"
                });
            });
        }
    });
})();