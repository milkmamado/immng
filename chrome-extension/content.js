// CRM 페이지에서 실행되는 스크립트

// 환자 정보 추출 함수
function extractPatientData() {
  const getValue = (id) => {
    const el = document.querySelector('#' + id);
    return el?.value?.trim() || '';
  };

  const getSelectedText = (id) => {
    const select = document.querySelector('#' + id);
    if (!select) return '';
    const option = select.options[select.selectedIndex];
    return option?.text?.trim() || '';
  };

  const data = {
    name: getValue('pagetabs_3013_4_bs_clnt_nm'),
    customer_number: getValue('pagetabs_3013_4_bs_clnt_no'),
    resident_number_masked: getValue('pagetabs_3013_4_bs_rrn'),
    phone: getValue('pagetabs_3013_4_bs_hp_telno'),
    gender: getValue('pagetabs_3013_4_bs_sex'),
    age: getValue('pagetabs_3013_4_bs_spec_age'),
    address: (getValue('pagetabs_3013_4_bs_up_addr1') + ' ' + getValue('pagetabs_3013_4_bs_ref_addr1')).trim(),
    visit_motivation: getSelectedText('pagetabs_3013_4_cmhs_motv_cd'),
    diagnosis_category: getSelectedText('pagetabs_3013_4_dgns_cd'),
    diagnosis_detail: getSelectedText('pagetabs_3013_4_dgns_detl_cd'),
    hospital_category: getSelectedText('pagetabs_2919_4_up_org_hspt_cd'),
    hospital_branch: getSelectedText('pagetabs_2919_4_org_hspt_cd'),
    crm_memo: getValue('pagetabs_3013_4_cms_call_memo')
  };

  return data;
}

// 검색 실행 함수
function executeSearch(searchData) {
  const branchSelect = document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_bnch_cd');
  const nameInput = document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_clnt_nm');
  const phoneInput = document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_hp_telno');
  const searchBtn = document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_btn_srch01');

  if (branchSelect) branchSelect.value = '';
  if (nameInput) nameInput.value = searchData.name || '';
  if (phoneInput) phoneInput.value = searchData.phone || '';
  if (searchBtn) searchBtn.click();

  return true;
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractPatientData();
    
    if (!data.name) {
      sendResponse({ 
        success: false, 
        error: '환자 정보를 찾을 수 없습니다.\n환자를 더블클릭하여 상세정보를 표시한 후 다시 시도하세요.' 
      });
    } else {
      sendResponse({ success: true, data: data });
    }
    return true;
  }

  if (request.action === 'executeSearch') {
    const success = executeSearch(request.searchData);
    sendResponse({ success: success });
    return true;
  }
});

// 페이지 로드 시 자동 검색 확인
window.addEventListener('load', () => {
  chrome.storage.local.get(['pendingSearch'], (result) => {
    if (result.pendingSearch) {
      executeSearch(result.pendingSearch);
      chrome.storage.local.remove('pendingSearch');
    }
  });
});
