sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",  // viewModel 생성용
    "sap/ui/model/Sorter",          // onBeforeRebindTable에서 사용
    "sap/m/MessageToast"            // 사용자 피드백용
], (Controller, JSONModel, Sorter, MessageToast) => {
    "use strict";

    return Controller.extend("code.d3.defect.analysis.controller.Main", {

        // 초기화: viewModel 세팅
        onInit() {
            // defectCount: IconTabBar count 바인딩 초기값
            // 빈 문자열이면 뱃지 미표시
            const oViewModel = new JSONModel({
                defectCount: "",
                fclLayout: "OneColumn" // FCL 초기 레이아웃 설정
            });
            this.getView().setModel(oViewModel, "viewModel");
        },

        // SmartTable 초기화 완료 후: 내부 테이블 이벤트 연결
        // initialise 이후에만 getTable()로 내부 테이블 접근 가능
        onSmartTableInit() {
            const oTable = this.byId("smartTable").getTable();
            oTable.attachItemPress(this.onRowPress.bind(this));
        },

        // FilterBar Go 버튼: SmartTable 리바인딩 트리거
        onSearch() {
            this.byId("smartTable").rebindTable();
        },

        // 조회 직전: 기본 정렬 주입
        onBeforeRebindTable(oEvent) {
            const oParams = oEvent.getParameter("bindingParams");
            // 검사 완료일 내림차순 기본 정렬
            oParams.sorter.push(new Sorter("InspectionEndDate", true));
        },

        // 데이터 수신 후: IconTabBar 건수 갱신
        onDataReceived() {
            const oBinding = this.byId("smartTable")
                                 .getTable()
                                 .getBinding("items");

            // isLengthFinal: 전체 건수 확정 전이면 갱신 보류
            if (!oBinding || !oBinding.isLengthFinal()) return;

            const iCount = oBinding.getLength();
            this.getView()
                .getModel("viewModel")
                .setProperty("/defectCount", iCount > 0 ? String(iCount) : "");
        },

        // 행 클릭: FCL MidColumn 오픈
        onRowPress(oEvent) {
            const oCtx = oEvent.getParameter("listItem").getBindingContext();

            const sInspectionNo = oCtx.getProperty("InspectionNo");
            const sOrderNo      = oCtx.getProperty("OrderNo");

            // 1. FCL 레이아웃 상태 업데이트 (우측 상세 패널 열기)
            this.getView().getModel("viewModel").setProperty("/fclLayout", "TwoColumnsBeginExpanded");

            // 2. FCL MidColumn 라우팅
            this.getOwnerComponent().getRouter().navTo("detailRoute", {
                inspectionNo: sInspectionNo,
                orderNo:      sOrderNo
            });
        }

    }); 
});