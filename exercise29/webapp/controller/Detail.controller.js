sap.ui.define(
    ["sap/ui/core/mvc/Controller",
     "sap/base/strings/formatMessage"
    ],         // 사용할 기능 호출
    (Controller, formatMessage) => {
        // 작동할 로직 구현
        "use strict";

        return Controller.extend("code.d19.exercise29.controller.Detail", {

            formatMessage: formatMessage,

            onInit() {
                let oRouter = this.getOwnerComponent().getRouter();
                let oRoute = oRouter.getRoute("RouteDetail");

                // 이 루트의 패턴이 일치할 때마다 
                // => 웹주소에 detail/{OrderID}에 일치하는 경로가 붙었다.
                // _onPatternMatched가 자동으로 실행되도록 한다.
                oRoute.attachPatternMatched(this._onPatternMatched, this);
            },
            _onPatternMatched ( oEvent ) {
                // debugger;
                let oArgs = oEvent.getParameter("arguments"); // 개발자 도구에 arguments라고 적혀있기 때문에 그대로 작성해야함
                let sOrderID = oArgs.OrderID;
                // /Orders(주문ID)
                let sPath = "/Orders(" + sOrderID + ")";

                // Detail View에 현재 경로를 /Orders(주문ID)로 설정한다.
                // bindElement에 의해 설정된 이후부터는 Detail View에서는
                // 모델의 데이터를 접근할 때, /없이 쓸 경우 /Order(주문ID)에서부터 데이터를
                // 가져오는 것으로 취급된다.
                // 예) <Text text={CustomerID} /> => /Order(주문ID)/CustomerID를 쓴 것과 같다.

                let oView = this.getView();
                oView.bindElement(sPath);

            }
        } );
    }    
);

