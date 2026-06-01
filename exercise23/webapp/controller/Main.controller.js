sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exercise23.controller.Main", {
        onInit() {
        },
        onItemPress(oEvent){
            // 내가 선택한 고객 정보를 가져온다. 이걸 안함
            var oItem = oEvent.getParameter("listItem");
            var oBindingContext

            // Fragment 파일을 불러온다.
            this.pDialog ??= this.loadFragment({
                name:"code.d19.exercise23.view.Detail"
            });
            var that = this;
            this.pDialog.then(function(oDialog))

            this.pDialog.then(function(oDialog){
                oDialog.open();
            });
        },
        onCloseDialog(oEvent){
            var oDialog=
            this.byId("idDialog").close();
        }

    });
});