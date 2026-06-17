sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/base/Log"
], (Controller, JSONModel, Sorter, MessageToast, Log) => {
    "use strict";

    return Controller.extend("code.d3.defect.analysis.controller.Main", {
        onInit() {
            const oViewModel = new JSONModel({
                defectCount: ""
            });
            this.getView().setModel(oViewModel, "viewModel");
            this.getView().setModel(new JSONModel({
                materialTop3: []
            }), "dashboard");

            const oKpiModel = new JSONModel({
                TotalDefectRate: 0,
                TotalLossAmount: 0,
                ReplenishQty: 0,
                MaxDefectRate: 0,
                MaxDefectMaterialName: "",
                MaxDefectProcessName: "",
                Currency: ""
            });
            this.getView().setModel(oKpiModel, "kpi");
        },

        onSearch() {
            this.byId("smartTable").rebindTable();
            this._updateKpiTiles();
            this._updateMaterialTop3Chart();
        },

        onSmartFilterBarInitialise() {
            const oFilterBar = this.byId("smartFilterBar");

            oFilterBar.setFilterData({
                Plant: "P00001"
            }, true);

            setTimeout(() => {
                const oSmartTable = this.byId("smartTable");

                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }

                this._updateKpiTiles();
                this._updateMaterialTop3Chart();
            }, 0);
        },

        _updateMaterialTop3Chart() {
            const oChartModel = this.getOwnerComponent().getModel("chart");
            const oDashboardModel = this.getView().getModel("dashboard");
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            oChartModel.read("/DefectDashboard", {
                filters: aFilters,
                success: (oData) => {
                    const mMaterialMap = (oData.results || []).reduce((mMap, oRow) => {
                        const sMaterialNo = oRow.MaterialNo || "";
                        const sMaterialName = oRow.MaterialName || "";
                        const sKey = sMaterialNo || sMaterialName;

                        if (!sKey) {
                            return mMap;
                        }

                        if (!mMap[sKey]) {
                            mMap[sKey] = {
                                MaterialNo: sMaterialNo,
                                MaterialName: sMaterialName,
                                MaterialLabel: sMaterialName ? `${sMaterialNo} ${sMaterialName}`.trim() : sMaterialNo,
                                DefectQty: 0
                            };
                        }

                        mMap[sKey].DefectQty += Number(oRow.DefectQty || 0);
                        return mMap;
                    }, {});

                    oDashboardModel.setProperty("/materialTop3", Object.values(mMaterialMap)
                        .sort((oA, oB) => oB.DefectQty - oA.DefectQty)
                        .slice(0, 3));
                },
                error: (oError) => {
                    Log.error("Material TOP 3 chart read failed", oError);
                    oDashboardModel.setProperty("/materialTop3", []);
                    MessageToast.show(this._getText("dataLoadFailed"));
                }
            });
        },

        _updateKpiTiles() {
            const oView = this.getView();
            const oKpiModel = this.getOwnerComponent().getModel("kpi");
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            oKpiModel.read("/KpiSummary", {
                filters: aFilters,
                success: (oData) => {
                    if (oData.results && oData.results.length > 0) {
                        oView.getModel("kpi").setData(oData.results[0]);
                    } else {
                        this._resetKpiTiles();
                    }
                },
                error: (oError) => {
                    // Keep technical details in the console, but show a localized user message.
                    Log.error("KPI read failed", oError);
                    this._resetKpiTiles();
                    MessageToast.show(this._getText("dataLoadFailed"));
                }
            });
        },

        _resetKpiTiles() {
            this.getView().getModel("kpi").setData({
                TotalDefectRate: 0,
                TotalLossAmount: 0,
                ReplenishQty: 0,
                MaxDefectRate: 0,
                MaxDefectMaterialName: "",
                MaxDefectProcessName: "",
                Currency: ""
            });
        },

        onBeforeRebindTable(oEvent) {
            const oParams = oEvent.getParameter("bindingParams");
            oParams.sorter.push(new Sorter("InspectionEndDate", true));
        },

        onDataReceived() {
            const oBinding = this.byId("smartTable").getTable().getBinding("items");
            if (!oBinding || !oBinding.isLengthFinal()) {
                return;
            }

            const iCount = oBinding.getLength();
            this.getView().getModel("viewModel").setProperty("/defectCount", iCount > 0 ? String(iCount) : "");
        },

        onRowPress(oEvent) {
            const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            const oCtx = oItem && oItem.getBindingContext();
            if (!oCtx) {
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteInspectionDetail", {
                inspectionNo: encodeURIComponent(oCtx.getProperty("InspectionNo"))
            });
        },

        _getText(sKey, aArgs) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey, aArgs);
        }
    });
});
