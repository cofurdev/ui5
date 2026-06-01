sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.exam1.controller.Main", {
        onInit() {
            let oData = {
                Input: {
                    number1: 0,
                    number2: 0,
                    number3: 0
                },
                Output1: [
                    {
                    number1: 0,
                    number2: 0,
                    number3: 0
                    }
                ],
                Output2: [
                    {
                    number1: 0,
                    number2: 0,
                    number3: 0
                    }
                ],
                Output3: [
                    {
                    number1: 0,
                    number2: 0,
                    number3: 0
                    }
                ],
                Output4: [
                    {
                    number1: 0,
                    number2: 0,
                    number3: 0
                    }
                ]                    
                
            }
            let oModel = new JSONModel( oData );
            let oView = this.getView();
            oView.setModel( oModel );
         },
        // 덧셈 실행
         onPressPlus(){

            let oView = this.getView();
            let oModel = oView.getModel();
            let oInput = oModel.getProperty("/Input");

            let aOutput = oModel.getProperty("/Output1")

            oInput.number3 = oInput.number1 + oInput.number2;
            console.log(oInput.number3);
            aOutput.push(oInput);




        },
        // 뺄셈 실행
        onPressMinus(){
            let oView = this.getView();
            let oModel = oView.getModel();
            let oInput = oModel.getProperty("/Input");

            let aOutput = oModel.getProperty("/Output2")

            oInput.number3 = oInput.number1 - oInput.number2;
            console.log(oInput.number3);
            aOutput.push(oInput);
        },
        // 곱셈 실행        
        onPressMultiple(){
            let oView = this.getView();
            let oModel = oView.getModel();
            let oInput = oModel.getProperty("/Input");

            let aOutput = oModel.getProperty("/Output2")

            oInput.number3 = oInput.number1 * oInput.number2;
            console.log(oInput.number3);
            aOutput.push(oInput);

        },
        // 나눗셈 실행
        onPressDivison(){
            let oView = this.getView();
            let oModel = oView.getModel();
            let oInput = oModel.getProperty("/Input");

            let aOutput = oModel.getProperty("/Output2")

            oInput.number3 = oInput.number1 / oInput.number2;
            console.log(oInput.number3);
            aOutput.push(oInput);
        } 
    });
});