sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.flight.test.controller.Detail", {
        onInit() {
            var oRouter = this.getOwnerComponent().getRouter();
            var oRoute  = oRouter.getRoute("RouteDetail");

            oRoute.attachPatternMatched( this._onPatternMatched, this );
        },
        _onPatternMatched: function(oEvent){
            var oArgs = oEvent.getParameter("arguments");
            var sCarrierId = oArgs.CarrierId
            var sPath = "/CarrierSet('"+ sCarrierId +"')";
            this.getView().bindElement(sPath);
        },
        onNavPress: function(oEvent) {
            // 이전화면으로 이동
            window.history.go(-1);
        }
    });
});