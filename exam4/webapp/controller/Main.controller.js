sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exam4.controller.Main", {
        onInit() {
        },
        onRowSelectionChange(oEvent){
            // 선택한 행에 대한 모델 정보를 가져온다.
            let oRowContext = oEvent.getParameter("rowContext");

            // View에 선택한 행의 모델 정보를 현재 기준으로 설정한다.
            let oView = this.getView();
            oView.setBindingContext(oRowContext)
        }
    });
});