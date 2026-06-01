sap.ui.define(
    [ "sap/ui/core/library" ],
    function(coreLibrary) {
        "use strict";
        
        var ValueState = coreLibrary.ValueState;
        return {
            quantityText( quantity ){
            
                if ( quantity >= 3000 ){
                    // quantity의 값이 3000이상이라면,
                    return "많음";
                    
                } else if ( quantity < 1000 ) {
                    // quantity의 값이 1000미만이라면,
                    return "부족";
                } 
                
                return "보통";
            },
            quantityState( quantity ) {
               if ( quantity >= 3000 ){
                    // quantity의 값이 3000이상이라면,
                    return ValueState.Success;
                    
                } else if ( quantity < 1000 ) {
                    // quantity의 값이 1000미만이라면,
                    return ValueState.Error;
                }

                return ValueState.Information;

            }
        }
    }
)