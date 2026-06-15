sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",  // viewModel 및 kpi 모델 생성용
    "sap/ui/model/Sorter",          // onBeforeRebindTable에서 사용
    "sap/m/MessageToast"            // 사용자 피드백용
], (Controller, JSONModel, Sorter, MessageToast) => {
    "use strict";

    return Controller.extend("code.d3.defect.analysis.controller.Main", {

        // 초기화: viewModel 및 kpi 모델 세팅
        onInit() {
            const oViewModel = new JSONModel({
                defectCount: "",
                fclLayout: "OneColumn" 
            });
            this.getView().setModel(oViewModel, "viewModel");

            // 추가: 화면 렌더링 시 오류가 나지 않도록 빈 KPI 모델을 미리 깔아둡니다.
            const oKpiModel = new JSONModel({
                TotalDefectRate: 0, TotalLossAmount: 0, ReplenishQty: 0, MaxDefectRate: 0, MaxDefectProcessName: "대기중"
            });
            this.getView().setModel(oKpiModel, "kpi");
        },

        onSmartTableInit() {
            const oTable = this.byId("smartTable").getTable();
            oTable.attachItemPress(this.onRowPress.bind(this));
        },

        // FilterBar Go 버튼 누를 때 실행 (기존 로직 + KPI 로직 병합)
        onSearch() {
            // 1. 기존 로직: 하단 SmartTable 리바인딩 (DefectDetail 갱신)
            this.byId("smartTable").rebindTable();

            // 2. 추가 로직: 상단 KPI 타일 데이터 동적 갱신 (별도 함수 호출)
            this._updateKpiTiles();
        },

        // OData를 호출하여 KPI 데이터를 가져오는 핵심 내부 함수
        _updateKpiTiles() {
            const oView = this.getView();
             
            // OData 통신을 담당하는 모델 객체(oDataModel)를 직접 생성하거나 가져와야 합니다.
            // manifest에 등록된 kpiService 정보를 기반으로 모델을 생성합니다.
            const oKpiModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZUI_D3_PP_KPI_V2/", {
                json: true,
                defaultCountMode: "Inline"
            });
            
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            // 이제 oKpiModel은 ODataModel이므로 .read() 함수를 정상적으로 실행
            oKpiModel.read("/KpiSummary", {
                filters: aFilters,
                success: (oData) => {
                    console.log("KPI 결과", oData);
                    if (oData.results && oData.results.length > 0) {
                        // 결과 데이터를 기존에 만들어둔 "kpi" JSONModel에 넣어줌
                        oView.getModel("kpi").setData(oData.results[0]);
                        console.log("KPI 타일 업데이트 트리거됨. 현재 TotalLossAmount:", this.getView().getModel("kpi").getProperty("/TotalLossAmount"));
                    } else {
                        oView.getModel("kpi").setData({
                            TotalDefectRate: 0, TotalLossAmount: 0, ReplenishQty: 0, MaxDefectRate: 0, MaxDefectProcessName: "데이터 없음"
                        });
                    }
                },
                error: (oError) => {
                    console.error("KPI 조회 실패:", oError);
                    MessageToast.show("데이터를 불러올 수 없습니다.");
                }
            });
        },

        // 조회 직전: 기본 정렬 주입 (기존과 동일)
        onBeforeRebindTable(oEvent) {
            const oParams = oEvent.getParameter("bindingParams");
            oParams.sorter.push(new Sorter("InspectionEndDate", true));
        },

        // 데이터 수신 후: IconTabBar 건수 갱신 (기존과 동일)
        onDataReceived() {
            const oBinding = this.byId("smartTable").getTable().getBinding("items");
            if (!oBinding || !oBinding.isLengthFinal()) return;

            const iCount = oBinding.getLength();
            this.getView().getModel("viewModel").setProperty("/defectCount", iCount > 0 ? String(iCount) : "");
        },

        // 행 클릭: FCL MidColumn 오픈 (기존과 동일)
        onRowPress(oEvent) {
            const oCtx = oEvent.getParameter("listItem").getBindingContext();
            const sInspectionNo = oCtx.getProperty("InspectionNo");
            const sOrderNo      = oCtx.getProperty("OrderNo");

            this.getView().getModel("viewModel").setProperty("/fclLayout", "TwoColumnsBeginExpanded");

            this.getOwnerComponent().getRouter().navTo("detailRoute", {
                inspectionNo: sInspectionNo,
                orderNo:      sOrderNo
            });
        }
    }); 
});