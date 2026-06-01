sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exercise26.controller.View1", {
        onInit() {
        },
        onNavView2(){
            // 라우팅 기능을 사용하기 위해(페이지 이동을 하기 위해)
            // 라우터를 가져와야 한다.
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteView2");
        }
    });
});