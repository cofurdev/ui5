sap.ui.define([
   "sap/ui/core/UIComponent",
   "sap/ui/model/json/JSONModel"
], (UIComponent, JSONModel) => {
   "use strict";

   return UIComponent.extend("ui5.walkthrough.Component", {
      metadata : {
         interfaces: ["sap.ui.core.IAsyncContentCreation"],
         manifest: "json"
      },

      init() {
         // call the init function of the parent
         UIComponent.prototype.init.apply(this, arguments);
         // set data model
         const oData = {
            recipient : {
               name : "이채영"
            }
         };
         const oModel = new JSONModel(oData);
         this.setModel(oModel);
        /*  component에 바로 집어넣어서 모든 view에서 사용 가능, 전역 변수와 같은 역할
            원래는 setModel 앞에 getView가 있어서 해당 view에서만 사용 가능한 모델이었음 */
      }
   });
});
