sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.excode.controller.Main", {
        onInit() {
            // Dialog에서 선택한 데이터를 담을 JSON Model을 선언한다.
            var oData = {
                Carriers:[]
            };
            var oModel = new JSONModel(oData);

            // 선언한 모델을 "view"라는 이름으로 View에 세팅한다.
            var oView = this.getView();
            oView.setModel(oModel,"view");

        },
        onAddButton(){
            // alert("dddd");
            this.pDialog ??=this.loadFragment({
                name: "code.d19.excode.view.Dialog"
            });

            this.pDialog.then((oDialog) => oDialog.open());

        },
        onOkButton(){
            var oView = this.getView();
            var oModel = oView.getModel("view");
            
            var oTable = oView.byId("idTable");
            var oSelectedItem = oTable.getSelectedItem();
            var oContext = oSelectedItem.getBindingContext();
            var oNewdata = oContext.getObject();
            console.log(oNewdata);
            var aData = oModel.getProperty("/Carriers");
            aData.push(oNewdata);
            
            oModel.setProperty("/Carriers", aData);


            let oDialog = this.byId("idDialog");
            if(oDialog){
                oDialog.close();
            }

        
        },
        onCloseButton(){
            let oDialog = this.byId("idDialog");
            if(oDialog){
                oDialog.close();
            }
        },
        onDeleteButton(){
            var oView = this.getView();
            var oModel = oView.getModel("view");
            var aData  = oModel.getProperty("/Carriers");

            var oTable = oView.byId("idGridtable");
            var aIndex = oTable.getSelectedIndices();

            console.log(aIndex, aData);
           
            // 오름차순으로 정렬해서 delete 하는 방법
            // getSelectedIndices는 기본적으로 인덱스를 오름차순으로 정렬해서 가져온다.
            // 그래서 따로 오름차순으로 정렬할 필요가 없다.
            
            // var deleteCount = 0;

            // for ( var index of aIndex ){
                    
            //     aData.splice( index - deleteCount, 1 );
            //     deleteCount ++;

            // };

            //내림차순으로 정렬해서 delete 하는 방법
            var aDescIndex = aIndex.sort((a,b) => b - a);
            for ( var index of aDescIndex ){
                aData.splice( index, 1 );
            }

            oModel.setProperty("/Carriers", aData);
            oTable.removeSelections(true);

        },
        onDetailButton(oEvent){
            

            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext("view");
            var sCarrid = oBindingContext.getProperty("Carrid")

            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();

            oRouter.navTo("RouteDetail", {Carrid: sCarrid});

        }
    });
});