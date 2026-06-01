sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exam3.controller.Main", {
        onInit() {
        },
        onItemPress(oEvent){
            //debugger;
            let oItem = oEvent.getParameter("listItem");

            // 내가 선택한 ListItem 잘 나오는지 확인용
            console.log("내가 선택한 ListItem :" + oItem);


            let oBindingContext = oItem.getBindingContext();
            let oView = this.getView();
            oView.setBindingContext(oBindingContext);

            this.pDialog ??= this.loadFragment({
                name: "code.d19.exam3.view.Detail"
            });

            this.pDialog.then(function( oDialog ){
                oDialog.open();
            });
        },
        onCloseDialog(){
            let oDialog = this.byId("idDialog");
            if (oDialog){
                oDialog.close();
            }
        }
    });
});