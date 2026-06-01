sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"    
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.d19.exam2.controller.Main", {
        onInit() {
        },
        onComboBoxSelectionChange(oEvent){
            // debugger;
            let oItem = oEvent.getParameter('selectedItem');

            // Filter를 보관할 배열 선언
            var aFilter = [];

            // 사용자가 콤보박스에서 선택한 항목의 Key를 가져온다.
            var sKey = oItem.getKey();
            if (sKey !== undefined && sKey !== 'A'){
                /* 해당 키값이 존재하면, 그 키에 해당되는 데이터만 출력하도록
                 Filter를 생성해서 배열에 보관한다. */
            
                var oFilter = new Filter("StorageCode", FilterOperator.EQ, sKey);

                aFilter.push(oFilter); // aFilter 배열에 추가한다.

            }

            var oList = this.byId("idList");
            var oBinding = oList.getBinding("items");

            oBinding.filter(aFilter);

        }
    });
});