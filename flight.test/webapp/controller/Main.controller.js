sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.flight.test.controller.Main", {
        onInit() {
        },
        onSelectionChange: function(oEvent) {
            var oListItem  = oEvent.getParameter("listItem");
            var oContext   = oListItem.getBindingContext();
            var sCarrierId = oContext.getProperty("CarrierId");

            // Detail View로 화면 이동하기 위한 로직
            // 현재는 전달하는 값이 단 하나도 없다.
            // 나중에 클릭한 라인의 항공사ID를 전달할 예정
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetail", {
                CarrierId: sCarrierId // "AA"
            });
        }
    });
});