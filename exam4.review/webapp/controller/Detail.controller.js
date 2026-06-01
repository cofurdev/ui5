sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/base/strings/formatMessage",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/type/Currency"
],(Controller, formatMessage, JSONModel, CurrencyType)=>{
    "use strict";


    return Controller.extend("code.d19.exam4.review.controller.Detail",{
        formatMessage: formatMessage,
        formatter: {
            discountText( iDiscount ){
                return iDiscount * 100;
            },
            calcAmount( fUnitPrice, iQuantity, fDiscount,  sCurrency){
                // 가격 * 수량 * ( 1 - 할인율 )
                // 반올림 소수점 3자리에서 반올림해서 소수 2번째 자리까지 보이도록 한다.
                var fAmount = fUnitPrice * iQuantity * (1 - fDiscount );
                // 소수점을 무조건 없애고 반올림하기 때문에,
                // 소수 2번째 자리까지 보존하려면 100을 곱해야 한다.
                // 반올림이 끝나면 소수 2번째 자리로 되돌리기 위해 100을 나눠야 한다.
                fAmount = Math.round( fAmount * 100 ) / 100
                
                var oCurrencyType = new CurrencyType({
                    showMeasure: false
                });

                var sFormattedAmount = oCurrencyType.formatValue( [ fAmount, sCurrency ], "string" );
                
                return sFormattedAmount;
            }
        },
        onInit(){
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();
            var oRoute = oRouter.getRoute("RouteDetail")

            oRoute.attachPatternMatched( this._onPatternMatched, this );
            
            var oModel = new JSONModel({
                Currency: "EUR",
                Unit: "EA"
            });

            var oView = this.getView();
            oView.setModel(oModel,"view");
        },
        _onPatternMatched( oEvent ){
            // Browser에 적힌 URL이 Detail View를 호출하는 pattern일 경우
            // 매번 이 함수가 자동으로 호출되도록 onInit()에서 설정해두었다.
            var oArgs = oEvent.getParameter("arguments");
            var sOrderID = oArgs.OrderID;

            // 모델 경로 /Orders(key)로 접근 시 특정 주문 데이터로 접근할 수 있다.
            var sPath = `/Orders(${sOrderID})`;

            // Detail View의 모델에 접근할 때 전달된 경로를 기준으로 데이터를 접근하도록 한다.
            var oView = this.getView();
            oView.setBusy(true);
            oView.bindElement({
                path: sPath,
                events:{
                    dataRequested(){
                        oView.setBusy(true);
                    },
                    dataReceived(){
                        oView.setBusy(false);
                    }              
                },
                parameters: {
                    expand: 'Customer, Employee'
                }  
            });

        }
    });
})