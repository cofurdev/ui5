sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, myFormatter, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.d19.exercise14.controller.Overview", {
        onInit() {
        },

        formatter: myFormatter,

        onCustomerChange( oEvent ){
            // sap.m.MessageBox.information("고객을 변경했음!!")
            
            // 변경된 아이템의 정보를 가져온다 =, oListItem은 한 줄에 대한 객체 정보를 가져옴
            var oListItem = oEvent.getParameter("listItem");

            // 이 아이템에 연결된 모델 내용을 가져온다
            // 가져온 모델 정보는 예약 테이블에 전달하기 위함이다
            var oBindingContext = oListItem.getBindingContext();
            
            // 예약 테이블을 가져온다
            var oBookingTable = this.byId("bookingTable");

            // 선택된 고객의 예약정보를 출력하기 위해 예약 테이블에 가져온 모델 정보를 기록한다
            oBookingTable.setBindingContext( oBindingContext );
            
            sap.m.MessageToast.show(oBindingContext.getProperty("CustomerName") + "고객님의 예약 정보를 출력합니다.");

        },

        onFilterCustomers( oEvent ){
            // Filter 객체를 보관할 배열 선언
            var aFilter = [];

            // 사용자가 SearchField에 입력한 검색 조건을 가져온다
            // query 에는 사용자가 입력한 검색조건이 들어있다
            var sQuery = oEvent.getParameter("query");

            // &&(And)는 왼쪽과 오른쪽의 조건들이 모두 참일 때 참으로 결과를 반환하는 논리 연산자
            // ||(Or)는 왼쪽 또는 오른쪽의 고전 중 하나라도 참일 때 참으로 결과를 반환하는 논리 연산자
            // sQuery는 null또는 undefinded가 아니고, 길이가 0보다 큰 문자열일 때만 참이다
            // 사용자가 검색조건을 입력했는지 따져보기 위한 조건문
            if( sQuery && sQuery.length > 0 ){
                // 비교값2가 필요한 경우는 범위로 비교할 때, 예를 들어 From~ To로 "C"부터 "E"까지와 같은 조건일 때
                // aFilter.push( new Filter( 경로이름, 비교방법, 비교값1 ) ); 단일값 비교
                // aFilter.push( new Filter( 경로이름, 비교방법, 비교값1, 비교값2 ) ); 범위값 비교
                // 사용자가 입력한 검색조건이 포함된 고객명만 검색하는 조건을 배열에 추가한다
                aFilter.push( new Filter( "CustomerName", FilterOperator.Contains, sQuery ) );
            }

            // 위에서 만든 aFilter에는 검색기준이 담겨있다. 이 검색기준을 통해서 고객 테이블에 특정 데이터만 출력하기 위해
            // 다음과 같이 고객 테이블에 aFilter를 적용한다.
            var oTable = this.byId("customerTable");
            var oBinding = oTable.getBinding("items"); // Aggregation items는 테이블에 데이터를 취급하는 Aggregation이므로,
                                                       // 이 Aggregation의 Binding 정보를 가져와서 filter를 적용한다.
            oBinding.filter( aFilter );
        }
    });
});