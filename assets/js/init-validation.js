/* jshint esversion: 6 */
/* global $, document, console */

(function() {
    "use strict";
    
    const _validationSelector = ".needs-validation"

    //On document ready
    $(document).ready(function () {
        
        //Loop over query selector and add an event listener which prevents submission if an input within the form is invalid
        if($(_validationSelector).length > 0){
            $(_validationSelector).each(function () {
                $(this).submit(function(e) {
                    if(!this.checkValidity()) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    
                    $(this).addClass("was-validated");
                });
            });
        }
    });
})();