sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Item",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Item, JSONModel, Filter, FilterOperator) => {
    "use strict";

    const SUMMARY_CURRENCY = "USD";

    return Controller.extend("code.d19.ui5.review6.controller.Main", {
        onInit() {
            const oSummaryModel = new JSONModel({
                carrierCount: 0,
                connectionCount: 0,
                flightCount: 0,
                totalBookings: 0,
                totalRevenue: 0,
                cancelledBookings: 0,
                currency: SUMMARY_CURRENCY,
                loaded: false
            });
            this.getView().setModel(oSummaryModel, "summary");
            this._bCurrencyLoaded = false;
            this._loadSummary();
        },

        onAfterRendering() {
            if (!this._bCurrencyLoaded) {
                this._bCurrencyLoaded = true;
                this._loadCurrencyFilter();
            }
        },

        _loadSummary() {
            const oODataModel = this.getView().getModel();
            if (!oODataModel) {
                return;
            }

            const fnReadCount = (sPath) => new Promise((resolve) => {
                oODataModel.read(`${sPath}/$count`, {
                    success: (iCount) => resolve(Number(iCount) || 0),
                    error: () => resolve(0)
                });
            });

            const fnReadKpi = () => new Promise((resolve) => {
                oODataModel.read(`/DashboardKpiSet('${SUMMARY_CURRENCY}')/Set`, {
                    success: (oData) => {
                        const aResults = oData.results || [];
                        let iBookings = 0;
                        let fRevenue = 0;
                        let iCancelled = 0;

                        aResults.forEach((oRow) => {
                            iBookings += oRow.TotalBookings || 0;
                            fRevenue += Number(oRow.TotalRevenue) || 0;
                            iCancelled += oRow.CancelledBookings || 0;
                        });

                        resolve({
                            totalBookings: iBookings,
                            totalRevenue: fRevenue,
                            cancelledBookings: iCancelled
                        });
                    },
                    error: () => resolve({
                        totalBookings: 0,
                        totalRevenue: 0,
                        cancelledBookings: 0
                    })
                });
            });

            Promise.all([
                fnReadCount("/CarrierSet"),
                fnReadCount("/ConnectionSet"),
                fnReadCount("/FlightSet"),
                fnReadKpi()
            ]).then(([iCarriers, iConnections, iFlights, oKpi]) => {
                this.getView().getModel("summary")?.setData({
                    carrierCount: iCarriers,
                    connectionCount: iConnections,
                    flightCount: iFlights,
                    totalBookings: oKpi.totalBookings,
                    totalRevenue: oKpi.totalRevenue,
                    cancelledBookings: oKpi.cancelledBookings,
                    currency: SUMMARY_CURRENCY,
                    loaded: true
                });
            });
        },

        _loadCurrencyFilter() {
            const oSelect = this.byId("currencyFilter");
            const oODataModel = this.getView().getModel();
            if (!oSelect || !oODataModel) {
                return;
            }

            oODataModel.read("/CarrierSet", {
                urlParameters: {
                    $select: "Currcode",
                    $orderby: "Currcode"
                },
                success: (oData) => {
                    const aCodes = [...new Set((oData.results || [])
                        .map((oRow) => oRow.Currcode)
                        .filter(Boolean))];

                    oSelect.destroyItems();
                    oSelect.addItem(new Item({
                        key: "",
                        text: this._getText("filterAllCurrencies")
                    }));
                    aCodes.forEach((sCode) => {
                        oSelect.addItem(new Item({ key: sCode, text: sCode }));
                    });
                },
                error: () => {
                    oSelect.destroyItems();
                    oSelect.addItem(new Item({
                        key: "",
                        text: this._getText("filterAllCurrencies")
                    }));
                }
            });
        },

        _applyCarrierFilters() {
            const oBinding = this.byId("carrierTable")?.getBinding("items");
            if (!oBinding) {
                return;
            }

            const sQuery = (this.byId("carrierSearch")?.getValue() || "").trim();
            const sCurrency = this.byId("currencyFilter")?.getSelectedKey() || "";
            const aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Carrid", FilterOperator.Contains, sQuery),
                        new Filter("Carrname", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            if (sCurrency) {
                aFilters.push(new Filter("Currcode", FilterOperator.EQ, sCurrency));
            }

            oBinding.filter(aFilters);
        },

        onCarrierSearch() {
            this._applyCarrierFilters();
        },

        onCurrencyFilterChange() {
            this._applyCarrierFilters();
        },

        onResetFilters() {
            this.byId("carrierSearch")?.setValue("");
            const oSelect = this.byId("currencyFilter");
            if (oSelect) {
                oSelect.setSelectedKey("");
            }
            this._applyCarrierFilters();
        },

        onCarrierPress(oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                return;
            }
            const sCarrid = oContext.getProperty("Carrid");
            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                Carrid: sCarrid
            });
        },

        _getText(sKey) {
            const oBundle = this.getView().getModel("i18n")?.getResourceBundle();
            return oBundle ? oBundle.getText(sKey) : sKey;
        }
    });
});
