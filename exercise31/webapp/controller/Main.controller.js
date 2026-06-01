sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.d19.exercise31.controller.Main", {
        onInit() {

            // oData는 "Members"라는 이름으로 배열 데이터(3줄)을 가지고 있다.
            var oData = {
                Members: [
                    {
                        name: "홍길동",
                        gender: "남",
                        genderCode: "M"
                    },
                    {
                        name: "아이유",
                        gender: "여",
                        genderCode: "F"
                    },                    
                    {
                        name: "신사임당",
                        gender: "여",
                        genderCode: "F"
                    }                
                ]

            };

            // JSON Model을 생성할 때 oData가 가진 데이터를 Model에 기록하도록 한다.
            var oModel = new JSONModel(oData); // 경로 /Members로 배열 3줄이 기록된다.

            // 이 Controller와 연결된 View에 Model을 "view"라는 이름으로 기록한다.
            var oView = this.getView();
            oView.setModel(oModel, "view")
        },
        onComboBoxSelectionChange(oEvent){
            // debugger;

            // 변수를 선언하기 위해서는 var, let을 사용한다.
            // 상수를 선언한기 위해서는 const를 사용한다.
            var oItem = oEvent.getParameter('selectedItem');
            // let oItem = oEvent.getParameter('selectedItem');

            // Item에 있는 key를 가져와서 MessageToast에 출력한다.
            // sap.m.MessageToast.show(oItem.getKey());
            
            // Item에 있는 text를 가져와서 MessageToast에 출력한다.
            // sap.m.MessageToast.show(oItem.getText()+"을 선택했습니다.");

            // Filter를 보관할 배열 선언
            var aFilter = [];

            // 사용자가 콤보박스에서 선택한 항목의 Key를 가져온다.
            var sKey = oItem.getKey();
            if (sKey !== undefined && sKey !== 'A'){
                /* 해당 키값이 존재하면, 그 키에 해당되는 데이터만 출력하도록
                 Filter를 생성해서 배열에 보관한다. */
                var oFilter = new Filter("genderCode", FilterOperator.EQ, sKey);

                aFilter.push(oFilter); // aFilter 배열에 추가한다.

            }

            var oList = this.byId("idList");
            var oBinding = oList.getBinding("items");

            oBinding.filter(aFilter);

        }
    });
});