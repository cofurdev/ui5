sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("code.d19.exam3.review.controller.Main", {
        onInit() {
        },
        onOpenDialog(oEvent){
            // 왜 getSource()가 Item이 되는가?
            // getSource()의 역할은 무엇이고, 결과가 무엇인지
            // 답: 내가 클릭한 아이템의 정보를 가져옴
            var oItem = oEvent.getSource();
            console.log(oItem);
            var oContext = oItem.getBindingContext();

            // Context를 잘 가져왔는지 테스트
            // MessageBox.alert("내가 선택한 직원의 id:" + oContext.getProperty("EmployeeID"));

            this.pDialog ??= this.loadFragment({
                name: "code.d19.exam3.review.view.Detail"
            });

            this.pDialog.then(function(oDialog){
                oDialog.setBindingContext(oContext);
                oDialog.open();
            });

        },
        onCloseDialog(){
            var oDialog = this.byId("idDialog");
            if(oDialog){
                oDialog.close();
            }
        }
    });
});