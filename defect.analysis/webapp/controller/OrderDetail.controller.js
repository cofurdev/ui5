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
                defectCodeShare: {},
                relatedTreeItems: [],
                relatedItems: [],
                productionOrder: {},
                additionalProductionOrders: [],
                productionOrderTreeItems: []
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
                        defectCodeShare: this._buildDefectCodeShare(oSelected, aRows),
                        relatedTreeItems: this._buildRelatedTree(sOrderNo, oSelected.InspectionNo, aRows),
                        relatedItems: aRows,
                        productionOrder: {},
                        additionalProductionOrders: [],
                        productionOrderTreeItems: []
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
                    this._rebuildProductionOrderTree();
                },
                error: (oError) => {
                    Log.error("Production order header read failed", oError);
                    oDetailModel.setProperty("/productionOrder", {});
                    this._rebuildProductionOrderTree();
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
                    this._rebuildProductionOrderTree();
                },
                error: (oError) => {
                    Log.error("Additional production orders read failed", oError);
                    oDetailModel.setProperty("/additionalProductionOrders", []);
                    this._rebuildProductionOrderTree();
                }
            });
        },

        _buildDefectCodeShare(oSelected, aRows) {
            const fTotalQty = aRows.reduce((fSum, oRow) => fSum + Number(oRow.DefectQty || 0), 0);
            const sDefectCode = oSelected.DefectCode || "";
            const sDefectText = oSelected.DefectText || "";
            const fCodeQty = aRows
                .filter((oRow) => oRow.DefectCode === sDefectCode)
                .reduce((fSum, oRow) => fSum + Number(oRow.DefectQty || 0), 0);

            if (fTotalQty <= 0) {
                return {
                    label: this._getText("allPassed"),
                    ratio: 100,
                    ratioDisplay: "100%",
                    codeQty: 0,
                    totalQty: 0,
                    state: "Success"
                };
            }

            const fRatio = Math.round((fCodeQty / fTotalQty) * 1000) / 10;

            return {
                label: sDefectCode ? `${sDefectCode} ${sDefectText}`.trim() : this._getText("defectCode"),
                ratio: fRatio,
                ratioDisplay: `${fRatio}%`,
                codeQty: fCodeQty,
                totalQty: fTotalQty,
                state: this._getDefectShareState(fRatio)
            };
        },

        _getDefectShareState(fRatio) {
            if (fRatio >= 50) {
                return "Error";
            }
            if (fRatio >= 25) {
                return "Warning";
            }
            return "Information";
        },

        onDefectShareHelpPress(oEvent) {
            const oSource = oEvent.getSource();

            if (!this._oDefectShareHelpPopover) {
                sap.ui.require([
                    "sap/m/ObjectStatus",
                    "sap/m/Popover",
                    "sap/m/Text",
                    "sap/m/VBox"
                ], (ObjectStatus, Popover, Text, VBox) => {
                    this._oDefectShareHelpPopover = new Popover({
                        title: this._getText("defectCodeShareHelpTitle"),
                        contentWidth: "22rem",
                        content: new VBox({
                            class: "sapUiSmallMargin",
                            items: [
                                new ObjectStatus({
                                    title: this._getText("defectCodeShareSuccessTitle"),
                                    text: this._getText("defectCodeShareSuccessText"),
                                    state: "Success",
                                    class: "sapUiSmallMarginTop"
                                }),
                                new ObjectStatus({
                                    title: this._getText("defectCodeShareInfoTitle"),
                                    text: this._getText("defectCodeShareInfoText"),
                                    state: "Information",
                                    class: "sapUiTinyMarginTop"
                                }),
                                new ObjectStatus({
                                    title: this._getText("defectCodeShareWarningTitle"),
                                    text: this._getText("defectCodeShareWarningText"),
                                    state: "Warning",
                                    class: "sapUiTinyMarginTop"
                                }),
                                new ObjectStatus({
                                    title: this._getText("defectCodeShareErrorTitle"),
                                    text: this._getText("defectCodeShareErrorText"),
                                    state: "Error",
                                    class: "sapUiTinyMarginTop"
                                })
                            ]
                        })
                    });
                    this.getView().addDependent(this._oDefectShareHelpPopover);
                    this._oDefectShareHelpPopover.openBy(oSource);
                });
                return;
            }

            this._oDefectShareHelpPopover.openBy(oSource);
        },

        _rebuildProductionOrderTree() {
            const oDetailModel = this.getView().getModel("detail");
            const oOrder = oDetailModel.getProperty("/productionOrder") || {};
            const aAdditionalOrders = oDetailModel.getProperty("/additionalProductionOrders") || [];
            const sOrderNo = oDetailModel.getProperty("/orderNo") || oOrder.Aufnr || "";

            oDetailModel.setProperty("/productionOrderTreeItems", this._buildProductionOrderTree(sOrderNo, oOrder, aAdditionalOrders));
        },

        _buildProductionOrderTree(sOrderNo, oOrder, aAdditionalOrders) {
            const oRoot = Object.keys(oOrder).length > 0 ? oOrder : { Aufnr: sOrderNo };

            return [{
                title: this._getText("treeProductionOrderTitle", [oRoot.Aufnr || sOrderNo || "-"]),
                description: this._getText("treeProductionOrderDescription", [
                    oRoot.Matnr || "-",
                    oRoot.Maktx || "-",
                    oRoot.Werks || "-",
                    oRoot.Name1 || "-"
                ]),
                icon: "sap-icon://factory",
                info: `${oRoot.Ordqt || 0} ${oRoot.Meins || ""}`.trim(),
                state: this._getOrderState(oRoot.Ordst),
                expanded: true,
                children: aAdditionalOrders.map((oChild) => ({
                    title: this._getText("treeAdditionalProductionOrderTitle", [oChild.Aufnr || "-"]),
                    description: this._getText("treeAdditionalProductionOrderDescription", [
                        oChild.Matnr || "-",
                        oChild.Maktx || "-",
                        this._formatDate(oChild.Pln_Sdt) || "-",
                        this._formatDate(oChild.Pln_Edt) || "-"
                    ]),
                    icon: "sap-icon://add-product",
                    info: `${oChild.Ordqt || 0} ${oChild.Meins || ""}`.trim(),
                    state: this._getOrderState(oChild.Ordst),
                    expanded: false
                }))
            }];
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

        _getOrderState(sStatus) {
            if (sStatus === "RELS") {
                return "Success";
            }
            if (sStatus === "CLRQ") {
                return "Warning";
            }
            if (sStatus === "CLRJ") {
                return "Error";
            }
            return "None";
        },

        onProductionOrderTreeItemPress(oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oContext = oItem && oItem.getBindingContext("detail");
            const aChildren = oContext && oContext.getProperty("children");

            if (oItem && aChildren && aChildren.length > 0 && oItem.setExpanded) {
                oItem.setExpanded(!oItem.getExpanded());
            }
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
