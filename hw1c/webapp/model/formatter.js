sap.ui.define([], function() {

    "use strict";

    return {
        
        // 성별 코드 "M"일 경우 남성, 성별 코드 "F"일 경우 여성으로 표시한다.
        genderText( sGender ) {
            switch ( sGender ) {
                case "M": return "남성";
                case "F": return "여성";
                default: return "성별이 입력되지 않음";
            }
        },
        
        typeText( sType ) {
            switch ( sType ) {
                case "game": return "게임";
                case "book": return "책";
                case "clothes": return "옷";
                case "keyboard": return "키보드";
                default: return "상품 정보가 입력되지 않음";
            }

        }

    };

});