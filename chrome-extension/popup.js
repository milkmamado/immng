// Popup 스크립트

const statusDiv = document.getElementById('status');
const extractBtn = document.getElementById('extractBtn');
const openAppBtn = document.getElementById('openAppBtn');

const APP_URL = 'https://c1b1e147-d88f-49c7-a031-a4345f1f4a69.lovableproject.com/first-visit';

// 상태 메시지 표시
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// 환자 정보 추출
extractBtn.addEventListener('click', async () => {
  try {
    extractBtn.disabled = true;
    showStatus('환자 정보를 추출하는 중...', 'info');

    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('192.168.1.101')) {
      showStatus('CRM 페이지에서만 사용할 수 있습니다.', 'error');
      extractBtn.disabled = false;
      return;
    }

    // Content script에 메시지 전송
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

    if (response.success) {
      showStatus(`${response.data.name} 환자 정보를 추출했습니다!`, 'success');

      // 데이터 저장
      await chrome.storage.local.set({ 
        patientData: response.data,
        timestamp: Date.now()
      });

      // 환자 관리 시스템 열기
      setTimeout(() => {
        chrome.tabs.create({ url: `${APP_URL}?crm=import` });
        window.close();
      }, 500);
    } else {
      showStatus(response.error || '환자 정보를 찾을 수 없습니다.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('오류가 발생했습니다: ' + error.message, 'error');
  } finally {
    extractBtn.disabled = false;
  }
});

// 환자 관리 시스템 열기
openAppBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: APP_URL });
  window.close();
});

// 페이지 로드 시 현재 탭 확인
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  if (currentTab.url && currentTab.url.includes('192.168.1.101')) {
    showStatus('CRM 페이지가 감지되었습니다. 준비 완료!', 'success');
  } else {
    showStatus('CRM 페이지(192.168.1.101)로 이동하세요.', 'info');
    extractBtn.disabled = true;
  }
});
