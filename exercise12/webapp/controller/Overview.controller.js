sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.d19.exercise12.controller.Overview", {
        onInit() {
        },
        onOpenDialog() {
			// create dialog lazily
			this.pDialog ??= this.loadFragment({
				name: "code.d19.exercise12.view.Dialog"
				/* 원래 ui5.exercise12.view.Dialog라고 적었었음, 
				index.html 들어가서 "code.d19.exercise12": "./" 현재 폴더 뭐라고 했는지 확인 필요 */
			});

			this.pDialog.then((oDialog) => oDialog.open());
		},

		onCloseDialog() {
			// note: We don't need to chain to the pDialog promise, since this event handler
			// is only called from within the loaded dialog itself.
			this.byId("idDialog").close();
		}
    });
});