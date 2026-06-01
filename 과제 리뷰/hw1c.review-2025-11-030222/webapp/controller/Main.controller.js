sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d00.hw1c.review.controller.Main", {
        onInit() {
        },

        // selectionChange 이벤트는 선택할 때마다 선택한 행에 대한 정보를 포함해서
        // 객체로 전달을 하는데, 이 정보를 onSelectionChange에서는 
        // oEvent 라는 변수를 생성해서 전달받아 사용하도록 한다.
        onSelectionChange( oEvent ) {
            // 작동여부 테스트
            // alert("a");
            // console.log(oEvent);
            // 사용자가 선택한 행의 정보를 oEvent 에서 가져온다.
            let oItem = oEvent.getParameter("listItem");

            // 선택한 행에 연결된 "member" 모델 정보( 데이터, 경로 등 )를 가져온다.
            let oBindingContext = oItem.getBindingContext("member");

            console.log( oBindingContext.getProperty("Name") );
            console.log( oBindingContext.getProperty("Gender") );
            console.log( oBindingContext.getProperty("Address") );

            let oDetailTable = this.byId("idMemberDetailTable");
            oDetailTable.setBindingContext( oBindingContext, "member" );
        }
    });
});