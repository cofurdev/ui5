sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/message/MessageType"
], (Controller, myFormatter, Filter, FilterOperator,JSONModel, MessageBox, MessageType) => {
    "use strict";

    return Controller.extend("code.d19.exam2.review.controller.Main", {

        formatter: myFormatter,

        onInit() {
            var oModel = new JSONModel({
                Input: this._initData()
            });
            var oView = this.getView();
            oView.setModel(oModel, "new");

        },
        _initData(){
            var oI18nModel = this.getOwnerComponent().getModel("i18n");
            var oResourceBundle = oI18nModel.getResourceBundle();
            var sCity = oResourceBundle.getText("cityBusan");
            return{
                ProductName: "",
                Price: 0,
                Currency: "KRW",
                Quantity: 0,
                Unit: "BOX",
                City: {
	                Seoul: false,
	                Busan: true
                },
                Storage: sCity // 부산
            }
            
        },
        onComboBoxSelectionChange(oEvent){
            var oItem = oEvent.getParameter("selectedItem");
            var sKey = oItem.getKey();

            var aFilter = [];
            if (sKey && sKey !== "A") {
                var oFilter = new Filter("StorageCode", FilterOperator.EQ, sKey);
                aFilter.push(oFilter);

            }
            // aggregation items는 현재 {path: '/Products', sorter: {...}}로
            // Model의 데이터를 가져오기 위한 연결정보가 기록되어있다.
            // 그 연결 정보를 가져와서 filter 정보도 추가시키도록 한다.
            
            var oList = this.byId("idList");
            var oBinding = oList.getBinding("items");
            oBinding.filter(aFilter);
        },

        onButtonAddPress(){
            
            // 입력된 값이 올바른지 검사
            var oInputProductName = this.byId("idProductNameInput");
            var sProductName = oInputProductName.getValue();

            if (  sProductName && sProductName.length > 0 ) {
                // 정상, 제품명이 있고 길이가 1자리 이상인 문자열 => 중단하지 않는다.
            } else {
                // 제품명이 없음 => 중단한다.
                MessageBox.error("제품명이 비어있습니다.");
                return;
            }

            // Message Manager에 오류 메세지가 존재하면 중단한다.
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var aMessageData = oMessageManager.getMessageModel().getData();
            var hasError = aMessageData.some( (msg) => msg.type === MessageType.Error );

            if( hasError ) {
                MessageBox.error("에러가 존재합니다.");
                return;
            }

            // 검사가 통과되면 상품 목록에 추가하는 로직을 실행한다.

            // 검사가 통과되면 상품 목록에 추가하는 로직을 실행한다.            
            var oView = this.getView();
            var oNewModel = oView.getModel("new");

            /**
             * 경로 /Input의 데이터를 가져온다.
             * 이 데이터는 다음과 같이 이뤄져 있다. 이 데이터는 oNewProduct 에 전달된다.
             * {
             *      ProductName: "~~~~~",
             *      Price: 1234~~~,
             *      Currency: "KRW",
             *      Quantity: 1234~~~,
             *      City: {
             *          Seoul: true / false
             *          Busan: true / false              
             *      },
             *      Storage: "서울" / "부산"
             * }
             */
            var oNewProduct = oNewModel.getProperty("/Input");

            if(oNewProduct.City.Seoul){
                oNewProduct.Storage = "서울";
                oNewProduct.StorageCode = "S";
            } else if (oNewProduct.City.Busan){
                oNewProduct.Storage = "부산";
                oNewProduct.StorageCode = "B";
            } else {
                oNewProduct.Storage = "?";
                oNewProduct.StorageCode = "";
            }
            
            // 기본 모델을 가져와서 경로 /Products 에 신규 추가한다.
            var oModel = oView.getModel();
            var aProducts = oModel.getProperty("/Products");
            aProducts.push(oNewProduct);

            // 경로 /Products에 새로운 상품 정보가 추가되었으므로,
            // 화면에 반영하기 위해 Model 정보를 새로고침한다.
            oModel.refresh();

            // new 모델의 경로 /Input 에는 입력한 데이터를 초기화한다.
            oNewModel.setProperty("/Input", this._initData());
        },
        onButtonDeletePress(){

            // List에서 사용되는 모델의 제품 목록
            var oView = this.getView();
            var oModel = oView.getModel();
            var aProducts = oModel.getProperty("/Products");

            // List에서 선택한 항목들을 가져온다.
            var oList = oView.byId("idList");
            var aSelectedItems = oList.getSelectedItems();

            // 선택한 항목들 정보를 토대로 aProducts에서 삭제할 데이터를
            // 찾아서 삭제할 예정이다.
            // JSON Model은 데이터가 배열로 이뤄져 있는데,
            // 배열의 데이터를 접근할 때는 Index로 접근한다.
            // 그래서  우리는 삭제할 데이터의 Index를 알아야 하므로,

            // 선택한 항목들마다 연결된 Model 경로에서
            // Index 정보를 가져와 배열에 따로 보관한다.
            var aIndex = [];
            for ( var oItem of aSelectedItems ){
                // getBindingContextPath() : 연결된 Model의 경로를 가져온다.
                var path = oItem.getBindingContextPath();
                console.log("아이템의 경로" + path);
                var index = path.split("/").pop();
                aIndex.push(index);
                
                //배열의 데이터를 내림차순으로 정렬한다.
                var aDescIndex = aIndex.sort((a, b) => b - a);
                for( var index of aDescIndex ){
                    // 삭제할 대상 중 가장 마지막 항목부터 삭제하며 올라간다.
                    aProducts.splice( index, 1 );
                }


                /**
                    // 배열의 데이터를 오름차순으로 정렬한다.
                    aIndex.sort();

                    var deleteCount = 0;
                    for( var index of aIndex ){
                        // 특정 index부터 1개만 삭제하는 문법: splice
                        aProducts.splice( index - deleteCount , 1 );
                        // 삭제할 때마다 index를 앞당기기 위해 count를 증ㅇ가
                        deleteCount ++;
                    }
                */

                // 삭제가 완료되면 화면에 변경된 Model 데이터가 갱신되도록 새로고침한다.
                oModel.refresh();

                // List에 항목을 선택한 정보를 초기화한다.
                oList.removeSelections(true);

            }

        }
    });
});