sap.ui.define([], () => {
    "use strict";

    function normalizeStatus(sValue) {
        return (sValue || "").toString().trim().toUpperCase();
    }

    function numberValue(vValue) {
        const fValue = parseFloat(vValue);
        return isNaN(fValue) ? 0 : fValue;
    }

    return {
        scheduleState(sStatus) {
            switch (normalizeStatus(sStatus)) {
                case "DELAYED":
                    return "Error";
                case "IN_PROGRESS":
                    return "Information";
                case "COMPLETE":
                case "FINISHED":
                    return "Success";
                default:
                    return "None";
            }
        },

        operationScheduleState(sStatus) {
            return this.scheduleState(sStatus);
        },

        orderStatusState(sStatus) {
            switch (normalizeStatus(sStatus)) {
                case "REL":
                case "RELEASED":
                case "IN_PROGRESS":
                    return "Information";
                case "TECO":
                case "CLSD":
                case "COMPLETE":
                case "FINISHED":
                case "DLV":
                    return "Success";
                case "REJECTED":
                case "CANCELLED":
                case "DELAYED":
                    return "Error";
                default:
                    return "None";
            }
        },

        progressValue(vValue) {
            return Math.max(0, Math.min(100, numberValue(vValue)));
        },

        progressDisplayValue(vValue) {
            return Math.max(0, Math.min(100, numberValue(vValue))).toFixed(0) + "%";
        },

        delayState(vValue) {
            return numberValue(vValue) > 0 ? "Error" : "None";
        },

        remainingQuantityState(vValue) {
            return numberValue(vValue) > 0 ? "Warning" : "None";
        },

        formatDate(vValue) {
            if (!vValue || vValue === "00000000") {
                return "";
            }

            if (vValue instanceof Date) {
                return [
                    vValue.getFullYear(),
                    String(vValue.getMonth() + 1).padStart(2, "0"),
                    String(vValue.getDate()).padStart(2, "0")
                ].join("-");
            }

            const sValue = String(vValue);
            if (/^\d{8}$/.test(sValue)) {
                return sValue.slice(0, 4) + "-" + sValue.slice(4, 6) + "-" + sValue.slice(6, 8);
            }

            if (/^\d{4}-\d{2}-\d{2}/.test(sValue)) {
                return sValue.slice(0, 10);
            }

            return sValue;
        },

        formatTime(vValue) {
            if (!vValue || vValue === "000000") {
                return "";
            }

            const sValue = String(vValue);
            if (/^\d{6}$/.test(sValue)) {
                return sValue.slice(0, 2) + ":" + sValue.slice(2, 4) + ":" + sValue.slice(4, 6);
            }

            if (/^\d{2}:\d{2}:\d{2}$/.test(sValue)) {
                return sValue;
            }

            return sValue;
        },

        formatQuantity(vValue, sUnit) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return "";
            }

            const sQuantity = numberValue(vValue).toLocaleString(undefined, {
                maximumFractionDigits: 3
            });
            return sUnit ? sQuantity + " " + sUnit : sQuantity;
        }
    };
});
