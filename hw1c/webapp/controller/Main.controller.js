sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, myFormatter, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.d19.hw1c.controller.Main", {
        onInit() {
        },

        formatter: myFormatter,
        // MemberChage 이벤트는 선택할 때마다 선택한 행에 대한 정보를 포함해서
        // 객체로 전달을 하는데, 이 정보를 onMemberChange에서는
        // oEvent라는 변수를 생성해서 전달받아 사용하도록 한다.
        onMemberChange(oEvent){
            var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
            this.byId("purchasesTable").setBindingContext(oBindingContext);
        },

        onFilterMember(oEvent){
            var aFilter = [];
            var sQuery = oEvent.getParameter("query");
            if( sQuery && sQuery.length > 0 ){
                aFilter.push(new Filter("Name", FilterOperator.Contains, sQuery));
            }

            var oTable = this.byId("memberTable");
            var oBinding = oTable.getBinding("items");

            oBinding.filter(aFilter);
        }
    });
});