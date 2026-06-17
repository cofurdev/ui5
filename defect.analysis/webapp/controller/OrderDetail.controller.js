sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/base/Log",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], (Controller, JSONModel, Filter, FilterOperator, Sorter, Log, MessageToast, History) => {
    "use strict";

    return Controller.extend("code.d3.defect.analysis.controller.OrderDetail", {
        onInit() {
            this.getView().setModel(new JSONModel({
                busy: false,
                inspectionNo: "",
                orderNo: "",
                selected: {},
                relatedSummary: {},
                relatedTreeItems: [],
                relatedItems: [],
                productionOrder: {},
                additionalProductionOrders: []
            }), "detail");

            this.getOwnerComponent().getRouter()
                .getRoute("RouteInspectionDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(oEvent) {
            const sInspectionNo = decodeURIComponent(oEvent.getParameter("arguments").inspectionNo || "");
            this.getView().getModel("detail").setProperty("/inspectionNo", sInspectionNo);
            this._loadInspectionDetail(sInspectionNo);
        },

        _loadInspectionDetail(sInspectionNo) {
            const oDetailModel = this.getView().getModel("detail");
            const oModel = this.getOwnerComponent().getModel();

            oDetailModel.setProperty("/busy", true);

            oModel.read("/DefectDetail", {
                filters: [
                    new Filter("InspectionNo", FilterOperator.EQ, sInspectionNo)
                ],
                success: (oData) => {
                    const oSelected = (oData.results || [])[0];
                    if (!oSelected) {
                        oDetailModel.setProperty("/busy", false);
                        MessageToast.show(this._getText("inspectionNotFound"));
                        return;
                    }

                    oDetailModel.setProperty("/selected", oSelected);
                    oDetailModel.setProperty("/orderNo", oSelected.OrderNo || "");
                    this._loadRelatedInspections(oSelected);
                },
                error: (oError) => {
                    Log.error("Inspection detail read failed", oError);
                    oDetailModel.setProperty("/busy", false);
                    MessageToast.show(this._getText("dataLoadFailed"));
                }
            });
        },

        _loadRelatedInspections(oSelected) {
            const oDetailModel = this.getView().getModel("detail");
            const oModel = this.getOwnerComponent().getModel();
            const sOrderNo = oSelected.OrderNo || "";

            oModel.read("/DefectDetail", {
                filters: [
                    new Filter("OrderNo", FilterOperator.EQ, sOrderNo)
                ],
                sorters: [
                    new Sorter("InspectionEndDate", true),
                    new Sorter("InspectionNo", false)
                ],
                success: (oData) => {
                    const aRows = oData.results || [];
                    oDetailModel.setData({
                        busy: false,
                        inspectionNo: oSelected.InspectionNo || "",
                        orderNo: sOrderNo,
                        selected: oSelected,
                        relatedSummary: this._buildSummary(aRows),
                        relatedTreeItems: this._buildRelatedTree(sOrderNo, oSelected.InspectionNo, aRows),
                        relatedItems: aRows,
                        productionOrder: {},
                        additionalProductionOrders: []
                    });
                    this._loadProductionOrderData(sOrderNo);
                },
                error: (oError) => {
                    Log.error("Related inspections read failed", oError);
                    oDetailModel.setProperty("/busy", false);
                    MessageToast.show(this._getText("dataLoadFailed"));
                }
            });
        },

        _loadProductionOrderData(sOrderNo) {
            const oDetailModel = this.getView().getModel("detail");
            const oOrderModel = this.getOwnerComponent().getModel("order");

            if (!oOrderModel || !sOrderNo) {
                return;
            }

            oOrderModel.read("/ZCDS_D3_PP_0005", {
                filters: [
                    new Filter("Aufnr", FilterOperator.EQ, sOrderNo)
                ],
                success: (oData) => {
                    oDetailModel.setProperty("/productionOrder", (oData.results || [])[0] || {});
                },
                error: (oError) => {
                    Log.error("Production order header read failed", oError);
                    oDetailModel.setProperty("/productionOrder", {});
                }
            });

            oOrderModel.read("/ZCDS_D3_PP_0005", {
                filters: [
                    new Filter("Aufnr_Org", FilterOperator.EQ, sOrderNo)
                ],
                sorters: [
                    new Sorter("Pln_Sdt", false),
                    new Sorter("Aufnr", false)
                ],
                success: (oData) => {
                    oDetailModel.setProperty("/additionalProductionOrders", oData.results || []);
                },
                error: (oError) => {
                    Log.error("Additional production orders read failed", oError);
                    oDetailModel.setProperty("/additionalProductionOrders", []);
                }
            });
        },

        _buildSummary(aRows) {
            const fTotalQty = aRows.reduce((fSum, oRow) => fSum + Number(oRow.DefectQty || 0), 0);
            const aDefectCodes = [...new Set(aRows.map((oRow) => oRow.DefectCode).filter(Boolean))];
            const oFirst = aRows[0] || {};

            return {
                inspectionCount: aRows.length,
                totalQty: fTotalQty,
                unit: oFirst.Unit || "",
                plant: oFirst.Plant || "",
                materialNo: oFirst.MaterialNo || "",
                materialName: oFirst.MaterialName || "",
                defectCodeCount: aDefectCodes.length
            };
        },

        _buildRelatedTree(sOrderNo, sSelectedInspectionNo, aRows) {
            const oSummary = this._buildSummary(aRows);

            return [{
                title: this._getText("treeRelatedProductionOrderTitle", [sOrderNo]),
                description: this._getText("treeRelatedProductionOrderDescription", [
                    oSummary.inspectionCount,
                    oSummary.totalQty,
                    oSummary.unit,
                    oSummary.plant,
                    oSummary.materialNo,
                    oSummary.materialName
                ]),
                icon: "sap-icon://factory",
                info: oSummary.plant,
                state: "None",
                expanded: true,
                children: aRows.map((oRow) => {
                    const bIsCurrent = oRow.InspectionNo === sSelectedInspectionNo;

                    return {
                        title: bIsCurrent
                            ? this._getText("treeCurrentInspectionTitle", [oRow.InspectionNo])
                            : this._getText("treeInspectionTitle", [oRow.InspectionNo]),
                        description: this._getText("treeInspectionDescription", [
                            oRow.ProcessName || "-",
                            oRow.DefectCode || "-",
                            oRow.DefectText || "-",
                            this._formatDate(oRow.InspectionEndDate) || "-"
                        ]),
                        icon: bIsCurrent ? "sap-icon://message-information" : "sap-icon://inspection",
                        info: bIsCurrent
                            ? this._getText("currentInspectionBadge", [`${oRow.DefectQty || 0} ${oRow.Unit || ""}`.trim()])
                            : `${oRow.DefectQty || 0} ${oRow.Unit || ""}`.trim(),
                        state: bIsCurrent ? "Information" : this._getQtyState(oRow.DefectQty),
                        expanded: false
                    };
                })
            }];
        },

        _getQtyState(vQty) {
            const fQty = Number(vQty || 0);
            if (fQty > 10) {
                return "Error";
            }
            if (fQty > 5) {
                return "Warning";
            }
            return "None";
        },

        onTreeUpdateFinished() {
            const oTree = this.byId("qualityInspectionTree");
            if (oTree) {
                oTree.expandToLevel(1);
            }
        },

        onCollapseTree() {
            const oTree = this.byId("qualityInspectionTree");
            if (oTree) {
                oTree.collapseAll();
            }
        },

        onExpandTree() {
            const oTree = this.byId("qualityInspectionTree");
            if (oTree) {
                oTree.expandToLevel(1);
            }
        },

        _formatDate(vDate) {
            if (!vDate) {
                return "";
            }

            const oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (Number.isNaN(oDate.getTime())) {
                return String(vDate);
            }

            return oDate.toISOString().slice(0, 10);
        },

        onNavBack() {
            const sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
        },

        _getText(sKey, aArgs) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey, aArgs);
        }
    });
});
