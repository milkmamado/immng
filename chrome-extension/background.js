// Background Service Worker

// 확장 프로그램 설치 시
chrome.runtime.onInstalled.addListener(() => {
  console.log('CRM 환자 정보 연동 확장 프로그램이 설치되었습니다.');
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openApp') {
    chrome.tabs.create({
      url: 'https://c1b1e147-d88f-49c7-a031-a4345f1f4a69.lovableproject.com/first-visit?crm=import'
    });
  }
  return true;
});
