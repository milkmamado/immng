import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  Home, 
  Heart, 
  Users, 
  ClipboardCheck, 
  Calendar,
  BarChart3,
  Search,
  Filter,
  Save,
  Plus,
  AlertCircle
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
            <p className="text-gray-600">면력한방병원 환자 관리 시스템 완벽 가이드</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide">
            <BookOpen className="w-4 h-4 mr-2" />
            사용 가이드
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            자주 묻는 질문
          </TabsTrigger>
          <TabsTrigger value="tips">
            <Lightbulb className="w-4 h-4 mr-2" />
            팁 & 노하우
          </TabsTrigger>
        </TabsList>

        {/* 사용 가이드 */}
        <TabsContent value="guide" className="space-y-6 mt-6">
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
                      <span><strong>전체 환자 수:</strong> 현재 관리 중인 총 환자 수를 표시합니다</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>이번 달 신규 환자:</strong> 당월 새롭게 유입된 환자 수를 확인할 수 있습니다</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>이탈 위험 환자:</strong> 관리가 필요한 환자를 자동으로 감지합니다</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>미수금 현황:</strong> 결제가 완료되지 않은 환자를 추적합니다</span>
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
                        <li>• 환자명, 생년월일, 연락처</li>
                        <li>• 진단명 (췌장암, 유방암 등)</li>
                        <li>• 담당 매니저 (자동으로 본인이 선택됨)</li>
                      </ul>
                    </li>
                    <li>3. <strong>추가 정보</strong> (선택):
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• 이전 병원, 주치의 정보</li>
                        <li>• 상담 내용, 메모</li>
                        <li>• 보호자 정보</li>
                      </ul>
                    </li>
                    <li>4. <Badge variant="default">저장</Badge> 버튼으로 완료</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <p className="text-sm text-yellow-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>주의:</strong> 환자번호(P-2025-XXX)는 자동으로 생성됩니다. 
                      중복 등록을 방지하기 위해 저장 전 환자명과 연락처를 다시 한번 확인하세요.
                    </span>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    환자 검색 및 필터링
                  </h4>
                  <p className="text-gray-700 mb-2">검색창에서 다음 정보로 환자를 찾을 수 있습니다:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• 환자명 (예: "김민수")</li>
                    <li>• 환자번호 (예: "P-2025-401")</li>
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
                  <h4 className="font-semibold text-gray-900 mb-2">📋 환자 정보 수정</h4>
                  <ol className="space-y-2 text-gray-700 ml-4">
                    <li>1. 환자 목록에서 수정할 환자 행 클릭</li>
                    <li>2. 상세 정보 팝업에서 <Badge variant="outline">수정</Badge> 버튼 클릭</li>
                    <li>3. 필요한 정보 수정 후 <Badge variant="default">저장</Badge></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">💊 입원/치료 기록 관리</h4>
                  <p className="text-gray-700 mb-2">환자 상세 페이지에서 다음을 관리할 수 있습니다:</p>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li>
                      <strong>• 입원 사이클:</strong> 입원일, 퇴원일, 입원 유형(입원/낮병동) 기록
                    </li>
                    <li>
                      <strong>• 치료 계획:</strong> 치료비, 결제 상태 관리
                    </li>
                    <li>
                      <strong>• 환자 노트:</strong> 특이사항, 상담 내용 기록
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <p className="text-sm text-green-900">
                    <strong>💡 팁:</strong> 환자 정보는 실시간으로 다른 모든 메뉴에 반영됩니다. 
                    정보 수정 시 별도의 동기화 작업이 필요하지 않습니다.
                  </p>
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
                    <li>1. 캘린더에서 날짜 선택 (기본: 오늘)</li>
                    <li>2. 환자 리스트에서 상태를 기록할 환자 선택</li>
                    <li>3. 해당 날짜에 환자 상태 선택:
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• <Badge className="bg-blue-500">입원</Badge> - 병원에 입원 중</li>
                        <li>• <Badge className="bg-purple-500">재원</Badge> - 재입원 상태</li>
                        <li>• <Badge className="bg-green-500">외래</Badge> - 외래 진료</li>
                        <li>• <Badge className="bg-yellow-500">낮병동</Badge> - 낮병동 이용</li>
                        <li>• <Badge className="bg-orange-500">전화F/U</Badge> - 전화 상담</li>
                        <li>• <Badge className="bg-gray-500">퇴원</Badge> - 퇴원</li>
                      </ul>
                    </li>
                    <li>4. 필요시 메모 추가 후 저장</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📊 상세 정보 보기</h4>
                  <p className="text-gray-700 mb-2">환자명을 클릭하면 다음 정보를 확인할 수 있습니다:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• <strong>입원일수:</strong> 입원 상태 기록의 총 일수</li>
                    <li>• <strong>외래방문:</strong> 외래 진료 횟수</li>
                    <li>• <strong>낮병동:</strong> 낮병동 이용 일수</li>
                    <li>• <strong>전화상담:</strong> 전화 F/U 횟수</li>
                    <li>• <strong>최근 활동:</strong> 마지막 방문/상담 날짜</li>
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
                  <p className="text-gray-700 mb-2">다음 조건에 해당하는 환자가 자동으로 표시됩니다:</p>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li>• <strong>7일 이상 연락 없음:</strong> 마지막 방문/상담 후 7일 경과</li>
                    <li>• <strong>14일 이상 연락 없음:</strong> 더욱 주의가 필요한 환자</li>
                    <li>• <strong>30일 이상 연락 없음:</strong> 이탈 위험이 매우 높은 환자</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📞 재연락 관리</h4>
                  <ol className="space-y-2 text-gray-700 ml-4">
                    <li>1. 리스크 환자 리스트에서 환자 선택</li>
                    <li>2. <Badge variant="default">재연락 완료</Badge> 버튼 클릭</li>
                    <li>3. 재연락 내용 메모 작성</li>
                    <li>4. 저장하면 해당 환자가 리스트에서 제거됩니다</li>
                  </ol>
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
                      <strong>• 유입률:</strong> 해당 월에 신규로 유입된 초진 환자 수
                    </li>
                    <li>
                      <strong>• 재진관리비율:</strong> 전월 초진 환자 중 당월에 활동한 환자 비율
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📊 상태별 분포 (일수 기준)</h4>
                  <p className="text-gray-700 mb-2">선택한 월 동안 각 상태의 <strong>총 일수</strong>를 표시합니다:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• <strong>입원:</strong> 입원 + 재원 상태로 기록된 총 일수</li>
                    <li>• <strong>외래:</strong> 외래 진료로 기록된 총 일수</li>
                    <li>• <strong>낮병동:</strong> 낮병동 이용 총 일수</li>
                    <li>• <strong>전화F/U:</strong> 전화 상담 총 횟수</li>
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
                        <li>- 특정 매니저: 해당 매니저의 개별 통계</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                  <p className="text-sm text-purple-900">
                    <strong>💡 분석 팁:</strong> 재진관리비율이 70% 이상이면 양호한 수준입니다. 
                    낮은 경우 이탈 리스크 관리를 강화하세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                자주 묻는 질문
              </CardTitle>
              <CardDescription>궁금한 점을 빠르게 해결하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-left">
                    Q. 환자 정보를 수정했는데 다른 메뉴에 반영이 안 돼요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      환자 정보는 실시간으로 모든 메뉴에 자동 반영됩니다. 
                      만약 반영이 안 된다면 다음을 확인해주세요:
                    </p>
                    <ol className="space-y-1 ml-4">
                      <li>1. 수정 후 <strong>저장</strong> 버튼을 클릭했는지 확인</li>
                      <li>2. 페이지를 새로고침 (F5)</li>
                      <li>3. 그래도 안 되면 로그아웃 후 다시 로그인</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-left">
                    Q. 일별 상태를 잘못 기록했어요. 어떻게 수정하나요?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      일별 환자 관리 현황에서 수정할 수 있습니다:
                    </p>
                    <ol className="space-y-1 ml-4">
                      <li>1. 해당 날짜를 캘린더에서 선택</li>
                      <li>2. 환자 리스트에서 수정할 환자 찾기</li>
                      <li>3. 이미 기록된 상태는 다시 클릭하면 <strong>수정 모드</strong>로 전환됩니다</li>
                      <li>4. 올바른 상태를 선택하고 저장</li>
                    </ol>
                    <p className="mt-2 text-sm bg-yellow-50 p-2 rounded">
                      💡 잘못된 기록을 완전히 삭제하려면 환자 상세 페이지에서 해당 기록을 삭제할 수 있습니다.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-left">
                    Q. 통계 관리에서 매출이 0원으로 나와요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      통계의 매출은 <strong>실제 결제가 완료된 금액</strong>만 집계됩니다. 
                      0원으로 표시되는 경우:
                    </p>
                    <ul className="space-y-1 ml-4">
                      <li>• 해당 월에 결제 완료된 치료 계획이 없는 경우</li>
                      <li>• 치료 계획은 등록했지만 <strong>"결제 완료"</strong> 체크를 하지 않은 경우</li>
                    </ul>
                    <p className="mt-2">
                      <strong>해결 방법:</strong> 관리 환자 리스트 → 환자 선택 → 치료 계획에서 
                      결제 완료 여부를 체크해주세요.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-left">
                    Q. 검색이 안 되는 환자가 있어요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      검색이 안 되는 경우 다음을 확인해주세요:
                    </p>
                    <ul className="space-y-1 ml-4">
                      <li>• 환자의 <strong>유입 상태</strong>가 "유입"인지 확인 (아웃, 사망 등은 검색 제외)</li>
                      <li>• 담당 매니저가 본인으로 지정되어 있는지 확인</li>
                      <li>• 검색어의 띄어쓰기 확인 (예: "김민수" vs "김 민수")</li>
                      <li>• 환자번호는 정확한 형식으로 검색 (예: "P-2025-401")</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-left">
                    Q. 이탈 리스크 환자로 표시된 환자에게 연락했는데 리스트에서 안 없어져요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      이탈 리스크에서 제거하는 방법:
                    </p>
                    <ol className="space-y-1 ml-4">
                      <li>1. <strong>방법 A:</strong> 일별 환자 관리 현황에서 해당 환자의 최근 상태 기록 
                        (입원, 외래, 전화F/U 등)</li>
                      <li>2. <strong>방법 B:</strong> 이탈 리스크 관리 페이지에서 
                        "재연락 완료" 버튼 클릭 후 메모 저장</li>
                    </ol>
                    <p className="mt-2 text-sm bg-blue-50 p-2 rounded">
                      💡 두 방법 모두 "마지막 활동 날짜"를 업데이트하여 리스크 판단 기준을 리셋합니다.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-left">
                    Q. 입원일수가 실제와 다르게 표시돼요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      입원일수는 <strong>일별 상태 기록</strong>을 기준으로 계산됩니다:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>• <strong>계산 방법:</strong> "입원" 또는 "재원" 상태로 기록된 <strong>총 날짜 수</strong></li>
                      <li>• <strong>예시:</strong> 9월 1일, 9월 5일, 9월 10일에 입원 기록 → 3일</li>
                    </ul>
                    <p className="mt-2">
                      <strong>정확한 입원일수를 표시하려면:</strong> 입원 기간 동안 
                      매일 "입원" 상태를 기록해야 합니다. 퇴원일에는 "퇴원"을 기록하세요.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger className="text-left">
                    Q. 재진관리비율이 무엇인가요?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      재진관리비율은 <strong>환자 유지 성과</strong>를 나타내는 지표입니다:
                    </p>
                    <div className="bg-purple-50 p-3 rounded my-2">
                      <p className="font-medium">계산 공식:</p>
                      <p className="text-sm mt-1">
                        재진관리비율 = (전월 초진 환자 중 당월에 활동한 환자 수) ÷ (전월 초진 환자 수) × 100
                      </p>
                    </div>
                    <p className="mb-2"><strong>예시 (9월 통계):</strong></p>
                    <ul className="space-y-1 ml-4 text-sm">
                      <li>• 8월에 초진한 환자: 4명</li>
                      <li>• 이 중 9월에 활동(방문/상담)한 환자: 4명</li>
                      <li>• 재진관리비율: 4 ÷ 4 × 100 = <strong>100%</strong></li>
                    </ul>
                    <p className="mt-2 text-sm bg-green-50 p-2 rounded">
                      💡 <strong>목표:</strong> 70% 이상 유지가 이상적입니다. 낮은 경우 이탈 리스크 관리를 강화하세요.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8">
                  <AccordionTrigger className="text-left">
                    Q. 환자를 삭제하고 싶어요
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">
                      환자 데이터는 <strong>삭제보다는 상태 변경</strong>을 권장합니다:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>• <strong>더 이상 관리하지 않는 환자:</strong> 관리 상태를 "아웃"으로 변경</li>
                      <li>• <strong>사망한 환자:</strong> 관리 상태를 "사망"으로 변경</li>
                      <li>• <strong>치료 완료:</strong> 관리 상태를 "치료종료"로 변경</li>
                    </ul>
                    <p className="mt-2">
                      상태를 변경하면 대부분의 목록에서 자동으로 제외되며, 
                      과거 통계 데이터는 보존됩니다.
                    </p>
                    <p className="mt-2 text-sm bg-red-50 p-2 rounded">
                      ⚠️ 완전한 삭제가 필요한 경우 마스터 계정으로 문의하세요.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 팁 & 노하우 */}
        <TabsContent value="tips" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                업무 효율을 높이는 팁
              </CardTitle>
              <CardDescription>베테랑 매니저의 노하우를 배워보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    💾 매일 아침 루틴
                  </h4>
                  <ol className="space-y-1 text-blue-900 text-sm ml-4">
                    <li>1. 대시보드에서 전체 현황 확인</li>
                    <li>2. 이탈 리스크 관리에서 연락이 필요한 환자 체크</li>
                    <li>3. 전날 환자들의 일별 상태 입력</li>
                    <li>4. 오늘 방문 예정 환자 확인</li>
                  </ol>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    🔍 빠른 환자 찾기
                  </h4>
                  <ul className="space-y-1 text-green-900 text-sm ml-4">
                    <li>• 환자번호 뒷자리로 검색: "401" → P-2025-401 찾기</li>
                    <li>• 성으로만 검색: "김" → 김씨 성을 가진 모든 환자</li>
                    <li>• 담당자명으로 검색: "권은솔" → 내 담당 환자만 필터링</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    📊 월말 통계 활용
                  </h4>
                  <ul className="space-y-1 text-purple-900 text-sm ml-4">
                    <li>• 매월 말 통계 관리에서 이번 달 성과 확인</li>
                    <li>• 재진관리비율이 70% 미만이면 이탈 방지 활동 강화</li>
                    <li>• 아웃 환자 비율이 높으면 원인 분석 및 개선</li>
                    <li>• 평균 객단가 추이를 보며 수익성 점검</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ⚠️ 실수 방지 체크리스트
                  </h4>
                  <ul className="space-y-1 text-orange-900 text-sm ml-4">
                    <li>✓ 환자 등록 전 중복 여부 확인 (이름 + 생년월일)</li>
                    <li>✓ 연락처는 하이픈(-) 없이 숫자만 입력</li>
                    <li>✓ 결제 완료 시 반드시 "결제 완료" 체크</li>
                    <li>✓ 중요한 메모는 "중요" 표시로 강조</li>
                    <li>✓ 입원/퇴원 날짜는 반드시 정확하게 입력</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                  <h4 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    💝 환자 만족도 향상 팁
                  </h4>
                  <ul className="space-y-1 text-pink-900 text-sm ml-4">
                    <li>• 생일, 명절 등 특별한 날 메모 활용</li>
                    <li>• 가족 정보를 메모에 기록하여 대화에 활용</li>
                    <li>• 정기적인 전화 F/U로 관심 표현</li>
                    <li>• 치료 과정 중 특이사항은 즉시 노트에 기록</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>문의 및 지원</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-700">
                <p>추가 문의사항이 있으시면 다음으로 연락주세요:</p>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>시스템 관리자:</strong> 마스터 계정 담당자</li>
                  <li>• <strong>기술 지원:</strong> IT 부서</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}