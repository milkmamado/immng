import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Home, 
  Heart, 
  Users, 
  ClipboardCheck, 
  Calendar,
  BarChart3,
  Search,
  Plus,
  TrendingUp,
  BookMarked,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

export default function UserManual() {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">사용자 메뉴얼</h1>
            <p className="text-muted-foreground">면력한방병원 환자 관리 시스템 완벽 가이드</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 시스템 소개 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              시스템 개요
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">
              면력한방병원 환자 관리 시스템은 초진 상담부터 일별 상태 추적, 매출 분석까지 
              환자 관리의 전 과정을 효율적으로 지원하는 통합 시스템입니다.
            </p>
            <div className="bg-primary/5 border-l-4 border-primary p-4">
              <p className="text-sm flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>중요:</strong> 모든 데이터는 실시간으로 자동 저장되며, 
                  각 메뉴는 서로 연동되어 한 곳에서 수정하면 모든 곳에 즉시 반영됩니다.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 1. 대시보드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              1. 대시보드
            </CardTitle>
            <CardDescription>전체 환자 현황을 한눈에 확인</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                주요 지표
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-1">📊 전체 환자</div>
                  <p className="text-sm text-muted-foreground">시스템에 등록된 총 환자 수</p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-1">⚠️ 이탈 리스크 환자</div>
                  <p className="text-sm text-muted-foreground">14일 이상 체크 없는 환자 수</p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-1">💰 당월 현재 매출</div>
                  <p className="text-sm text-muted-foreground">
                    해당 월 예치금 입금 + 입원/외래 매출 합계
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-1">📈 누적 매출</div>
                  <p className="text-sm text-muted-foreground">
                    전체 기간 예치금 입금 + 입원/외래 매출 합계
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm">
                <strong>💡 활용 팁:</strong> 대시보드의 이탈 리스크 환자 목록을 클릭하면 
                해당 환자의 상세 정보로 바로 이동할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. 초진관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              2. 초진관리
            </CardTitle>
            <CardDescription>신규 환자 등록 및 초진 상담 관리</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-green-600" />
                  신규 환자 등록 절차 (CRM 연동)
                </h4>
                <ol className="space-y-3 ml-4">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <div>
                      우측 상단 <Badge>새 환자 등록</Badge> 버튼 클릭
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <div>
                      조회 창에서 <strong>환자명</strong>과 <strong>전화번호</strong> 입력 후 <Badge>조회</Badge> 버튼 클릭
                      <div className="mt-1 text-sm text-muted-foreground ml-4">
                        → CRM 시스템 페이지가 새 탭으로 열립니다
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <div>
                      <strong>CRM 연동 북마크 사용:</strong>
                      <ul className="mt-2 space-y-1 ml-4 text-sm">
                        <li>• 북마크바의 <Badge variant="outline">CRM 연동</Badge> 북마크 클릭</li>
                        <li>• 자동으로 환자 검색이 실행됩니다</li>
                        <li>• 해당 환자명을 더블클릭하면 상세 정보가 자동으로 추출됩니다</li>
                      </ul>
                      <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3">
                        <p className="text-xs">
                          <strong>💡 참고:</strong> CRM 연동 북마크 설정은 
                          <strong className="text-blue-600"> CRM 연동</strong> 메뉴에서 확인하세요.
                        </p>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <div>
                      자동으로 가져온 정보 확인 및 추가 정보 입력:
                      <ul className="mt-2 space-y-1 ml-4 text-sm">
                        <li>• <strong>자동 입력:</strong> 고객번호, 환자명, 연락처, 나이, 주소, 내원동기, 진단명 등</li>
                        <li>• <strong>수동 입력:</strong> 유입/실패, 입원/외래, 담당매니저, 주치의 정보 등</li>
                        <li>• <strong>선택 입력:</strong> 보호자 정보, 추가 메모</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">5.</span>
                    <div><Badge>등록</Badge> 버튼으로 완료</div>
                  </li>
                </ol>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-blue-600" />
                  환자 검색 기능
                </h4>
                <p className="mb-2">검색창에서 다음 정보로 환자를 찾을 수 있습니다:</p>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div>• 환자명</div>
                  <div>• 고객번호</div>
                  <div>• 담당매니저</div>
                  <div>• 주치의 이름</div>
                  <div>• 입원/외래</div>
                  <div>• 이전병원</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  주의사항
                </h4>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                  <ul className="text-sm space-y-1">
                    <li>• 환자 삭제는 복구할 수 없으니 신중하게 진행하세요</li>
                    <li>• CRM 연동 북마크가 설정되어 있어야 자동 입력이 가능합니다</li>
                    <li>• 중복 등록을 방지하기 위해 등록 전 검색으로 기존 환자 여부를 확인하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. 관리 환자 리스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              3. 관리 환자 리스트
            </CardTitle>
            <CardDescription>모든 환자의 상세 정보 조회 및 수정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  환자 정보 수정
                </h4>
                <ol className="space-y-2 ml-4">
                  <li>1. 환자 목록에서 수정할 환자 행 클릭</li>
                  <li>2. 상세 정보 팝업에서 각 필드를 직접 클릭하여 수정</li>
                  <li>3. 수정 완료 후 <Badge>수정</Badge> 버튼을 클릭하여 저장</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  수납금액 표시
                </h4>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <p className="text-sm">
                    <strong>수납금액 = 예치금 입금 + 입원 매출 + 외래 매출</strong>
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    거래 내역은 환자 상세 팝업에서 확인할 수 있습니다.
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-purple-600" />
                  패키지 관리 (예치금, 적립금, 횟수)
                </h4>
                <div className="space-y-3">
                  <ol className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <div>
                        환자 상세 팝업에서 <Badge>패키지 관리</Badge> 섹션 확인
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <div>
                        <Badge variant="outline">최신화</Badge> 버튼 클릭 → CRM 패키지 관리 페이지로 이동
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <div>
                        CRM에서 해당 지점의 패키지 관리 화면을 엽니다
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <div>
                        북마크바의 <Badge variant="outline">패키지 연동</Badge> 북마크 클릭
                        <div className="mt-1 text-sm text-muted-foreground ml-4">
                          → 예수금, 적립금, 횟수 정보가 자동으로 추출됩니다
                        </div>
                      </div>
                    </li>
                  </ol>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
                    <p className="text-xs">
                      <strong>💡 참고:</strong> 패키지 연동 북마크 설정은 
                      <strong className="text-purple-600"> 패키지 연동</strong> 메뉴에서 확인하세요.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  입원/외래 매출 관리
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3">
                    <p className="text-sm">
                      <strong>📋 엑셀 파일 준비:</strong> 닥터스 프로그램 → 매출통계 → 환자명으로 검색 → 엑셀 다운로드
                    </p>
                  </div>
                  <ol className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <div>
                        <strong>닥터스 프로그램에서 엑셀 파일 다운로드:</strong>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-1">
                          <li>• 닥터스 프로그램 실행</li>
                          <li>• 매출통계 메뉴 선택</li>
                          <li>• 환자명으로 검색</li>
                          <li>• 해당 환자의 입원 또는 외래 매출 데이터를 엑셀로 다운로드</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <div>
                        환자 상세 팝업에서 <Badge>입원 매출</Badge> 또는 <Badge>외래 매출</Badge> 섹션 확인
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <div>
                        <Badge variant="outline">엑셀 업로드</Badge> 버튼 클릭
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <div>
                        닥터스에서 다운받은 엑셀 파일 선택 후 업로드
                        <div className="mt-2 ml-4">
                          <p className="text-sm font-medium">엑셀 파일 형식 요구사항:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-1">
                            <li>• <strong>수납일자</strong> 컬럼 필수</li>
                            <li>• <strong>금액</strong> 컬럼 필수</li>
                            <li>• <strong>비고</strong> 컬럼 선택사항</li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">5.</span>
                      <div>
                        업로드된 데이터는 자동으로 수납금액에 합산됩니다
                      </div>
                    </li>
                  </ol>
                  <div className="bg-green-50 border-l-4 border-green-500 p-3">
                    <p className="text-xs">
                      <strong>✨ 자동 계산:</strong> 입원/외래 매출은 수납일자 기준으로 
                      당월 매출 및 누적 매출에 자동 집계됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">🔄 관리 상태 설명</h4>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">
                      <Badge className="bg-green-600">관리 중</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 일반적인 관리 상태</li>
                      <li>• 일별 환자 관리 현황에 표시됨</li>
                      <li>• 통계에 정상 관리 환자로 집계됨</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">
                      <Badge className="bg-orange-600">아웃위기</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 14일 이상 연락 없는 환자 자동 분류</li>
                      <li>• 이탈 리스크 관리 페이지에 표시됨</li>
                      <li>• 대시보드 이탈 리스크 수에 포함됨</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">
                      <Badge className="bg-red-600">아웃</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 21일 이상 연락 없는 환자 자동 분류</li>
                      <li>• 이탈 리스크 관리 페이지에 표시됨</li>
                      <li>• 통계의 아웃 환자 수에 집계됨</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">
                      <Badge variant="secondary">상태악화 / 치료종료 / 사망</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 일별 관리에서 제외됨</li>
                      <li>• 다시 "관리 중"으로 변경하면 일별 관리에 표시</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. 일별 환자 관리 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              4. 일별 환자 관리 현황
            </CardTitle>
            <CardDescription>매일의 환자 상태를 캘린더로 추적</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">📅 일별 상태 기록 방법</h4>
                <ol className="space-y-2 ml-4">
                  <li>1. 상단에서 월 선택 (캘린더 또는 화살표 버튼)</li>
                  <li>2. 환자 리스트에서 상태를 기록할 환자의 날짜 칸 클릭</li>
                  <li>3. 드롭다운에서 해당 날짜 환자 상태 선택:
                    <div className="mt-2 space-y-1 ml-4">
                      <div><Badge className="bg-blue-500">입원</Badge> - 신규 입원</div>
                      <div><Badge className="bg-indigo-500">재원</Badge> - 입원 중 (2일차 이후)</div>
                      <div><Badge className="bg-green-500">외래</Badge> - 외래 진료</div>
                      <div><Badge className="bg-yellow-500">낮병동</Badge> - 낮병동 이용</div>
                      <div><Badge className="bg-orange-500">전화F/U</Badge> - 전화 상담</div>
                      <div><Badge className="bg-gray-500">퇴원</Badge> - 퇴원</div>
                    </div>
                  </li>
                  <li>4. 메모 란에 특이사항 입력 가능</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">👤 환자명 클릭 시 팝업</h4>
                <p className="mb-2">환자 이름을 클릭하면 다음 정보를 확인할 수 있습니다:</p>
                <div className="space-y-2 ml-4">
                  <div>• <strong>월별 활동 통계:</strong> 입원일수, 외래일수, 낮병동일수, 전화상담 횟수</div>
                  <div>• <strong>패키지 관리 현황:</strong> 예치금, 리워드, 횟수권 잔액</div>
                  <div>• <strong>입원 매출:</strong> 거래 건수 및 총액</div>
                  <div>• <strong>외래 매출:</strong> 거래 건수 및 총액</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">📊 관리 상태 자동 업데이트</h4>
                <div className="space-y-2">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                    <p className="text-sm">
                      <strong>아웃위기 (14일):</strong> 마지막 체크 후 14일 이상 경과 시 자동 변경
                    </p>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <p className="text-sm">
                      <strong>아웃 (21일):</strong> 마지막 체크 후 21일 이상 경과 시 자동 변경
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm">
                  <strong>💡 활용 팁:</strong> 매일 아침 전날 환자들의 상태를 입력하는 습관을 들이면 
                  정확한 환자 관리 현황을 추적할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. 이탈 리스크 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              5. 이탈 리스크 관리
            </CardTitle>
            <CardDescription>관리가 필요한 환자를 자동으로 파악</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">⚠️ 리스크 판단 기준</h4>
                <div className="space-y-2">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-orange-600 mb-1">아웃위기 환자</div>
                    <p className="text-sm text-muted-foreground">
                      마지막 일별 체크 후 14일 이상 경과한 환자
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-red-600 mb-1">아웃 환자</div>
                    <p className="text-sm text-muted-foreground">
                      마지막 일별 체크 후 21일 이상 경과한 환자
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">🔄 재연락 관리</h4>
                <ol className="space-y-2 ml-4">
                  <li>1. 이탈 리스크 환자 목록에서 재연락할 환자 확인</li>
                  <li>2. 우측 상단 전화번호 버튼 클릭하여 전화 걸기</li>
                  <li>3. <strong>담당자 메모</strong> 란에 재연락 상담 내용 기록 (전화 내용, 응답 여부 등)</li>
                  <li>4. <Badge variant="outline">메모 저장</Badge> 버튼 클릭</li>
                  <li>5. 재연락 성공 시 <Badge className="bg-green-600">재연락 완료</Badge> 체크박스 선택</li>
                  <li>6. 환자가 다시 관리 가능한 경우 <Badge>관리 중으로 복귀</Badge> 버튼 클릭
                    <div className="mt-2 ml-4">
                      <p className="text-sm text-muted-foreground">
                        → 자동으로 "관리 중" 상태로 변경됩니다<br/>
                        → 일별 환자 관리 현황에 오늘 날짜로 <Badge className="bg-purple-500">돌환</Badge> 상태가 추가됩니다
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm">
                  <strong>💡 팁:</strong> "관리 중으로 복귀" 버튼을 누르면 자동으로 관리 중 상태가 되고 
                  일별 현황에 "돌환"으로 기록되므로, 별도로 입력할 필요가 없습니다.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-3">
                <p className="text-sm">
                  <strong>⚠️ 주의:</strong> 재연락 완료 체크와 메모 저장만으로는 "관리 중" 상태로 변경되지 않습니다. 
                  반드시 "관리 중으로 복귀" 버튼을 클릭해야 합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. 통계 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              6. 통계 관리
            </CardTitle>
            <CardDescription>매출 및 환자 관리 통계 분석</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">📊 주요 통계 지표</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">총 관리 환자</div>
                    <p className="text-sm text-muted-foreground">현재 관리 중인 전체 환자 수</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">누적 매출</div>
                    <p className="text-sm text-muted-foreground">
                      전체 기간 예치금 + 입원/외래 매출
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">당월 매출</div>
                    <p className="text-sm text-muted-foreground">
                      선택한 월의 예치금 + 입원/외래 매출
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">평균 객단가</div>
                    <p className="text-sm text-muted-foreground">환자 1인당 평균 매출액</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">📈 추가 분석 지표</h4>
                <div className="space-y-2">
                  <div>• <strong>아웃 환자:</strong> 아웃 상태인 환자 수</div>
                  <div>• <strong>유입률 (초진상담):</strong> 선택한 월 신규 유입 환자 수</div>
                  <div>• <strong>재진관리비율:</strong> 전월 초진 환자 중 당월 활동한 비율</div>
                  <div>• <strong>관리 기간별 환자:</strong> 1개월, 3개월, 6개월 이상 관리 환자 수</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">🎯 필터 기능</h4>
                <p className="mb-2">상단에서 다음 필터를 사용할 수 있습니다:</p>
                <div className="space-y-1 ml-4">
                  <div>• <strong>월 선택:</strong> 통계를 확인할 월 선택</div>
                  <div>• <strong>담당자 선택:</strong> 특정 담당자의 통계만 보기 (마스터/관리자 전용)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. CRM 연동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              7. CRM 연동
            </CardTitle>
            <CardDescription>병원 CRM 시스템과의 연동</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">🔗 북마클릿 설치</h4>
                <ol className="space-y-2 ml-4">
                  <li>1. CRM 연동 페이지로 이동</li>
                  <li>2. <Badge>CRM 연동 북마클릿</Badge> 버튼을 브라우저 북마크바로 드래그</li>
                  <li>3. 병원 CRM 시스템에 로그인 후 북마클릿 클릭</li>
                  <li>4. 환자 정보가 자동으로 입력된 등록 창이 열립니다</li>
                </ol>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm">
                  <strong>💡 활용 팁:</strong> CRM에서 환자 정보를 일일이 복사-붙여넣기 할 필요 없이 
                  북마클릿 한 번 클릭으로 빠르게 등록할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8. 패키지 연동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              8. 패키지 연동
            </CardTitle>
            <CardDescription>패키지 및 매출 데이터 업로드</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">📤 엑셀 파일 업로드</h4>
                <p className="mb-2">다음 3가지 엑셀 파일을 업로드할 수 있습니다:</p>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">1. 패키지 거래 내역</div>
                    <p className="text-sm text-muted-foreground">
                      예치금 입금, 예치금 사용, 리워드 적립/사용, 횟수권 등록/사용
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">2. 입원 매출</div>
                    <p className="text-sm text-muted-foreground">
                      입원 환자의 수납일자별 매출 금액
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">3. 외래 매출</div>
                    <p className="text-sm text-muted-foreground">
                      외래 환자의 수납일자별 매출 금액
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">📋 업로드 절차</h4>
                <ol className="space-y-2 ml-4">
                  <li>1. 각 섹션의 <Badge variant="outline">엑셀 업로드</Badge> 버튼 클릭</li>
                  <li>2. 병원 시스템에서 다운로드한 엑셀 파일 선택</li>
                  <li>3. 자동으로 데이터 매칭 및 저장</li>
                  <li>4. 업로드 결과 확인 (성공/실패 건수)</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-sm">
                  <strong>⚠️ 주의:</strong> 엑셀 파일의 차트번호가 시스템에 등록된 환자와 일치해야 
                  정상적으로 연동됩니다. 차트번호가 없는 환자는 먼저 초진관리에서 등록해주세요.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">💰 수납금액 계산</h4>
                <div className="bg-primary/5 border-l-4 border-primary p-4">
                  <p className="text-sm">
                    <strong>수납금액 = 예치금 입금 + 입원 매출 + 외래 매출</strong>
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    • 환자 리스트의 수납금액은 이 세 가지를 합산하여 자동 계산됩니다<br/>
                    • 각 거래 내역은 환자 상세 팝업에서 확인할 수 있습니다<br/>
                    • 대시보드와 통계 관리의 매출도 이 데이터를 기준으로 집계됩니다
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 문의 안내 */}
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-bold text-lg">추가 문의 사항</h3>
              <p className="text-sm text-muted-foreground">
                사용 중 문제가 발생하거나 추가 기능이 필요한 경우<br/>
                시스템 관리자(마스터)에게 문의해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}