sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.approval.btrip.controller.Main", {
        onInit() {
            // View에 sel이라는 이름으로 JSON 모델을 등록한다.
            var oModel = new JSONModel();
            this.getView().setModel(oModel,"sel");

        },
        onSelectionChange(oEvent){
            //alert('123');
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext();
            var oData = oContext.getProperty();

            var oSelModel = this.getView().getModel("sel");
            oSelModel.setData(oData);
            oSelModel.setProperty("/TripID", oData.TripId);
            oSelModel.setProperty("/EmpID", oData.EmpId);
        },
        onApprove() {
            this._submitDecision("APR");
        },
        onReject() {
            this._submitDecision("REJ");
        },
        _submitDecision(sStatus){
            const oSelModel = this.getView().getModel("sel");
            const oData = oSelModel.getData();

            if( !(oData && oData.TripId) ){
                sap.m.MessageToast.show("선택된 출장 요청 정보가 없습니다.");
                return;
            }
            const oUpdateData = {
                TripID: oData.TripId,
                Status: sStatus
            }
            /**
             * /ApprovalSet('0004xx0001')
             */
            const sPath = `/ApprovalSet('${oData.TripId}')`;

            const oModel = this.getView().getModel();

            // 경로, 데이터, { 성공함수, 실패함수 }
            oModel.update(
                sPath,
                oUpdateData,
                {
                    success() {
                        sap.m.MessageToast.show(
                            sStatus === "APR" ?
                            "승인 처리 완료" :
                            "거절 처리 완료"
                        );
                        
                        // 상단 패널의 테이블 데이터 OData Model 강제 새로고침
                        oModel.refresh(true);
                        // 하단 패널에도 변경된 상태로 보이도록 바꿈
                        oSelModel.setProperty("/Stat", sStatus);
                    },
                    error(oError) {
                        // Best-effort message
                        let sMsg = "처리 중 오류가 발생했습니다.";
                        try {
                            const sBody = oError?.responseText || oError?.response?.body;
                            if (sBody) {
                                const oBody = JSON.parse(sBody);
                                sMsg = oBody?.error?.message?.value || sMsg;
                            }
                        } catch (e) {}
                        sap.m.MessageBox.error(sMsg);
                    }
                }

            );
        }
    });
});