/* jshint esversion: 6 */
/* global $, document, console */

(function() {
    "use strict";
    
    //On document ready
    $(document).ready(function () {
        
        //Loop over forms to add an event listener which prevents submission if an input within the form is invalid
        $(".needs-validation").each(function () {
            $(this).submit(function(e) {
                if(!this.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                $(this).addClass("was-validated");
            });
        });
    });
})();