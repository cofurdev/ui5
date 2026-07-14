sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "code/d3/productionorderschedule/model/formatter"
], (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, SelectDialog, StandardListItem, formatter) => {
    "use strict";

    const DEFAULT_PLANT = "P00001";

    return Controller.extend("code.d3.productionorderschedule.controller.Main", {
        formatter: formatter,

        onInit() {
            this.getView().setModel(new JSONModel({
                filters: {
                    Plant: DEFAULT_PLANT,
                    ProductionOrder: "",
                    OriginalProductionOrder: "",
                    Product: "",
                    PlannedStartDate: null,
                    PlannedEndDate: null,
                    ProductionOrderStatus: "",
                    ScheduleStatus: "",
                    DelayedOnly: false
                },
                orderStatusOptions: [
                    { key: "", text: this._text("all") },
                    { key: "WAIT", text: "WAIT - 생산 대기" },
                    { key: "RELS", text: "RELS - 생산 중" },
                    { key: "CLRQ", text: "CLRQ - 생산 마감 요청" },
                    { key: "TECO", text: "TECO - 생산 마감" },
                    { key: "CLRJ", text: "CLRJ - 생산 마감 반려" },
                    { key: "RECV", text: "RECV - 입고 완료" }
                ],
                scheduleStatusOptions: [
                    { key: "", text: this._text("all") },
                    { key: "PLANNED", text: this._text("schedulePlanned") },
                    { key: "IN_PROGRESS", text: this._text("scheduleInProgress") },
                    { key: "DELAYED", text: this._text("scheduleDelayed") },
                    { key: "COMPLETE", text: this._text("scheduleComplete") },
                    { key: "FINISHED", text: this._text("scheduleFinished") }
                ],
                kpi: {
                    total: "-",
                    inProgress: "-",
                    delayed: "-",
                    complete: "-"
                },
                plantOptions: [
                    { Plant: "P00001", PlantName: "P00001" },
                    { Plant: "P00002", PlantName: "P00002" }
                ],
                productOptions: [],
                ui: {
                    busy: false,
                    resultCount: 0
                }
            }), "view");
        },

        onPlantValueHelp() {
            this._openLocalValueHelp("Plant", "/plantOptions", "Plant", "PlantName", this._text("plant"));
        },

        onProductionOrderValueHelp() {
            this._openValueHelp("ProductionOrder", "ProductionOrder", "ProductName", this._text("productionOrder"));
        },

        onOriginalProductionOrderValueHelp() {
            this._openValueHelp("OriginalProductionOrder", "OriginalProductionOrder", "ProductionOrder", this._text("originalProductionOrder"));
        },

        onProductValueHelp() {
            this._openProductValueHelp();
        },

        onSearch() {
            const aFilters = this._buildFilters();
            if (!aFilters) {
                return;
            }

            this._setBusy(true);
            this.byId("ordersTable").getBinding("items").filter(aFilters);
            this._updateKpis(aFilters);
        },

        onReset() {
            this.getView().getModel("view").setProperty("/filters", {
                Plant: DEFAULT_PLANT,
                ProductionOrder: "",
                OriginalProductionOrder: "",
                Product: "",
                PlannedStartDate: null,
                PlannedEndDate: null,
                ProductionOrderStatus: "",
                ScheduleStatus: "",
                DelayedOnly: false
            });
            this.onSearch();
        },

        onRefresh() {
            const oBinding = this.byId("ordersTable").getBinding("items");
            if (oBinding) {
                this._setBusy(true);
                oBinding.refresh(true);
                this._updateKpis(this._buildFilters() || []);
            }
        },

        onUpdateFinished(oEvent) {
            this.getView().getModel("view").setProperty("/ui/resultCount", oEvent.getParameter("total"));
            this._setBusy(false);
        },

        onItemPress(oEvent) {
            this._navToDetailFromEvent(oEvent);
        },

        onSelectionChange(oEvent) {
            this._navToDetailFromEvent(oEvent);
        },

        _navToDetailFromEvent(oEvent) {
            const oListItem = oEvent.getParameter("listItem") || oEvent.getParameter("selectedItem") || oEvent.getSource();
            const oContext = oListItem && oListItem.getBindingContext && oListItem.getBindingContext();

            if (!oContext) {
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                contextPath: encodeURIComponent(oContext.getPath())
            });
        },
        onDataRequested() {
            this._setBusy(true);
        },

        onDataReceived(oEvent) {
            this._setBusy(false);
            if (oEvent.getParameter("error")) {
                MessageBox.error(this._text("messageSearchFailed"));
            }
        },

        _openLocalValueHelp(sFilterProperty, sItemsPath, sTitleProperty, sDescriptionProperty, sTitle) {
            const oTemplate = new StandardListItem({
                title: `{view>${sTitleProperty}}`,
                description: sDescriptionProperty ? `{view>${sDescriptionProperty}}` : "",
                type: "Active"
            });
            const oDialog = new SelectDialog({
                title: sTitle,
                noDataText: this._text("noValueHelpData"),
                rememberSelections: false,
                confirm: (oEvent) => {
                    const oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        this.getView().getModel("view").setProperty(`/filters/${sFilterProperty}`, oSelectedItem.getTitle());
                    }
                    oDialog.destroy();
                },
                cancel: () => {
                    oDialog.destroy();
                }
            });

            oDialog.setModel(this.getView().getModel("view"), "view");
            oDialog.bindAggregation("items", {
                path: `view>${sItemsPath}`,
                template: oTemplate
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _openProductValueHelp() {
            const oViewModel = this.getView().getModel("view");
            const aProducts = oViewModel.getProperty("/productOptions");

            if (aProducts && aProducts.length) {
                this._openLocalValueHelp("Product", "/productOptions", "Product", "ProductName", this._text("product"));
                return;
            }

            this._setBusy(true);
            this.getView().getModel().read("/ProductionOrderSchedule", {
                urlParameters: {
                    "$select": "Product,ProductName",
                    "$top": "500"
                },
                success: (oData) => {
                    const mSeen = Object.create(null);
                    const aUniqueProducts = [];

                    (oData.results || []).some((oRow) => {
                        if (!oRow.Product || mSeen[oRow.Product]) {
                            return false;
                        }

                        mSeen[oRow.Product] = true;
                        aUniqueProducts.push({
                            Product: oRow.Product,
                            ProductName: oRow.ProductName || ""
                        });
                        return aUniqueProducts.length >= 10;
                    });

                    oViewModel.setProperty("/productOptions", aUniqueProducts);
                    this._setBusy(false);
                    this._openLocalValueHelp("Product", "/productOptions", "Product", "ProductName", this._text("product"));
                },
                error: () => {
                    this._setBusy(false);
                    MessageBox.error(this._text("messageValueHelpFailed"));
                }
            });
        },
        _openValueHelp(sFilterProperty, sTitleProperty, sDescriptionProperty, sTitle) {
            const oTemplate = new StandardListItem({
                title: `{${sTitleProperty}}`,
                description: sDescriptionProperty ? `{${sDescriptionProperty}}` : "",
                type: "Active"
            });
            const oDialog = new SelectDialog({
                title: sTitle,
                noDataText: this._text("noValueHelpData"),
                rememberSelections: false,
                confirm: (oEvent) => {
                    const oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        this.getView().getModel("view").setProperty(`/filters/${sFilterProperty}`, oSelectedItem.getTitle());
                    }
                    oDialog.destroy();
                },
                cancel: () => {
                    oDialog.destroy();
                }
            });

            oDialog.setModel(this.getView().getModel());
            oDialog.bindAggregation("items", {
                path: "/ProductionOrderSchedule",
                template: oTemplate
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _filterValueHelp(oDialog, sTitleProperty, sDescriptionProperty, sValue) {
            const oBinding = oDialog.getBinding("items");
            const aFilters = [];

            if (sValue) {
                const aSearchFilters = [new Filter(sTitleProperty, FilterOperator.Contains, sValue)];
                if (sDescriptionProperty) {
                    aSearchFilters.push(new Filter(sDescriptionProperty, FilterOperator.Contains, sValue));
                }
                aFilters.push(new Filter({
                    filters: aSearchFilters,
                    and: false
                }));
            }

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        _buildFilters() {
            const oData = this.getView().getModel("view").getProperty("/filters");
            const aFilters = [];

            this._addContainsFilter(aFilters, "Plant", oData.Plant);
            this._addContainsFilter(aFilters, "ProductionOrder", oData.ProductionOrder);
            this._addContainsFilter(aFilters, "OriginalProductionOrder", oData.OriginalProductionOrder);
            this._addContainsFilter(aFilters, "Product", oData.Product);
            this._addEqualsFilter(aFilters, "ProductionOrderStatus", oData.ProductionOrderStatus);
            this._addEqualsFilter(aFilters, "ScheduleStatus", oData.ScheduleStatus);

            if (oData.DelayedOnly) {
                aFilters.push(new Filter("ScheduleStatus", FilterOperator.EQ, "DELAYED"));
            }

            if (oData.PlannedStartDate && oData.PlannedEndDate && oData.PlannedStartDate > oData.PlannedEndDate) {
                MessageBox.error(this._text("messageInvalidDateRange"));
                return null;
            }

            if (oData.PlannedStartDate && oData.PlannedEndDate) {
                aFilters.push(new Filter("PlannedStartDate", FilterOperator.BT, oData.PlannedStartDate, oData.PlannedEndDate));
            } else if (oData.PlannedStartDate) {
                aFilters.push(new Filter("PlannedStartDate", FilterOperator.GE, oData.PlannedStartDate));
            } else if (oData.PlannedEndDate) {
                aFilters.push(new Filter("PlannedEndDate", FilterOperator.LE, oData.PlannedEndDate));
            }

            return aFilters;
        },

        _addContainsFilter(aFilters, sPath, sValue) {
            if (sValue) {
                aFilters.push(new Filter(sPath, FilterOperator.Contains, sValue));
            }
        },

        _addEqualsFilter(aFilters, sPath, sValue) {
            if (sValue) {
                aFilters.push(new Filter(sPath, FilterOperator.EQ, sValue));
            }
        },

        _updateKpis(aBaseFilters) {
            const oViewModel = this.getView().getModel("view");

            Promise.all([
                this._requestCount(aBaseFilters),
                this._requestCount(aBaseFilters.concat([new Filter("ScheduleStatus", FilterOperator.EQ, "IN_PROGRESS")])),
                this._requestCount(aBaseFilters.concat([new Filter("ScheduleStatus", FilterOperator.EQ, "DELAYED")])),
                this._requestCount(aBaseFilters.concat([new Filter({
                    filters: [
                        new Filter("ScheduleStatus", FilterOperator.EQ, "COMPLETE"),
                        new Filter("ScheduleStatus", FilterOperator.EQ, "FINISHED")
                    ],
                    and: false
                })]))
            ]).then((aCounts) => {
                oViewModel.setProperty("/kpi/total", aCounts[0]);
                oViewModel.setProperty("/kpi/inProgress", aCounts[1]);
                oViewModel.setProperty("/kpi/delayed", aCounts[2]);
                oViewModel.setProperty("/kpi/complete", aCounts[3]);
            }).catch(() => {
                oViewModel.setProperty("/kpi", {
                    total: "-",
                    inProgress: "-",
                    delayed: "-",
                    complete: "-"
                });
                MessageToast.show(this._text("messageKpiFailed"));
            });
        },

        _requestCount(aFilters) {
            const oModel = this.getView().getModel();

            return new Promise((resolve, reject) => {
                oModel.read("/ProductionOrderSchedule/$count", {
                    filters: aFilters,
                    success: (vCount) => {
                        resolve(parseInt(vCount, 10) || 0);
                    },
                    error: reject
                });
            });
        },

        _setBusy(bBusy) {
            this.getView().getModel("view").setProperty("/ui/busy", bBusy);
        },

        _text(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});