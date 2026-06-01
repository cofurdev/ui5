sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exercise29.controller.Order", {
        onInit() {
        },
        onItemPress(oEvent){
            // console.log(oEvent);
            // oEvent의 Source는 ListItem이 된다.
            // 이벤트를 ListItem에 적었기 때문에
            let oItem = oEvent.getSource(); // ListItem
            let oBindingCtx = oItem.getBindingContext();

            // OrderID를 고른 이유: 하나의 주문 내역에 접근하기 위한 경로가 Orders(OrderID-키값) 이기 때문에
            let sOrderID = oBindingCtx.getProperty("OrderID");
            
            let oRouter = this.getOwnerComponent().getRouter()
            oRouter.navTo("RouteDetail", {OrderID: sOrderID});
            
        }
    });
});