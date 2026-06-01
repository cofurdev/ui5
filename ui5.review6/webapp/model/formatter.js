sap.ui.define([], () => {
    "use strict";

    const formatter = {
        formatInteger(vValue) {
            const nValue = Number(vValue);
            if (Number.isNaN(nValue)) {
                return "0";
            }
            return nValue.toLocaleString("en-US");
        },

        formatDecimal(vValue, iDecimals = 0) {
            const nValue = Number(vValue);
            if (Number.isNaN(nValue)) {
                return "0";
            }
            return nValue.toLocaleString("en-US", {
                minimumFractionDigits: iDecimals,
                maximumFractionDigits: iDecimals
            });
        },

        getOccupancyPercent(fOccupancyRate, iSeatsocc, iSeatsmax) {
            const iMax = Number(iSeatsmax) || 0;
            if (iMax > 0) {
                const iOcc = Number(iSeatsocc) || 0;
                return Math.round((iOcc / iMax) * 100);
            }
            if (fOccupancyRate !== undefined && fOccupancyRate !== null && fOccupancyRate !== "") {
                return Math.min(100, Math.max(0, Number(fOccupancyRate)));
            }
            return 0;
        },

        getSeatPercent(iOcc, iMax) {
            const iMaxSeats = Number(iMax) || 0;
            const iOccSeats = Number(iOcc) || 0;
            return iMaxSeats > 0 ? Math.round((iOccSeats / iMaxSeats) * 100) : 0;
        },

        getOccupancyLevel(fOccupancyRate, iSeatsocc, iSeatsmax) {
            const fPercent = formatter.getOccupancyPercent(fOccupancyRate, iSeatsocc, iSeatsmax);
            if (fPercent >= 90) {
                return "ERROR";
            }
            if (fPercent >= 70) {
                return "WARNING";
            }
            return "SUCCESS";
        },

        getOccupancyState(fOccupancyRate, iSeatsocc, iSeatsmax) {
            const sLevel = formatter.getOccupancyLevel(fOccupancyRate, iSeatsocc, iSeatsmax);
            if (sLevel === "ERROR") {
                return "Error";
            }
            if (sLevel === "WARNING") {
                return "Warning";
            }
            return "Success";
        },

        formatSeatDisplay(iOcc, iMax) {
            return `${formatter.formatInteger(iOcc)} / ${formatter.formatInteger(iMax)}`;
        },

        formatOccupancyDisplay(fOccupancyRate) {
            return `${formatter.formatDecimal(fOccupancyRate, 1)}%`;
        },

        formatFlightType(sFltype) {
            if (sFltype === "X") {
                return "Charter";
            }
            return "Regular";
        },

        getFlightTypeState(sFltype) {
            return sFltype === "X" ? "Warning" : "Success";
        }
    };

    return formatter;
});
