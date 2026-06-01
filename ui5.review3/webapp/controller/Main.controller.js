sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], (Controller,MessageBox) => {
    "use strict";

    return Controller.extend("code.t3.ui5.review3.controller.Main", {
        onInit() {
        },
        onTopTableItemPress(oEvent){
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext();
            const id = oContext.getProperty("Id");
            const name = oContext.getProperty("Name");
            MessageBox.information("집에 못가는 사람: " + id + " - " + name + " [ㅇㅁㅇ]! ");
        },
        onTopTableSelectionChange(oEvent){
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext();
            const id = oContext.getProperty("Id");
            const name = oContext.getProperty("Name");
            MessageBox.information("동글동글 클릭: " + id + " - " + name + " [>ㅁ<] ");
        }
    });
});