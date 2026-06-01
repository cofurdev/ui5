sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.study1.controller.Main", {
        onInit() {
        },
        onReadButton(){
            // alert("dddd");
            this.pDialog ??=this.loadFragment({
                name: "code.d19.study1.view.Dialog"
            });

            this.pDialog.then((oDialog) => oDialog.open());

        }
    });
});