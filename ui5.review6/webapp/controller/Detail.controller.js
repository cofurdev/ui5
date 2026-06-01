sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "code/d19/ui5/review6/model/formatter"
], (Controller, Filter, formatter) => {
    "use strict";

    return Controller.extend("code.d19.ui5.review6.controller.Detail", {
        formatter,

        onInit() {
            this._sFlightSeatFilter = "ALL";
            this.getOwnerComponent().getRouter()
                .getRoute("RouteDetail")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched(oEvent) {
            const sCarrid = oEvent.getParameter("arguments").Carrid;
            const oModel = this.getView().getModel();
            if (!oModel || !sCarrid) {
                return;
            }

            const sPath = oModel.createKey("/CarrierSet", { Carrid: sCarrid });

            this.getView().bindElement({
                path: sPath,
                parameters: {
                    expand: "to_Connection,to_Flight,to_RevenueGrowth"
                },
                events: {
                    dataReceived: () => this._applyFlightSeatFilter()
                }
            });

            const oSegmented = this.byId("flightSeatFilter");
            if (oSegmented) {
                oSegmented.setSelectedKey("ALL");
            }
            this._sFlightSeatFilter = "ALL";
        },

        _applyFlightSeatFilter() {
            const oBinding = this.byId("flightTable")?.getBinding("items");
            if (!oBinding) {
                return;
            }

            if (this._sFlightSeatFilter === "ALL") {
                oBinding.filter([]);
                return;
            }

            const sFilter = this._sFlightSeatFilter;
            oBinding.filter([
                new Filter({
                    path: "OccupancyRate",
                    test: (vOccupancy, oContext) => {
                        const oData = oContext.getObject();
                        const sLevel = formatter.getOccupancyLevel(
                            vOccupancy,
                            oData.Seatsocc,
                            oData.Seatsmax
                        );
                        return sLevel === sFilter;
                    }
                })
            ]);
        },

        onFlightSeatFilter(oEvent) {
            const oItem = oEvent.getParameter("item");
            if (!oItem) {
                return;
            }
            this._sFlightSeatFilter = oItem.getKey();
            this._applyFlightSeatFilter();
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
        }
    });
});
