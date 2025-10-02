import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Home, 
  Heart, 
  Users, 
  ClipboardCheck, 
  Calendar,
  BarChart3,
  Search,
  Filter,
  Plus,
  AlertCircle,
  TrendingUp
} from "lucide-react";

export default function UserManual() {
  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 메뉴얼</h1>
            <p className="text-gray-600">면력한방병원 환자 관리 시스템 사용 가이드</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 시스템 소개 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              시스템 소개
            </CardTitle>
            <CardDescription>환자 관리 시스템의 전체 구조를 이해해보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                면력한방병원 환자 관리 시스템은 초진 상담부터 일별 관리, 통계 분석까지 
                환자 관리의 전 과정을 효율적으로 지원하는 통합 시스템입니다.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 핵심 포인트:</strong> 모든 데이터는 자동으로 저장되며, 
                  각 메뉴는 실시간으로 연동됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 대시보드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              1. 대시보드
            </CardTitle>
            <CardDescription>전체 환자 현황을 한눈에 파악하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 주요 기능</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>전체 환자:</strong> 시스템에 등록된 총 환자 수를 표시합니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>이탈 리스크 환자:</strong> 아웃위기/아웃 상태인 환자 수를 표시합니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>당월 현재 매출:</strong> 이번 달 수납 완료된 총 금액을 확인할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>이탈 리스크 환자 리스트:</strong> 관리가 필요한 환자 목록을 바로 확인할 수 있습니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 초진관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              2. 초진관리
            </CardTitle>
            <CardDescription>신규 환자 등록과 초진 상담 관리</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  신규 환자 등록하기
                </h4>
                <ol className="space-y-2 text-gray-700 ml-4">
                  <li>1. 우측 상단 <Badge variant="default">환자 등록</Badge> 버튼 클릭</li>
                  <li>2. <strong>필수 정보</strong> 입력:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• <strong>차트 번호:</strong> 병원 차트 번호 입력</li>
                      <li>• <strong>유입/실패:</strong> 환자 유입 상태 선택</li>
                      <li>• <strong>입원/외래:</strong> 방문 유형 선택</li>
                      <li>• <strong>환자명, 생년월일, 연락처</strong></li>
                      <li>• <strong>진단명:</strong> 드롭다운에서 선택 (췌장암, 유방암 등)</li>
                      <li>• <strong>담당 매니저:</strong> 직접 입력 (자동 선택 아님)</li>
                    </ul>
                  </li>
                  <li>3. <strong>추가 정보</strong> (선택):
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 이전 병원, 주치의 정보</li>
                      <li>• 상담 내용, 메모</li>
                      <li>• 보호자 정보</li>
                    </ul>
                  </li>
                  <li>4. <Badge variant="default">등록</Badge> 버튼으로 완료</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  환자 검색 및 필터링
                </h4>
                <p className="text-gray-700 mb-2">검색창에서 다음 정보로 환자를 찾을 수 있습니다:</p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li>• 환자명 (예: "김민수")</li>
                  <li>• 차트번호 (예: "C-2025-401")</li>
                  <li>• 담당매니저 이름 (예: "권은솔")</li>
                  <li>• 주치의 이름 (양방/한방)</li>
                  <li>• 이전병원 (예: "서울대병원")</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 관리 환자 리스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              3. 관리 환자 리스트
            </CardTitle>
            <CardDescription>모든 환자의 상세 정보를 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📋 환자 정보 실시간 수정</h4>
                <ol className="space-y-2 text-gray-700 ml-4">
                  <li>1. 환자 목록에서 수정할 환자 행 클릭</li>
                  <li>2. 상세 정보 팝업에서 각 필드를 직접 클릭하여 수정</li>
                  <li>3. 수정 사항은 <strong>실시간으로 자동 저장</strong>됩니다</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-3">
                  <p className="text-sm text-green-900">
                    <strong>💡 편의 기능:</strong> 별도의 저장 버튼 없이 각 필드를 수정하면 
                    즉시 반영되어 다른 모든 메뉴에서도 바로 확인할 수 있습니다.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔄 관리 상태 변경</h4>
                <p className="text-gray-700 mb-2">환자의 관리 상태를 변경하면 다음과 같이 처리됩니다:</p>
                <ul className="space-y-3 text-gray-700 ml-4">
                  <li>
                    <strong>• 관리 중:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 일반적인 관리 상태</li>
                      <li>- 일별 환자 관리 현황에 표시됨</li>
                      <li>- 통계에 정상 관리 환자로 집계됨</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 아웃위기:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 14일 이상 연락 없는 환자 자동 분류</li>
                      <li>- 이탈 리스크 관리 페이지에 표시됨</li>
                      <li>- 대시보드 이탈 리스크 환자 수에 포함됨</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 아웃:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 21일 이상 연락 없는 환자 자동 분류</li>
                      <li>- 이탈 리스크 관리 페이지에 표시됨</li>
                      <li>- 통계 관리의 아웃 환자 수에 집계됨</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 상태악화:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 환자 건강 상태 악화 시 표시</li>
                      <li>- 특별 관리가 필요한 환자로 분류됨</li>
                      <li>- 일별 관리에서 제외됨</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 치료종료:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 치료가 완전히 종료된 환자</li>
                      <li>- 일별 관리에서 제외됨</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 사망:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 환자 사망 시 표시</li>
                      <li>- 일별 관리에서 제외됨</li>
                    </ul>
                  </li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-3">
                  <p className="text-sm text-yellow-900">
                    <strong>💡 중요:</strong> 상태악화, 치료종료, 사망 상태의 환자는 일별 관리에서 제외됩니다. 
                    다시 관리 상태를 <strong>"관리 중"</strong>으로 변경하면 일별 환자 관리 현황에 다시 표시되어 
                    정상적인 일별 관리가 가능합니다.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💊 치료 계획 관리</h4>
                <p className="text-gray-700 mb-2">환자 상세 페이지에서 다음을 관리할 수 있습니다:</p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>• 치료 계획 추가:</strong> 치료 상세 내용과 치료 금액 기록
                  </li>
                  <li>
                    <strong>• 수납 관리:</strong> 치료비 결제 완료 체크 및 결제일 기록
                  </li>
                  <li>
                    <strong>• 월평균 일수:</strong> 입원/외래 월평균 일수 자동 계산
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💊 치료 계획 관리</h4>
                <p className="text-gray-700 mb-2">환자 상세 페이지에서 다음을 관리할 수 있습니다:</p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>• 치료 계획 추가:</strong> 치료 상세 내용과 치료 금액 기록
                  </li>
                  <li>
                    <strong>• 수납 관리:</strong> 치료비 결제 완료 체크 및 결제일 기록
                  </li>
                  <li>
                    <strong>• 월평균 일수:</strong> 입원/외래 월평균 일수 자동 계산
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 일별 환자 관리 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              4. 일별 환자 관리 현황
            </CardTitle>
            <CardDescription>매일의 환자 상태를 캘린더로 추적하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📅 일별 상태 기록하기</h4>
                <ol className="space-y-2 text-gray-700 ml-4">
                  <li>1. 상단에서 월 선택 (이전/다음 월 이동 가능)</li>
                  <li>2. 환자 리스트에서 상태를 기록할 환자의 날짜 칸 클릭</li>
                  <li>3. 드롭다운에서 해당 날짜 환자 상태 선택:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• <Badge className="bg-blue-500">입원</Badge> - 신규 입원</li>
                      <li>• <Badge className="bg-purple-500">재입원</Badge> - 재입원 상태</li>
                      <li>• <Badge className="bg-green-500">외래</Badge> - 외래 진료</li>
                      <li>• <Badge className="bg-yellow-500">낮병동</Badge> - 낮병동 이용</li>
                      <li>• <Badge className="bg-orange-500">전화F/U</Badge> - 전화 상담</li>
                      <li>• <Badge className="bg-gray-500">퇴원</Badge> - 퇴원</li>
                    </ul>
                  </li>
                  <li>4. 메모 란에 특이사항 입력 가능</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">👤 환자 활동 통계 보기</h4>
                <p className="text-gray-700 mb-2">
                  환자 이름을 클릭하면 해당 환자의 월별 활동 통계를 확인할 수 있습니다:
                </p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li>• 총 입원 일수 (입원 + 재입원)</li>
                  <li>• 외래 방문 일수</li>
                  <li>• 낮병동 이용 일수</li>
                  <li>• 전화 상담 횟수</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 관리 상태 자동 업데이트</h4>
                <p className="text-gray-700 mb-2">
                  환자의 마지막 방문/연락 후 경과 일수에 따라 관리 상태가 자동으로 변경됩니다:
                </p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>• 아웃위기 (14일 이상):</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 마지막 일별 체크 후 14일 이상 경과</li>
                      <li>- 이탈 리스크 관리 페이지로 자동 이동</li>
                      <li>- 일별 관리 현황에서는 보이지 않음</li>
                    </ul>
                  </li>
                  <li>
                    <strong>• 아웃 (21일 이상):</strong>
                    <ul className="ml-4 mt-1">
                      <li>- 마지막 일별 체크 후 21일 이상 경과</li>
                      <li>- 이탈 리스크 관리 페이지로 자동 이동</li>
                      <li>- 통계의 아웃 환자 수에 포함됨</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 활용 팁:</strong> 매일 아침 전날 환자들의 상태를 입력하는 습관을 들이면, 
                  환자 관리 현황을 정확하게 추적할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이탈 리스크 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              5. 이탈 리스크 관리
            </CardTitle>
            <CardDescription>관리가 필요한 환자를 자동으로 파악하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚠️ 리스크 판단 기준</h4>
                <p className="text-gray-700 mb-2">시스템이 자동으로 다음 기준에 따라 환자를 분류합니다:</p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• <strong>아웃위기 (14일+):</strong> 마지막 일별 체크 후 14일 이상 경과</li>
                  <li>• <strong>아웃 (21일+):</strong> 마지막 일별 체크 후 21일 이상 경과</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📞 재연락 관리</h4>
                <ol className="space-y-2 text-gray-700 ml-4">
                  <li>1. 리스크 환자 리스트에서 환자 카드 확인</li>
                  <li>2. <strong>재연락 완료</strong> 체크박스 클릭</li>
                  <li>3. 메모 영역에 재연락 내용 작성 후 저장</li>
                  <li>4. <Badge variant="default">관리 중 복귀</Badge> 버튼 클릭</li>
                </ol>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-sm text-green-900">
                  <strong>✅ 관리 중 복귀 효과:</strong> 관리 중 복귀 버튼을 클릭하면 
                  환자가 <strong>일별 환자 관리 현황</strong> 페이지에 다시 추가되어 
                  정상적인 일별 관리를 계속할 수 있습니다.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-900">
                  <strong>⚠️ 중요:</strong> 이탈 리스크가 높은 환자는 조기에 연락하여 
                  재방문을 유도하는 것이 환자 유지율을 높이는 핵심입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              6. 통계 관리
            </CardTitle>
            <CardDescription>매출과 환자 현황을 분석하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📈 주요 통계 지표</h4>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>• 총 관리 환자:</strong> 현재 관리 중인 전체 환자 수
                  </li>
                  <li>
                    <strong>• 총 매출:</strong> 선택한 월의 실제 결제 완료된 금액 합계
                  </li>
                  <li>
                    <strong>• 평균 객단가:</strong> 총 매출 ÷ 총 관리 환자
                  </li>
                  <li>
                    <strong>• 아웃 환자:</strong> 관리 상태가 "아웃"인 환자 수
                  </li>
                  <li>
                    <strong>• 유입률 (초진상담):</strong> 해당 월에 신규로 유입된 초진 환자 수
                  </li>
                  <li>
                    <strong>• 재진관리비율:</strong> 전월 초진 환자 중 당월에 활동한 환자 비율
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  관리 기간별 환자 현황
                </h4>
                <p className="text-gray-700 mb-2">환자의 관리 기간에 따라 분류됩니다:</p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li>• <strong>1개월 이상 관리:</strong> 초진일로부터 1개월 이상 지속 관리 중인 환자</li>
                  <li>• <strong>3개월 이상 관리:</strong> 초진일로부터 3개월 이상 지속 관리 중인 환자</li>
                  <li>• <strong>6개월 이상 관리:</strong> 초진일로부터 6개월 이상 지속 관리 중인 환자</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  기간/매니저 선택
                </h4>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• <strong>월 선택:</strong> 최근 12개월 중 조회할 월 선택</li>
                  <li>• <strong>매니저 선택 (마스터/관리자만):</strong>
                    <ul className="ml-4 mt-1">
                      <li>- "전체": 모든 매니저의 통합 통계</li>
                      <li>- 개별 매니저: 특정 매니저의 통계만 조회</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                <p className="text-sm text-purple-900">
                  <strong>📊 데이터 활용:</strong> 월별 통계를 비교하여 매출 추이와 
                  환자 관리 효율성을 파악하고 개선점을 찾을 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
