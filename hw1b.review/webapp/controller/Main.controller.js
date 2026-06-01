sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.hw1b.review.controller.Main", {
        onInit() {
        },

        onOpenDialog(){
            // p = promise
            this.pDialog ??= this.loadFragment({
                name:"code.d19.hw1b.review.view.Dialog"
            });

            this.pDialog.then(function(oDialog){
                oDialog.open();
            });
        },
        // Dialog를 닫으려면 닫을 Dialog를 먼제 찾아야함
        onCloseDialog(){
            let oDialog = this.byId("idDialog");
            // Dialog가 있어? 있으면 닫아.
            if (oDialog){
                oDialog.close();
            }

        }
    });
});