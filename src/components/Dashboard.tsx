import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Heart,
  UserPlus,
  CalendarDays
} from "lucide-react";

const stats = [
  {
    title: "총 환자 수",
    value: "247",
    change: "+12 (이번 달)",
    icon: Users,
    gradient: "from-primary to-primary-light"
  },
  {
    title: "오늘 예약",
    value: "18",
    change: "진료 대기 중",
    icon: Calendar,
    gradient: "from-medical-accent to-medical-accent/80"
  },
  {
    title: "이번 달 수입",
    value: "₩52,400,000",
    change: "+15.2% 전월 대비",
    icon: DollarSign,
    gradient: "from-status-stable to-status-improving"
  },
  {
    title: "치료 진행 중",
    value: "134",
    change: "활성 환자",
    icon: Activity,
    gradient: "from-status-improving to-primary"
  }
];

const recentPatients = [
  {
    id: "P-2024-001",
    name: "김○○",
    age: 58,
    condition: "위암 3기",
    status: "치료중",
    nextVisit: "2024-01-15",
    priority: "high"
  },
  {
    id: "P-2024-002", 
    name: "이○○",
    age: 45,
    condition: "유방암 2기",
    status: "호전",
    nextVisit: "2024-01-16",
    priority: "medium"
  },
  {
    id: "P-2024-003",
    name: "박○○",
    age: 62,
    condition: "폐암 2기",
    status: "안정",
    nextVisit: "2024-01-17",
    priority: "low"
  }
];

const todaySchedule = [
  { time: "09:00", patient: "김○○", type: "초진 상담", room: "상담실 1" },
  { time: "10:30", patient: "이○○", type: "한약 처방", room: "진료실 2" },
  { time: "14:00", patient: "박○○", type: "침구 치료", room: "치료실 1" },
  { time: "15:30", patient: "최○○", type: "경과 관찰", room: "진료실 1" },
];

export function Dashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "치료중": return "bg-status-warning/10 text-status-warning border-status-warning/20";
      case "호전": return "bg-status-stable/10 text-status-stable border-status-stable/20";
      case "안정": return "bg-status-improving/10 text-status-improving border-status-improving/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-status-critical/10 text-status-critical border-status-critical/20";
      case "medium": return "bg-status-warning/10 text-status-warning border-status-warning/20";
      case "low": return "bg-status-stable/10 text-status-stable border-status-stable/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-1">오늘의 환자 관리 현황을 확인하세요</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            신규 환자 등록
          </Button>
          <Button className="gap-2">
            <CalendarDays className="h-4 w-4" />
            오늘의 일정
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              최근 환자 현황
            </CardTitle>
            <CardDescription>
              치료 진행 중인 주요 환자들의 상태를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{patient.name} ({patient.age}세)</div>
                      <div className="text-sm text-muted-foreground">{patient.condition}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      다음 진료: {patient.nextVisit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              오늘의 일정
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.map((appointment, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Clock className="h-4 w-4" />
                    {appointment.time}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{appointment.patient}</div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.type} · {appointment.room}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    상세보기
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Section */}
      <Card className="border-status-warning/20 bg-status-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-status-warning">
            <AlertCircle className="h-5 w-5" />
            주의사항 및 알림
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-status-critical rounded-full"></div>
              <span>김○○ 환자 - 다음 주 대학병원 검진 예정</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-status-warning rounded-full"></div>
              <span>이○○ 환자 - 한약 복용 부작용 관찰 필요</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-status-improving rounded-full"></div>
              <span>이번 주 신규 환자 상담 3건 예정</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}