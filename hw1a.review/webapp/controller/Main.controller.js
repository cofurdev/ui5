sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.hw1a.review.controller.Main", {
        onInit() {
            //  JSON Model을 생성하고, View의 기본 모델을 설정
            // 기본모델 = 별도의 이름을 가지지 않았다.
            let oModel = new JSONModel();
            let oView = this.getView();
            oView.setModel(oModel);
        },

        onClickButton(){
            // byId를 너무 자주 쓰니깐, View가 아니라,
            // this에서 바로 사용할 수 있도록 기능이 추가되었다.
            // let oInput = this.byId("idInput");
            let oView = this.getView();
            let oInput = oView.byId("idInput");

            let sValue = oInput.getValue();

            MessageToast.show(sValue);
        },

        onClickJsonButton(){
            // alert로 컨트롤러 꼭 체크하기
            // alert('a');

            // 현재 화면의 기본모델을 가져온다.
            let oView = this.getView();
            let oModel = oView.getModel("idInput");

            // 모델의 getProperty 함수는 전달받은 경로에 대한 값ㅇ르 가져온다.
            let sValue = oModel.getProperty("/Value");
            MessageToast.show(sValue);
        }
        
    });
});