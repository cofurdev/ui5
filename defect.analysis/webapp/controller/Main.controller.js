sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/base/Log"
], (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageToast, Log) => {
    "use strict";

    return Controller.extend("code.d3.defect.analysis.controller.Main", {
        onInit() {
            const oViewModel = new JSONModel({
                defectCount: ""
            });
            this.getView().setModel(oViewModel, "viewModel");
            this.getView().setModel(new JSONModel({
                chartRows: [],
                monthlyLossRows: [],
                monthlyPlantQtyRows: [],
                materialRanking: [],
                orderDelay: {
                    averageDelayDays: 0,
                    delayRate: 0,
                    delayColor: "Good",
                    delayedOrderCount: 0,
                    totalOrderCount: 0
                },
                orderDelayItems: []
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
            this._updateDashboardData();
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
                this._updateDashboardData();
            }, 0);
        },

        _updateDashboardData() {
            this._updateSortedChartData();
            this._updateMaterialRanking();
            this._updateOrderDelayData();
        },

        _updateSortedChartData() {
            const oChartModel = this.getOwnerComponent().getModel("chart");
            const oDashboardModel = this.getView().getModel("dashboard");
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            oChartModel.read("/DefectDashboard", {
                filters: aFilters,
                success: (oData) => {
                    const aRows = (oData.results || []).slice().sort(this._sortDashboardRowsByMonth);

                    oDashboardModel.setProperty("/chartRows", aRows);
                    oDashboardModel.setProperty("/monthlyLossRows", this._buildMonthlyLossRows(aRows));
                    oDashboardModel.setProperty("/monthlyPlantQtyRows", this._buildMonthlyPlantQtyRows(aRows));
                },
                error: (oError) => {
                    Log.error("Sorted dashboard chart read failed", oError);
                    oDashboardModel.setProperty("/chartRows", []);
                    oDashboardModel.setProperty("/monthlyLossRows", []);
                    oDashboardModel.setProperty("/monthlyPlantQtyRows", []);
                }
            });
        },

        _sortDashboardRowsByMonth(oA, oB) {
            const iMonthCompare = String(oA.InspectionYearMonth || "").localeCompare(String(oB.InspectionYearMonth || ""));

            if (iMonthCompare !== 0) {
                return iMonthCompare;
            }

            return String(oA.Plant || "").localeCompare(String(oB.Plant || ""));
        },

        _buildMonthlyLossRows(aRows) {
            const mRowsByMonth = aRows.reduce((mMap, oRow) => {
                const sMonth = oRow.InspectionYearMonth || "";

                if (!sMonth) {
                    return mMap;
                }

                if (!mMap[sMonth]) {
                    mMap[sMonth] = {
                        InspectionYearMonth: sMonth,
                        LossAmount: 0
                    };
                }

                mMap[sMonth].LossAmount += Number(oRow.LossAmount || 0);
                return mMap;
            }, {});

            return Object.values(mRowsByMonth).sort(this._sortDashboardRowsByMonth);
        },

        _buildMonthlyPlantQtyRows(aRows) {
            return aRows.slice().sort(this._sortDashboardRowsByMonth);
        },

        _updateMaterialRanking() {
            const oMainModel = this.getOwnerComponent().getModel();
            const oOrderModel = this.getOwnerComponent().getModel("order");
            const oDashboardModel = this.getView().getModel("dashboard");
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            oMainModel.read("/DefectDetail", {
                filters: aFilters,
                success: (oData) => {
                    const mDefectQtyByMaterial = (oData.results || []).reduce((mMap, oRow) => {
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

                    oOrderModel.read("/ZCDS_D3_PP_0005", {
                        filters: this._buildOrderMaterialFilters(),
                        success: (oOrderData) => {
                            const aMaterials = this._buildMaterialRankingRows(
                                oOrderData.results || [],
                                mDefectQtyByMaterial
                            );

                            oDashboardModel.setProperty("/materialRanking", aMaterials);
                            this._applyMaterialKpiFallback();
                        },
                        error: (oError) => {
                            Log.error("Order material list read failed", oError);
                            oDashboardModel.setProperty("/materialRanking", this._rankMaterials(Object.values(mDefectQtyByMaterial)));
                            this._applyMaterialKpiFallback();
                        }
                    });
                },
                error: (oError) => {
                    Log.error("Material ranking read failed", oError);
                    oDashboardModel.setProperty("/materialRanking", []);
                    MessageToast.show(this._getText("dataLoadFailed"));
                }
            });
        },

        _buildOrderMaterialFilters() {
            const oFilterData = this.byId("smartFilterBar").getFilterData() || {};
            const aFilters = [];
            const sMaterialNo = this._getFilterValue(oFilterData.MaterialNo);

            if (sMaterialNo) {
                aFilters.push(new Filter("Matnr", FilterOperator.EQ, sMaterialNo));
            }

            return aFilters;
        },

        _getFilterValue(vValue) {
            if (!vValue) {
                return "";
            }
            if (typeof vValue === "string") {
                return vValue;
            }
            if (vValue.items && vValue.items[0]) {
                return vValue.items[0].key || vValue.items[0].text || "";
            }
            if (vValue.ranges && vValue.ranges[0]) {
                return vValue.ranges[0].value1 || "";
            }
            return "";
        },

        _buildMaterialRankingRows(aOrders, mDefectQtyByMaterial) {
            const mAllMaterials = aOrders.reduce((mMap, oOrder) => {
                const sMaterialNo = oOrder.Matnr || "";

                if (!sMaterialNo) {
                    return mMap;
                }

                if (!mMap[sMaterialNo]) {
                    mMap[sMaterialNo] = {
                        MaterialNo: sMaterialNo,
                        MaterialName: oOrder.Maktx || "",
                        MaterialLabel: oOrder.Maktx ? `${sMaterialNo} ${oOrder.Maktx}`.trim() : sMaterialNo,
                        DefectQty: 0
                    };
                }

                return mMap;
            }, {});

            Object.keys(mDefectQtyByMaterial).forEach((sMaterialNo) => {
                const oDefectMaterial = mDefectQtyByMaterial[sMaterialNo];

                if (!mAllMaterials[sMaterialNo]) {
                    mAllMaterials[sMaterialNo] = {
                        MaterialNo: oDefectMaterial.MaterialNo,
                        MaterialName: oDefectMaterial.MaterialName,
                        MaterialLabel: oDefectMaterial.MaterialLabel,
                        DefectQty: 0
                    };
                }

                mAllMaterials[sMaterialNo].DefectQty = oDefectMaterial.DefectQty;
                if (!mAllMaterials[sMaterialNo].MaterialName) {
                    mAllMaterials[sMaterialNo].MaterialName = oDefectMaterial.MaterialName;
                    mAllMaterials[sMaterialNo].MaterialLabel = oDefectMaterial.MaterialLabel;
                }
            });

            return this._rankMaterials(Object.values(mAllMaterials));
        },

        _rankMaterials(aMaterials) {
            return aMaterials
                .sort((oA, oB) => {
                    if (oB.DefectQty !== oA.DefectQty) {
                        return oB.DefectQty - oA.DefectQty;
                    }
                    return String(oA.MaterialNo).localeCompare(String(oB.MaterialNo));
                })
                .map((oItem, iIndex) => ({
                    ...oItem,
                    Rank: iIndex + 1
                }))
                .slice(0, 5);
        },

        _updateOrderDelayData() {
            const oMainModel = this.getOwnerComponent().getModel();
            const oOrderModel = this.getOwnerComponent().getModel("order");
            const oFilterBar = this.byId("smartFilterBar");
            const aFilters = oFilterBar.getFilters();

            oMainModel.read("/DefectDetail", {
                filters: aFilters,
                success: (oData) => {
                    const aOrderNos = [...new Set((oData.results || [])
                        .map((oRow) => oRow.OrderNo)
                        .filter(Boolean))];

                    if (aOrderNos.length === 0) {
                        this._setOrderDelayData([]);
                        return;
                    }

                    const aOrderFilters = aOrderNos.map((sOrderNo) => new Filter("Aufnr", FilterOperator.EQ, sOrderNo));

                    oOrderModel.read("/ZCDS_D3_PP_0005", {
                        filters: [
                            new Filter({
                                filters: aOrderFilters,
                                and: false
                            })
                        ],
                        success: (oOrderData) => {
                            this._setOrderDelayData(oOrderData.results || []);
                        },
                        error: (oError) => {
                            Log.error("Production order delay read failed", oError);
                            this._setOrderDelayData([]);
                        }
                    });
                },
                error: (oError) => {
                    Log.error("Defect orders for delay read failed", oError);
                    this._setOrderDelayData([]);
                }
            });
        },

        _setOrderDelayData(aOrders) {
            const oDashboardModel = this.getView().getModel("dashboard");
            const aItems = aOrders
                .map((oOrder) => {
                    const iDelayDays = this._calculateDelayDays(oOrder.Pln_Edt, oOrder.Act_Edt);

                    return {
                        OrderNo: oOrder.Aufnr || "",
                        MaterialNo: oOrder.Matnr || "",
                        MaterialName: oOrder.Maktx || "",
                        PlannedEndDate: oOrder.Pln_Edt,
                        ActualEndDate: oOrder.Act_Edt,
                        DelayDays: iDelayDays,
                        DelayColor: this._getDelayMicroChartColor(iDelayDays),
                        Status: oOrder.Ordst || "",
                        StatusName: this._getOrderStatusName(oOrder.Ordst)
                    };
                })
                .sort((oA, oB) => oB.DelayDays - oA.DelayDays);
            const iTotalDelay = aItems.reduce((iSum, oItem) => iSum + oItem.DelayDays, 0);
            const iAverageDelay = aItems.length > 0 ? Math.round((iTotalDelay / aItems.length) * 10) / 10 : 0;
            const iDelayedOrderCount = aItems.filter((oItem) => oItem.DelayDays > 0).length;
            const iDelayRate = aItems.length > 0 ? Math.round((iDelayedOrderCount / aItems.length) * 100) : 0;

            oDashboardModel.setProperty("/orderDelayItems", aItems);
            oDashboardModel.setProperty("/orderDelay", {
                averageDelayDays: iAverageDelay,
                delayRate: iDelayRate,
                delayColor: this._getDelayRateMicroChartColor(iDelayRate),
                delayedOrderCount: iDelayedOrderCount,
                totalOrderCount: aItems.length
            });
        },

        _getDelayMicroChartColor(iDelayDays) {
            if (iDelayDays >= 3) {
                return "Error";
            }
            if (iDelayDays > 0) {
                return "Critical";
            }
            return "Good";
        },

        _getDelayRateMicroChartColor(iDelayRate) {
            if (iDelayRate >= 50) {
                return "Error";
            }
            if (iDelayRate > 0) {
                return "Critical";
            }
            return "Good";
        },

        _calculateDelayDays(vPlannedEndDate, vActualEndDate) {
            const oPlannedEndDate = this._toDate(vPlannedEndDate);
            const oActualEndDate = this._toDate(vActualEndDate);

            if (!oPlannedEndDate || !oActualEndDate) {
                return 0;
            }

            return Math.max(0, Math.ceil((oActualEndDate - oPlannedEndDate) / 86400000));
        },

        _getOrderStatusName(sStatus) {
            const mStatusText = {
                RELS: this._getText("orderStatusRels"),
                CLRQ: this._getText("orderStatusClrq"),
                CLRJ: this._getText("orderStatusClrj"),
                RECV: this._getText("orderStatusRecv")
            };

            return mStatusText[sStatus] || sStatus || "";
        },

        onOrderDelayHelpPress(oEvent) {
            const oSource = oEvent.getSource();

            if (!this._oOrderDelayHelpPopover) {
                sap.ui.require([
                    "sap/m/ObjectStatus",
                    "sap/m/Popover",
                    "sap/m/Text",
                    "sap/m/VBox"
                ], (ObjectStatus, Popover, Text, VBox) => {
                    this._oOrderDelayHelpPopover = new Popover({
                        title: this._getText("orderDelayHelpTitle"),
                        contentWidth: "24rem",
                        content: new VBox({
                            class: "sapUiSmallMargin",
                            items: [
                                new Text({
                                    text: this._getText("orderDelayHelpText"),
                                    wrapping: true
                                }),
                                new ObjectStatus({
                                    title: this._getText("orderDelayFormulaTitle"),
                                    text: this._getText("orderDelayFormulaText"),
                                    state: "Information",
                                    class: "sapUiSmallMarginTop"
                                }),
                                new ObjectStatus({
                                    title: this._getText("orderDelaySuccessTitle"),
                                    text: this._getText("orderDelaySuccessText"),
                                    state: "Success",
                                    class: "sapUiTinyMarginTop"
                                }),
                                new ObjectStatus({
                                    title: this._getText("orderDelayWarningTitle"),
                                    text: this._getText("orderDelayWarningText"),
                                    state: "Warning",
                                    class: "sapUiTinyMarginTop"
                                })
                            ]
                        })
                    });
                    this.getView().addDependent(this._oOrderDelayHelpPopover);
                    this._oOrderDelayHelpPopover.openBy(oSource);
                });
                return;
            }

            this._oOrderDelayHelpPopover.openBy(oSource);
        },

        _toDate(vDate) {
            if (!vDate) {
                return null;
            }

            const oDate = vDate instanceof Date ? vDate : new Date(vDate);
            return Number.isNaN(oDate.getTime()) ? null : oDate;
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
                        this._applyMaterialKpiFallback();
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

        _applyMaterialKpiFallback() {
            const oKpiModel = this.getView().getModel("kpi");
            const oDashboardModel = this.getView().getModel("dashboard");
            const oKpiData = oKpiModel.getData();
            const aMaterialRanking = oDashboardModel.getProperty("/materialRanking") || [];
            const oTopMaterial = aMaterialRanking[0];

            if (!oKpiData.MaxDefectMaterialName && oTopMaterial) {
                oKpiModel.setProperty(
                    "/MaxDefectMaterialName",
                    oTopMaterial.MaterialName || oTopMaterial.MaterialNo || ""
                );
            }
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
