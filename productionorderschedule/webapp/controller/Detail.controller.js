sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "code/d3/productionorderschedule/model/formatter"
], (Controller, History, MessageBox, formatter) => {
    "use strict";

    return Controller.extend("code.d3.productionorderschedule.controller.Detail", {
        formatter: formatter,

        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        onNavBack() {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        },

        _onRouteMatched(oEvent) {
            const sPath = decodeURIComponent(oEvent.getParameter("arguments").contextPath);
            this.getView().setBusy(false);

            this.getView().bindElement({
                path: sPath,
                parameters: {
                    expand: "to_Operation"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataReceived: (oDataEvent) => {
                        this.getView().setBusy(false);
                        if (oDataEvent.getParameter("error")) {
                            MessageBox.error(this._text("messageDetailFailed"));
                        }
                    }
                }
            });
        },

        _onBindingChange() {
            this.getView().setBusy(false);
            if (!this.getView().getBindingContext()) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        },

        _text(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});