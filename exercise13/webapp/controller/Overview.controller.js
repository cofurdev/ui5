sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("code.d19.exercise13.controller.Overview", {
        onInit() {
            // JSON Model 생성 ()안이 비었기 대문에 데이터가 없는 비어있는 모델로 만들어진다.
            var oModel = new JSONModel(
                {
                    Name: "초기값을",
                    Age: "기록해두면",
                    Zipcode: "입력필드는 해당 경로의 값도",
                    Address: "가져올 수 있다"
                }

            );

            // 컨트롤러와 연결된 View 객체를 가져온다
            var oView = this.getView();
            
            // 가져온 View 객체에 방금 만든 비어있는 Model을 "customer"라는 이름으로 설정한다.(연결한다.)
            oView.setModel( oModel, "customer" );
        },
        onOpenDialog(){
            this.pDialog ??= this.loadFragment({
                name:"code.d19.exercise13.view.Dialog"
            });

            this.pDialog.then(function(oDialog){
                oDialog.open();
            });
        },
        onCloseDialog(){
            this.byId("idDialog").close();
        }
    });
});