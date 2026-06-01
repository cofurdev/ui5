sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/library",
    "sap/f/library",
    "sap/m/MessageBox"
], (Controller, coreLibrary, fLibrary, MessageBox) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;
    // FCL 화면 비율을 정할 때 쓰는 상수 모음 (예: LayoutType.OneColumn)
    const LayoutType = fLibrary.LayoutType; 

    return Controller.extend("code.d3.orderapproval.controller.Main", {
        onInit() {
            // 화면이 처음 켜질 때 딱 한 번 실행
        },

        onOrderSelect(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                const sStatus = oBindingContext.getProperty("Ordst"); 
                this._updateTimelineStatus(sStatus);
            }
        },

        /* 사용자가 오더 목록에서 체크박스를 체크하거나 해제할 때마다 실행 */
        onSelectionChange(oEvent) {
            // 화면에 있는 테이블 객체를 가져오기
            const oTable = this.byId("orderTable");
            
            // 현재 체크된 줄(Row)들을 배열로 가져와서 길이 확인
            const aSelectedItems = oTable.getSelectedItems();
            const nCount = aSelectedItems.length;

            // i18n 적용
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            // 변경할 텍스트를 담을 빈 변수 선언
            let sText = "";

            // 선택된 갯수에 따라 글자를 다르게 조립
            if (nCount === 0) {
                // 선택을 다 풀어서 0개가 되면 기본 텍스트("선택됨 0건") 사용
                sText = oBundle.getText("textSelectedZero");
            } else {
                // 1개 이상 선택되면 {0} 자리에 nCount(숫자)를 배열로 밀어넣어 조립
                sText = oBundle.getText("textSelectedCount", [nCount]);
            }

            // 조립된 텍스트("선택됨 3건" 등)를 화면의 Text에 전달
            this.byId("selectedCount").setText(sText);
        },

        /* * 1. [행 클릭 이벤트] 
         * 사용자가 왼쪽 테이블에서 특정 생산 오더(행)를 클릭했을 때 실행
         */
        onItemPress(oEvent) {
            // 1-1. 클릭한 그 '줄(Row)'의 데이터를 통째로 가져옴
            const oListItem = oEvent.getParameter("listItem") || oEvent.getSource();
            if (!oListItem) return;

            const oBindingContext = oListItem.getBindingContext();
            
            // i18n 적용
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            if (!oBindingContext) {
                // 클릭한 행의 데이터를 찾을 수 없습니다.
                console.error(oBundle.getText("msgErrorRowData"));
                return;
            }

            // oData 안에 클릭한 오더의 모든 정보(오더번호, 수량, 플랜트 등)가 들어있음
            const oData = oBindingContext.getObject();
            // 우측 상세 화면에 데이터를 뿌려주기 위해 만들어둔 'detail' 모델을 가져옴
            const oDetailModel = this.getView().getModel("detail");
            
            // 공백을 제거한 깔끔한 오더 상태값 (예: "CLRQ")
            const sStatus = oData.Ordst ? oData.Ordst.trim() : "";

            // ---------------------------------------------------------
            // 1-2. 타임라인(상태 흐름도)
            // 기본값은 전부 회색 아이콘 sys-minus로 세팅
            // ---------------------------------------------------------
            let sRelsStatus = ValueState.None, sRelsIcon = "sap-icon://sys-minus", sRelsText = "";
            let sClrqStatus = ValueState.None, sClrqIcon = "sap-icon://sys-minus", sClrqText = "", sClrqTitle = "itemClrq";
            let sTecoStatus = ValueState.None, sTecoIcon = "sap-icon://sys-minus", sTecoText = "";
            
            // 마감 요청(CLRQ)
            const titleClrq = oBundle.getText("itemClrq");
            // 마감 반려(CLRJ)
            const titleClrj = oBundle.getText("itemClrj");
            // 생산 오더 마감 요청이 접수되어 승인 대기 중입니다.
            const textClrq = oBundle.getText("textTimelineClrq");
            // 생산 오더가 최종 마감되었습니다.
            const textTeco = oBundle.getText("textTimelineTeco");
            // 생산 오더 마감 요청이 반려되었습니다.
            const textClrj = oBundle.getText("textTimelineClrj");
            // 현재 오더 상태에 따라 초록색 체크표시나 노란색 경고표시로 표기
            switch (sStatus) {
                case "CLRQ":
                    sRelsStatus = ValueState.Success; sRelsIcon = "sap-icon://accept";
                    sClrqStatus = ValueState.Warning; sClrqIcon = "sap-icon://sys-enter-2"; sClrqText = textClrq; sClrqTitle = titleClrq;
                    break;
                case "TECO":
                    sRelsStatus = ValueState.Success; sRelsIcon = "sap-icon://accept"; 
                    sClrqStatus = ValueState.Success; sClrqIcon = "sap-icon://accept"; sClrqTitle = titleClrq;
                    sTecoStatus = ValueState.Success; sTecoIcon = "sap-icon://complete"; sTecoText = textTeco;
                    break;
                case "CLRJ":
                    sRelsStatus = ValueState.Success; sRelsIcon = "sap-icon://accept";
                    sClrqStatus = ValueState.Error; sClrqIcon = "sap-icon://decline"; sClrqText = textClrj; sClrqTitle = titleClrj;
                    break;
            }

            // ---------------------------------------------------------
            // 1-4. 모델에 데이터 전달
            // setData를 하는 순간, XML 화면에 뚫어놓은 구멍({detail>/...})들에 
            // 데이터가 알아서 쏙쏙 들어가면서 화면이 자동으로 그려짐
            // ---------------------------------------------------------
            oDetailModel.setData({
                // 생산 오더 기본 정보
                Aufnr     : oData.Aufnr,        
                Matnr     : oData.Matnr,        
                Maktx     : oData.Maktx,        
                Werks     : oData.Werks,
                Name1     : oData.Name1,        
                Ordqt     : oData.Ordqt,        
                ActqtIn   : oData.ActqtIn,      
                Totaldfqty: oData.Totaldfqty,   
                ShortQt   : oData.ShortQt,
                Meins     : oData.Meins,      
                Qcomflag  : oData.Qcomflag,     
                Aedat     : oData.Aedat,        
                Aenam     : oData.Aenam,
                Ordst     : oData.Ordst,
                
                // 타임라인 색상 및 아이콘 정보
                RelsStatus: sRelsStatus, RelsIcon: sRelsIcon, RelsText: sRelsText,
                ClrqStatus: sClrqStatus, ClrqIcon: sClrqIcon, ClrqText: sClrqText, ClrqTitle: sClrqTitle,
                TecoStatus: sTecoStatus, TecoIcon: sTecoIcon, TecoText: sTecoText,
                
                // [FCL 화면 열기] 오른쪽 창을 열어서 리스트와 7:3 비율로 출력
                LayoutType: LayoutType.TwoColumnsBeginExpanded,

            });
        },

        /* * 2. [상세 화면 닫기 (X 버튼)] 
         */
        onCloseDetail() {
            const oDetailModel = this.getView().getModel("detail");
            
            // 모델의 LayoutType 값만 'OneColumn'(왼쪽만 100%)으로 바꿈. 
            // 화면이 데이터를 쳐다보고 있다가 알아서 창을 닫아줌
            oDetailModel.setProperty("/LayoutType", LayoutType.OneColumn);
        },

        /* * 3. [전체 화면 토글 (확대/축소 버튼)] 
         */
        onToggleFullScreen() {
            const oDetailModel = this.getView().getModel("detail");
            const sCurrentLayout = oDetailModel.getProperty("/LayoutType");
            
            // 삼항 연산자 (조건 ? 참일때값 : 거짓일때값)
            // 현재 상태가 전체화면이면 -> 7:3 분할 화면으로 돌려놓고
            // 전체화면이 아니면 -> 오른쪽 상세 창을 100% 전체화면으로 키워라
            const sNextLayout = (sCurrentLayout === LayoutType.MidColumnFullScreen)
                              ? LayoutType.TwoColumnsBeginExpanded
                              : LayoutType.MidColumnFullScreen;
                              
            oDetailModel.setProperty("/LayoutType", sNextLayout);
        },

        /* * 4. [마감 반려 버튼 클릭] -> 사유 입력 팝업창 띄우기
         */
        onReject(oEvent) {
            /*
            // ----------------------------------------------------------------------
            // 1. 유효성 검사
            // ----------------------------------------------------------------------
            // 이벤트가 발생한 버튼을 추적하여 현재 줄(Row)의 데이터를 가져옴
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext(); 
        
            // 바인딩된 데이터가 없으면 안전하게 종료
            if (!oContext) {
                return; 
            }

            const oRowData = oContext.getObject(); // 실제 데이터 추출
            // 상태 코드 검사: 이미 마감 완료(TECO)이거나 반려(CLRJ)된 오더인지 확인
            if (oRowData.Ordst === "TECO" || oRowData.Ordst === "CLRJ") {
                // 사용자에게 경고창을 띄워줌
                MessageBox.warning("이미 마감 완료되거나 반려된 오더는 처리할 수 없습니다.");
                return; 
            }
            */
            // ----------------------------------------------------------------------
            // 2. 팝업창 호출
            // ----------------------------------------------------------------------
            const oView = this.getView();

            // 팝업창을 누를 때마다 새로 만들면 앱이 느려짐. 없으면 만들고, 있으면 재사용
            if (!this._pRejectDialog) {
                // Fragment 파일 불러오기
                this._pRejectDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(), 
                    name: "code.d3.orderapproval.view.fragment.RejectDialog", // 팝업 파일 경로
                    controller: this
                }).then((oDialog) => {
                    // 메인 뷰와 팝업창 연결 (메인 뷰의 데이터를 팝업에서도 쓸 수 있게 됨)
                    oView.addDependent(oDialog); 
                    return oDialog;
                });
            }

            // Promise(.then) : "팝업 준비가 다 끝나면 그제서야 화면에 띄워줄게!" (비동기 처리)
            this._pRejectDialog.then((oDialog) => {
                // 이전에 적었던 반려 사유가 남아있지 않게 초기화
                this.byId("taRejectReason").setValue(""); 
                oDialog.open(); // 화면 중앙에 팝업 띄우기
            });
        },

        /* * 5. [팝업창 내부 - 반려 확인 버튼 클릭] 
         */
        onConfirmReject() {
            // 사용자가 입력칸(TextArea)에 적은 글자를 가져옴
            const sReason = this.byId("taRejectReason").getValue();

            // i18n 적용
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            
            // 반려 사유 필수 입력할 수 있도록 처리
            if (!sReason || sReason.trim() === "") {
                // 반려 사유를 반드시 입력해야 합니다.
                sap.m.MessageToast.show(oBundle.getText("msgErrorRequireRejectReason"));
                return;
            }

            // ---------------------------------------------------------
            // [TODO] 백엔드 연동 로직
            // 여기서 OData 모델(this.getView().getModel())의 update() 함수를 써서 
            // ABAP 서버로 상태값(CLRJ)과 사유(sReason)를 전송하게 됩니다.
            // ---------------------------------------------------------
            
            // 전송이 성공했다고 치고 띄우는 알림 메시지
            // 반려 처리되었습니다. 사유: {0}
            sap.m.MessageToast.show("{i18n>msgSuccessReject}", [sReason]);
            
            // 처리 완료 후 선택 해제 + 카운트 리셋
            this.byId("orderTable").removeSelections(true);
            this.getView().getModel("view").setProperty("/selectedCount", 0);
            
            this.byId("rejectDialog").close(); // 처리 끝났으니 팝업창 닫기
        },

        /* * 6. [팝업창 내부 - 취소 버튼 클릭] 
         * 아무 동작 없이 팝업창만 닫기
         */
        onCancelReject() {
            this.byId("rejectDialog").close(); 
        },
        /* * =========================================================
         * [승인 (TECO) 버튼 클릭 이벤트] - OData Batch 적용
         * ========================================================= */
        onApprove() {
            // 1. 테이블과 선택된 데이터 가져오기
            const oTable = this.byId("orderTable");
            const aSelectedItems = oTable.getSelectedItems(); // 체크된 행(Row)들의 배열
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            // 아무것도 선택하지 않고 누른 경우
            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show(oBundle.getText("msgErrorSelectAtLeastOne"));
                return;
            }

            // 2. OData 모델 가져오기
            const oModel = this.getView().getModel();

            // 3. Batch 설정
            oModel.setUseBatch(true); // OData 모델을 Batch 모드로 켬
            oModel.setDeferredGroups(["bulkApproveGroup"]); // 'bulkApproveGroup'이라는 이름의 그룹 하나 만듦

            // 4. 반복문(forEach)을 돌면서 택배 박스에 명령들 담기
            aSelectedItems.forEach((oItem) => {
                // 선택된 각각의 데이터 경로 (예: /OrderApprovalSet('PD30000012'))
                const sPath = oItem.getBindingContextPath(); 
                
                // 현재 선택된 행의 오더 번호를 정확히 추출합니다.
                const sAufnr = oItem.getBindingContext().getProperty("Aufnr"); 

                // 백엔드로 보낼 데이터에 '오더 번호'를 포함
                const oPayload = {
                    Aufnr: sAufnr,
                    Ordst: "TECO" 
                };

                console.log("Batch에 담기는 데이터:", oPayload); // 디버깅용 로그

                // update() 함수를 쓰지만, groupId를 지정했기 때문에 지금 바로 서버로 날아가지 않고 그룹에 차곡차곡 쌓임
                oModel.update(sPath, oPayload, {
                    groupId: "bulkApproveGroup"
                });
            });

            // 5. 화면에 로딩바 띄우기
            sap.ui.core.BusyIndicator.show(0);

            // 6. 그룹을 서버로 한 방에 전송
            oModel.submitChanges({
                groupId: "bulkApproveGroup",
                success: () => {
                    // 통신이 끝나면 로딩바 숨김
                    sap.ui.core.BusyIndicator.hide();
                    
                    // 성공 메시지 띄우기 (예: "총 3건이 일괄 승인되었습니다.")
                    sap.m.MessageToast.show(`총 ${aSelectedItems.length}건이 승인되었습니다.`);
                    
                    // 체크박스 선택 초기화 및 테이블 데이터 새로고침
                    oTable.removeSelections(true); 
                    oModel.refresh(); 
                },
                error: (oError) => {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("승인 처리 중 서버 오류가 발생했습니다.");
                }
            });
        }
    });
});