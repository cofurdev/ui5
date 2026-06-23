sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/library",
    "sap/f/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, coreLibrary, fLibrary, MessageBox, MessageToast, BusyIndicator, Fragment, Filter, FilterOperator) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;
    const LayoutType = fLibrary.LayoutType;
    const APPROVE_GROUP_ID = "bulkApproveGroup";
    const REJECT_GROUP_ID = "bulkRejectGroup";
    const REJECT_REASON_MAX_LENGTH = 50;

    return Controller.extend("code.d3.orderapproval.controller.Main", {
        onInit() {
        },

        onOrderSelect(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                const sStatus = oBindingContext.getProperty("Ordst");
                this._updateTimelineStatus(sStatus);
            }
        },

        onSelectionChange() {
            const oTable = this.byId("orderTable");
            const nCount = oTable.getSelectedItems().length;
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            const sText = nCount === 0
                ? oBundle.getText("textSelectedZero")
                : oBundle.getText("textSelectedCount", [nCount]);

            this.byId("selectedCount").setText(sText);
        },

        onItemPress(oEvent) {
            const oListItem = oEvent.getParameter("listItem") || oEvent.getSource();
            if (!oListItem) {
                return;
            }

            const oBindingContext = oListItem.getBindingContext();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (!oBindingContext) {
                console.error(oBundle.getText("msgErrorRowData"));
                return;
            }

            const oData = oBindingContext.getObject();
            const oDetailModel = this.getView().getModel("detail");
            const sStatus = oData.Ordst ? oData.Ordst.trim() : "";

            let sRelsStatus = ValueState.None;
            let sRelsIcon = "sap-icon://sys-minus";
            let sRelsText = "";
            let sClrqStatus = ValueState.None;
            let sClrqIcon = "sap-icon://sys-minus";
            let sClrqText = "";
            let sClrqTitle = "itemClrq";
            let sTecoStatus = ValueState.None;
            let sTecoIcon = "sap-icon://sys-minus";
            let sTecoText = "";

            const titleClrq = oBundle.getText("itemClrq");
            const titleClrj = oBundle.getText("itemClrj");
            const textClrq = oBundle.getText("textTimelineClrq");
            const textTeco = oBundle.getText("textTimelineTeco");
            const textClrj = oBundle.getText("textTimelineClrj");

            switch (sStatus) {
                case "CLRQ":
                    sRelsStatus = ValueState.Success;
                    sRelsIcon = "sap-icon://accept";
                    sClrqStatus = ValueState.Warning;
                    sClrqIcon = "sap-icon://sys-enter-2";
                    sClrqText = textClrq;
                    sClrqTitle = titleClrq;
                    break;
                case "TECO":
                    sRelsStatus = ValueState.Success;
                    sRelsIcon = "sap-icon://accept";
                    sClrqStatus = ValueState.Success;
                    sClrqIcon = "sap-icon://accept";
                    sClrqTitle = titleClrq;
                    sTecoStatus = ValueState.Success;
                    sTecoIcon = "sap-icon://complete";
                    sTecoText = textTeco;
                    break;
                case "CLRJ":
                    sRelsStatus = ValueState.Success;
                    sRelsIcon = "sap-icon://accept";
                    sClrqStatus = ValueState.Error;
                    sClrqIcon = "sap-icon://decline";
                    sClrqText = textClrj;
                    sClrqTitle = titleClrj;
                    break;
                default:
                    break;
            }

            oDetailModel.setData({
                Aufnr: oData.Aufnr,
                Matnr: oData.Matnr,
                Maktx: oData.Maktx,
                Werks: oData.Werks,
                Name1: oData.Name1,
                Ordqt: oData.Ordqt,
                ActqtIn: oData.ActqtIn,
                Totaldfqty: oData.Totaldfqty,
                ShortQt: oData.ShortQt,
                Meins: oData.Meins,
                Qcomflag: oData.Qcomflag,
                Aedat: oData.Aedat,
                Aenam: oData.Aenam,
                Ordst: oData.Ordst,
                RelsStatus: sRelsStatus,
                RelsIcon: sRelsIcon,
                RelsText: sRelsText,
                ClrqStatus: sClrqStatus,
                ClrqIcon: sClrqIcon,
                ClrqText: sClrqText,
                ClrqTitle: sClrqTitle,
                TecoStatus: sTecoStatus,
                TecoIcon: sTecoIcon,
                TecoText: sTecoText,
                LayoutType: LayoutType.TwoColumnsBeginExpanded
            });
        },

        onCloseDetail() {
            this.getView().getModel("detail").setProperty("/LayoutType", LayoutType.OneColumn);
        },

        onToggleFullScreen() {
            const oDetailModel = this.getView().getModel("detail");
            const sCurrentLayout = oDetailModel.getProperty("/LayoutType");
            const sNextLayout = sCurrentLayout === LayoutType.MidColumnFullScreen
                ? LayoutType.TwoColumnsBeginExpanded
                : LayoutType.MidColumnFullScreen;

            oDetailModel.setProperty("/LayoutType", sNextLayout);
        },

        onReject() {
            const aSelectedItems = this._getSelectedPendingItems();
            if (!aSelectedItems) {
                return;
            }

            this._aRejectItems = aSelectedItems;
            const oView = this.getView();

            if (!this._pRejectDialog) {
                this._pRejectDialog = Fragment.load({
                    id: oView.getId(),
                    name: "code.d3.orderapproval.view.fragment.RejectDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pRejectDialog.then((oDialog) => {
                const oTextArea = this.byId("taRejectReason");
                oTextArea.setValue("");
                oTextArea.setValueState(ValueState.None);
                oTextArea.setValueStateText("");
                oDialog.open();
            });
        },

        onRejectReasonLiveChange(oEvent) {
            const oTextArea = oEvent.getSource();
            const sValue = oTextArea.getValue();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (sValue.length > REJECT_REASON_MAX_LENGTH) {
                oTextArea.setValue(sValue.slice(0, REJECT_REASON_MAX_LENGTH));
            }

            oTextArea.setValueStateText(oBundle.getText("msgErrorRejectReasonMaxLength", [REJECT_REASON_MAX_LENGTH]));
            oTextArea.setValueState(ValueState.None);
        },

        onConfirmReject() {
            const oTextArea = this.byId("taRejectReason");
            const sReason = oTextArea.getValue().trim();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (!sReason) {
                oTextArea.setValueState(ValueState.Error);
                oTextArea.setValueStateText(oBundle.getText("msgErrorRequireRejectReason"));
                MessageToast.show(oBundle.getText("msgErrorRequireRejectReason"));
                return;
            }

            if (sReason.length > REJECT_REASON_MAX_LENGTH) {
                oTextArea.setValueState(ValueState.Error);
                oTextArea.setValueStateText(oBundle.getText("msgErrorRejectReasonMaxLength", [REJECT_REASON_MAX_LENGTH]));
                MessageToast.show(oBundle.getText("msgErrorRejectReasonMaxLength", [REJECT_REASON_MAX_LENGTH]));
                return;
            }

            MessageBox.confirm(oBundle.getText("msgConfirmReject"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this._submitReject(sReason);
                    }
                }
            });
        },

        onCancelReject() {
            this.byId("rejectDialog").close();
        },

        onApprove() {
            const aSelectedItems = this._getSelectedPendingItems();
            if (!aSelectedItems) {
                return;
            }

            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(oBundle.getText("msgConfirmApprove", [aSelectedItems.length]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this._submitApprove(aSelectedItems);
                    }
                }
            });
        },

        onSearch() {
            const oTable = this.byId("orderTable");
            const oBinding = oTable.getBinding("items");
            const oAedatFrom = this.byId("dpAedatFrom").getDateValue();
            const oAedatTo = this.byId("dpAedatTo").getDateValue();
            const aSelectedStatus = this.byId("cbOrdst").getSelectedKeys();
            const sWerks = this.byId("cbWerks").getSelectedKey();
            const sAufnr = this.byId("inAufnr").getValue().trim();
            const aFilters = [];

            if (oAedatFrom) {
                aFilters.push(new Filter("Aedat", FilterOperator.GE, this._toStartOfDay(oAedatFrom)));
            }

            if (oAedatTo) {
                aFilters.push(new Filter("Aedat", FilterOperator.LE, this._toEndOfDay(oAedatTo)));
            }

            if (aSelectedStatus.length > 0) {
                aFilters.push(new Filter({
                    filters: aSelectedStatus.map((sKey) => new Filter("Ordst", FilterOperator.EQ, sKey)),
                    and: false
                }));
            }

            if (sWerks) {
                aFilters.push(new Filter("Werks", FilterOperator.EQ, sWerks));
            }

            if (sAufnr) {
                aFilters.push(new Filter("Aufnr", FilterOperator.Contains, sAufnr));
            }

            oBinding.filter(aFilters);
            oTable.removeSelections(true);
            this.onSelectionChange();
        },

        onFilterClear() {
            this.byId("dpAedatFrom").setValue("");
            this.byId("dpAedatTo").setValue("");
            this.byId("cbOrdst").removeAllSelectedItems();
            this.byId("cbWerks").setSelectedKey("");
            this.byId("inAufnr").setValue("");

            const oTable = this.byId("orderTable");
            oTable.getBinding("items").filter([]);
            oTable.removeSelections(true);
            this.onSelectionChange();
        },

        _toStartOfDay(oDate) {
            return new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 0, 0, 0, 0);
        },

        _toEndOfDay(oDate) {
            return new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 23, 59, 59, 999);
        },

        _submitApprove(aSelectedItems) {
            const oModel = this.getView().getModel();
            const oTable = this.byId("orderTable");
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            this._prepareDeferredGroup(oModel, APPROVE_GROUP_ID);

            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext();
                oModel.update(oContext.getPath(), {
                    Aufnr: oContext.getProperty("Aufnr"),
                    Ordst: "TECO"
                }, {
                    groupId: APPROVE_GROUP_ID
                });
            });

            BusyIndicator.show(0);
            oModel.submitChanges({
                groupId: APPROVE_GROUP_ID,
                success: (oData) => {
                    BusyIndicator.hide();

                    if (this._hasBatchError(oData)) {
                        MessageBox.error(oBundle.getText("msgErrorApprove"));
                        return;
                    }

                    const aDocuments = this._extractDocumentNumbers(oData, aSelectedItems);
                    MessageBox.success(this._formatApproveSuccessMessage(aSelectedItems.length, aDocuments));
                    oTable.removeSelections(true);
                    this.onSelectionChange();
                    oModel.refresh(true);
                },
                error: () => {
                    BusyIndicator.hide();
                    MessageBox.error(oBundle.getText("msgErrorApprove"));
                }
            });
        },

        _submitReject(sReason) {
            const aSelectedItems = this._aRejectItems || [];
            const oModel = this.getView().getModel();
            const oTable = this.byId("orderTable");
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (aSelectedItems.length === 0) {
                MessageToast.show(oBundle.getText("msgErrorSelectAtLeastOne"));
                return;
            }

            this._prepareDeferredGroup(oModel, REJECT_GROUP_ID);

            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext();
                oModel.update(oContext.getPath(), {
                    Aufnr: oContext.getProperty("Aufnr"),
                    Ordst: "CLRJ",
                    RejTxt: sReason
                }, {
                    groupId: REJECT_GROUP_ID
                });
            });

            BusyIndicator.show(0);
            oModel.submitChanges({
                groupId: REJECT_GROUP_ID,
                success: (oData) => {
                    BusyIndicator.hide();

                    if (this._hasBatchError(oData)) {
                        MessageBox.error(oBundle.getText("msgErrorReject"));
                        return;
                    }

                    this.byId("rejectDialog").close();
                    MessageToast.show(oBundle.getText("msgSuccessReject"));
                    oTable.removeSelections(true);
                    this.onSelectionChange();
                    oModel.refresh(true);
                },
                error: () => {
                    BusyIndicator.hide();
                    MessageBox.error(oBundle.getText("msgErrorReject"));
                }
            });
        },

        _getSelectedPendingItems() {
            const oTable = this.byId("orderTable");
            const aSelectedItems = oTable.getSelectedItems();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (aSelectedItems.length === 0) {
                MessageToast.show(oBundle.getText("msgErrorSelectAtLeastOne"));
                return null;
            }

            const bHasNonPendingOrder = aSelectedItems.some((oItem) => {
                const sStatus = oItem.getBindingContext().getProperty("Ordst");
                return sStatus !== "CLRQ";
            });

            if (bHasNonPendingOrder) {
                MessageBox.warning(oBundle.getText("msgErrorOnlyPending"));
                return null;
            }

            return aSelectedItems;
        },

        _prepareDeferredGroup(oModel, sGroupId) {
            oModel.setUseBatch(true);

            const aDeferredGroups = oModel.getDeferredGroups ? oModel.getDeferredGroups() : [];
            if (!aDeferredGroups.includes(sGroupId)) {
                oModel.setDeferredGroups(aDeferredGroups.concat(sGroupId));
            }
        },

        _hasBatchError(oData) {
            const aBatchResponses = oData && oData.__batchResponses ? oData.__batchResponses : [];

            return aBatchResponses.some((oBatchResponse) => {
                if (oBatchResponse.response && Number(oBatchResponse.response.statusCode) >= 400) {
                    return true;
                }

                const aChangeResponses = oBatchResponse.__changeResponses || [];
                return aChangeResponses.some((oChangeResponse) => Number(oChangeResponse.statusCode) >= 400);
            });
        },

        _extractDocumentNumbers(oData, aSelectedItems) {
            const aDocuments = [];
            const aBatchResponses = oData && oData.__batchResponses ? oData.__batchResponses : [];

            aBatchResponses.forEach((oBatchResponse) => {
                (oBatchResponse.__changeResponses || []).forEach((oChangeResponse, iChangeIndex) => {
                    const oResponseData = oChangeResponse.data || {};
                    const sBelnr = oResponseData.Belnr || oResponseData.belnr;
                    const oSelectedContext = aSelectedItems[iChangeIndex] && aSelectedItems[iChangeIndex].getBindingContext();
                    const sAufnr = oResponseData.Aufnr ||
                        oResponseData.aufnr ||
                        (oSelectedContext && oSelectedContext.getProperty("Aufnr"));
                    const sHeaderBelnr = this._extractDocumentNumberFromSapMessage(oChangeResponse.headers) ||
                        this._extractDocumentNumberFromSapMessage(oBatchResponse.headers);

                    if (sBelnr) {
                        aDocuments.push({
                            Aufnr: sAufnr,
                            Belnr: sBelnr
                        });
                    } else if (sHeaderBelnr) {
                        aDocuments.push({
                            Aufnr: sAufnr,
                            Belnr: sHeaderBelnr
                        });
                    }
                });
            });

            if (aDocuments.length > 0) {
                return aDocuments;
            }

            return aSelectedItems.map((oItem) => {
                const oContext = oItem.getBindingContext();
                return {
                    Aufnr: oContext.getProperty("Aufnr"),
                    Belnr: oContext.getProperty("Belnr")
                };
            }).filter((oDocument) => oDocument.Belnr);
        },

        _extractDocumentNumberFromSapMessage(oHeaders) {
            const sSapMessage = this._getHeaderValue(oHeaders, "sap-message");

            if (!sSapMessage) {
                return "";
            }

            try {
                const oSapMessage = JSON.parse(sSapMessage);
                const aMessages = [oSapMessage].concat(oSapMessage.details || []);
                const oDocumentMessage = aMessages.find((oMessage) => {
                    return oMessage && oMessage.code && oMessage.code.indexOf("/422") > -1;
                }) || oSapMessage;

                return this._extractDocumentNumberFromText(oDocumentMessage.message);
            } catch (oError) {
                return this._extractDocumentNumberFromText(sSapMessage);
            }
        },

        _getHeaderValue(oHeaders, sHeaderName) {
            if (!oHeaders) {
                return "";
            }

            const sWantedHeader = sHeaderName.toLowerCase();
            const sMatchedHeader = Object.keys(oHeaders).find((sHeader) => {
                return sHeader.toLowerCase() === sWantedHeader;
            });

            return sMatchedHeader ? oHeaders[sMatchedHeader] : "";
        },

        _extractDocumentNumberFromText(sText) {
            if (!sText) {
                return "";
            }

            const aMatches = String(sText).match(/\d{6,}/g);
            return aMatches ? aMatches[aMatches.length - 1] : String(sText);
        },

        _formatApproveSuccessMessage(nCount, aDocuments) {
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (aDocuments.length === 0) {
                return oBundle.getText("msgSuccessApproveNoDocument", [nCount]);
            }

            const sDocumentList = aDocuments.map((oDocument) => {
                return oDocument.Aufnr
                    ? `${oDocument.Aufnr}: ${oDocument.Belnr}`
                    : oDocument.Belnr;
            }).join("\n");

            return oBundle.getText("msgSuccessApproveWithDocument", [nCount, sDocumentList]);
        }
    });
});
