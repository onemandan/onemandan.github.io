/* jshint esversion: 6 */
/* global $, document, console, window, URL, localStorage, Dotdotdot */

(function() {
    "use strict";
    
    const lcsExpand = "ipexpand";
    const btnCollapse = "#info-panel-expand-collapse";
    
    //ExpandCollapseInfoPanel
    //Expands or collapses the info panel depending on a LocalStorage value.  Optionally animates the transition, ideal
    //functionality is to animate on button press and not to animate on page load.
    //@animate - OPTIONAL Bool - whether or not to animate the expand/collapse action
    function ExpandCollapseInfoPanel(animate = false) {
        
        //ExpandCollapse
        //Sets the css attribute 'margin-top' of the info panel (header) and 'rotate' of button by specified amounts
        //@margin - String - 'margin-top' value
        function ExpandCollapse(margin, rotation) {
            if(animate){
                $("header").animate({ marginTop: margin }, 500);
                $(btnCollapse).animate({ rotate: rotation }, 500);
            } else {
                $("header").css("margin-top", margin);
                $(btnCollapse).css("rotate", rotation);
            }
        }
        
        //Expand/collapse the info panel
        if(JSON.parse(localStorage.getItem(lcsExpand))) {
           ExpandCollapse("0px", "-180deg");
        } else {
            ExpandCollapse("-315px", "0deg");  
        }
    }
    
    //On document ready
    $(document).ready(function () {
        
        //Set info panel on document ready
        ExpandCollapseInfoPanel();
        
        //Info panel collapse button event listener
        $(btnCollapse).click(function (e) {
            
            //LocalStorage only stores strings, and as such, need to stringify data types.
            if(localStorage.getItem(lcsExpand) === null) {
                localStorage.setItem(lcsExpand, JSON.stringify(true)); 
            } else {
                //Toggle expand/collapse on click
                localStorage.setItem(lcsExpand, JSON.stringify(!JSON.parse(localStorage.getItem(lcsExpand)))); 
            }
            
            ExpandCollapseInfoPanel(true);
        });
    });
})();