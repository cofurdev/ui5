sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], (Controller,JSONModel, myFormatter) => {
    "use strict";

    return Controller.extend("code.d19.exercise30.controller.Main", {
        
        formatter: myFormatter,

        onInit() {
            
            let oModel = new JSONModel();
            oModel.setProperty("/Currency", "EUR");
            oModel.setProperty("/Unit", "EA");

            let oView = this.getView();
            oView.setModel(oModel,"view");
        },
        onRowSelectionChange(oEvent){

            // Element Binding
            // 1. Model의 Context 정보를 사용할 수 있을 때 선택할 수 있는 방법
            // -> 기존에 가져온 정보만 활용 가능, 경로를 알고 있더라도 정보를 추가로 가져올 수 없다.
            // 선택한 행에 대한 모델 정보를 가져온다.
            // let oRowContext = oEvent.getParameter("rowContext");

            // // View에 선택한 행의 모델 정보를 현재 기준으로 설정한다.
            // let oView = this.getView();
            // oView.setBindingContext(oRowContext);

            // 2. Model의 경로를 알고 있을 때 선택할 수 있는 방법
            // 주문을 선택할 때 경로 : /Orders(주문ID)
            let oRowContext = oEvent.getParameter("rowContext");

            // 선택한 행의 주문ID를 가져온다.
            let sOrderID = oRowContext.getProperty("OrderID");
            // let sPath = "/Orders("+ sOrderID +")";
            let sPath = `/Orders(${sOrderID})`;

            let oView = this.getView();
            // oView.bindElement( sPath );
            oView.bindElement( {
                path: sPath,
                // 현재 경로에서 직원에 대한 정보를 추가로 더 가져오도록 한다. 
                parameters: {
                    expand: 'Employee'
                }
            })
        }
    });
});