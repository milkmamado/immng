import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, BarChart3, Shield } from 'lucide-react';
import { ManageUsers } from '@/components/ManageUsers';
import { ManagerStats } from '@/components/ManagerStats';

export default function AccountManagement() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  // 마스터 권한 확인
  if (userRole !== 'master') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4 text-destructive">접근 권한 없음</h1>
          <p className="text-muted-foreground">
            이 페이지는 최고 관리자(마스터) 권한이 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">계정 관리</h1>
          <p className="text-muted-foreground">
            사용자 승인, 권한 관리, 매니저 통계를 관리합니다.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            가입 승인
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            사용자 관리
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            매니저 통계
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>가입 승인 대기</CardTitle>
              <CardDescription>
                승인이 필요한 신규 가입자들을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManageUsers type="pending" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>승인된 사용자</CardTitle>
              <CardDescription>
                승인된 사용자들의 권한을 관리하고 계정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManageUsers type="approved" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>매니저별 통계</CardTitle>
              <CardDescription>
                각 매니저가 관리하는 환자 현황과 통계를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManagerStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}