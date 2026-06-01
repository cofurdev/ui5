sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d00.hw1b.review.controller.Main", {
        onInit() {
        },

        onOpenDialog() {
            // p = promise
            this.pDialog ??= this.loadFragment({
                name: "code.d00.hw1b.review.view.Dialog"
            });

            this.pDialog.then(function( oDialog ){
                oDialog.open();
            });
        },

        onCloseDialog() {
            let oDialog = this.byId("idDialog");
            if (oDialog){
                oDialog.close();
            }
        }
    });
});