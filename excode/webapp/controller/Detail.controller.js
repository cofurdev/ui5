sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.d19.excode.controller.Detail", {
        onInit() {
            const oView = this.getView();

            const oJSONModel = new JSONModel({
                Spfli: []
            });
            oView.setModel(oJSONModel, "view");

                                                                                // 라우터 가져오기
            const oRouter = this.getOwnerComponent().getRouter();
            const oRoute = oRouter.getRoute("RouteDetail");
                                                                                   // 라우터 패턴 매칭 시 호출
            oRoute.attachPatternMatched(this._onPatternMatched, this);
        },
        _onPatternMatched(oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            let sCarrID = oArgs.Carrid;                                           // 선택된 항공사 Carrid 저장
            console.log("선택된 항공사:", sCarrID);

            const oView = this.getView();
            const oODataModel = oView.getModel();
            const oViewModel = oView.getModel("view");

            oView.setBusy(true);

                                                                                // OData에서 Spfli 조회
            oODataModel.read("/Spfli", {
                urlParameters: {
                    "$expand": "to_flights",
                    "$filter": `Carrid eq '${sCarrID}'`
                },
                success: (oData) => {
                    oView.setBusy(false);
                    console.log("조회 성공:", oData.results);

                                                                                // 전체 데이터와 현재 테이블 데이터에 세팅
                    oViewModel.setProperty("/Spfli", oData.results);
                },
                error: (oError) => {
                    oView.setBusy(false);
                    console.error("조회 실패:", oError);
                    MessageToast.show("데이터 조회 실패");
                }
            });
        },
        onSearch(){
            // Connection ID에 작성한 값
            var oInputConnID = this.byId("inputConnectionId");
            var sConnID = oInputConnID.getValue();
            
            // Country From에 작성한 값
            var oInputCountryfr = this.byId("inputCountryFrom");
            var sCountryfr = oInputCountryfr.getValue();
            
            // City To에 작성한 값            
            var oInputCityto = this.byId("inputCityTo");
            var sCityto = oInputCityto.getValue();
            
            // 필터를 적용한 데이터를 담을 배열 선언
            var aFilter = [];

             // Connection ID에 작성한 값을 포함하는 데이터를 출력하는 필터
             if (sConnID && sConnID.length > 0){
                 var oFilter = new Filter("Connid", FilterOperator.Contains, sConnID);
                 aFilter.push(oFilter);
             }
            
             // Country From에 작성한 값과 동일한 데이터를 출력하는 필터
             if (sCountryfr && sCountryfr.length > 0){
                 var oFilter = new Filter("Countryfr", FilterOperator.EQ, sCountryfr);
                 aFilter.push(oFilter);
             }
            
            // City To에 작성한 값만 출력하는 필터
            if (sCityto && sCityto.length > 0){
                var oFilter = new Filter("Cityto", FilterOperator.EQ, sCityto);
                aFilter.push(oFilter);
            }

            console.log(aFilter);

            var oTable = this.byId("routeTable")
            var oBinding = oTable.getBinding("items");

            oBinding.filter(aFilter);
            
            // go 버튼을 누르면 테이블에 선택된 것들 사라진다.
            oTable.removeSelections(true);

        },
        onSelectionChange(oEvent) {
            let oItem = oEvent.getParameter("listItem");
            let oContext = oItem.getBindingContext("view");
            let oData = oContext.getProperty();

            // to_flights 데이터 존재 여부 확인
            if (!oData.to_flights || !oData.to_flights.results) {
                MessageToast.show("해당 노선의 항공편 정보가 없습니다.");
                return;
            }

            // JSONModel에 차트용 데이터 저장
            let oChartModel = new JSONModel({
                Flights: oData.to_flights.results
            });
            this.getView().setModel(oChartModel, "chart");

            // 차트 보이기
            this.byId("flightChart").setVisible(true);
        }
    });
});