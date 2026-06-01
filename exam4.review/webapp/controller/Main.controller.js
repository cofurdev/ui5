sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exam4.review.controller.Main", {
        onInit() {
        },
        onTableSelectionChange(oEvent){
            // 내가 선택한 행의 모델 정보
            var oRowContext = oEvent.getParameter("rowContext");
            var sOrderID = oRowContext.getProperty("OrderID");

            // 라우터(Router)를 가져오기 위해 먼저 Component를 가져온다.
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();

            // 첫번째 인자(Parameter)값: Route의 이름
            // 두번째 인자(Parameter)값: pattern에 전달된 값
            // Detail.view.xml을 불러오기 위해서 만든 Route의 이름은 "RouteDetail"
            // pattern은 "detail/{OrderID}"로 정의를 했기 때문에 OrderID를 위한 필수 Parameter를 전달
            oRouter.navTo("RouteDetail",  { OrderID: sOrderID });
        }
    });
});