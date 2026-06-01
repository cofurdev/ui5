sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.exam1.review.controller.Main", {
        onInit() {

            var oModel = new JSONModel({
                Input: {
                    num1: 0,
                    num2: 1 // 최소값이 1 이상이므로 기본값도 1
                },
                Output: {
                    Addition: 0,
                    Division: 0
                }

            });
            var oView = this.getView();
            oView.setModel(oModel);
        },
        onAddition(){
            // Input을 가져올 때 ID르 ㄹ통해서 getValue()로 가져오면,
            // 내가 걸어둔 조건들이 전부 무의미해질 수 있다.

            // var oInput2 = this.byId("idNumber2");
            // var sValue2 = oInput2.getValue();
            // alert(sValue2+10);

            var oView = this.getView();
            var oModel = oView.getModel();
            var number1 = oModel.getProperty("/Input/num1");
            var number2 = oModel.getProperty("/Input/num2");

            var result = number1 + number2;
            oModel.getProperty("/Output/Addition", result);

        },
        onDivision(){

            var oView = this.getView();
            var oModel = oView.getModel();
            var number1 = oModel.getProperty("/Input/num1");
            var number2 = oModel.getProperty("/Input/num2");

            // 0으로는 나눌 수 없기 때문에 number2가 0일 경우 오류메세지를 출력
            if(number2 !== 0){
                var result = number1 / number2;
            } else {
                sap.m.MessageBox.error("0으로 나눌 수 없습니다.");
            }

            oModel.getProperty("/Output/Division", result);
        }
    });
});