import { 
  Users, 
  Calendar, 
  Home,
  Heart,
  Shield,
  ClipboardCheck,
  Settings,
  BarChart3,
  TrendingUp,
  BookOpen,
  BookMarked,
  Package
} from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const getNavigationItems = (branch: string) => [
  { title: "대시보드", url: `/${branch}`, icon: Home },
  { title: "초진관리", url: `/${branch}/first-visit`, icon: Heart },
  { title: "관리 환자 리스트", url: `/${branch}/patient-list`, icon: Users },
  { title: "일별 환자 관리 현황", url: `/${branch}/daily-tracking`, icon: ClipboardCheck },
  { title: "이탈 리스크 관리", url: `/${branch}/risk-management`, icon: Calendar },
  { title: "통계 관리", url: `/${branch}/statistics`, icon: BarChart3 },
  { title: "CRM 연동", url: `/${branch}/crm-bookmarklet`, icon: BookMarked },
  { title: "패키지 연동", url: `/${branch}/package-integration`, icon: Package },
  { title: "사용자 메뉴얼", url: `/${branch}/user-manual`, icon: BookOpen },
];

const managementItems: never[] = [];

const getAdminItems = (branch: string) => [
  { title: "마케팅 통계", url: `/${branch}/marketing-statistics`, icon: TrendingUp, requiredRole: 'master' as const },
  { title: "계정 관리", url: `/${branch}/account-management`, icon: Shield, requiredRole: 'master' as const },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { userRole } = useAuth();
  const location = useLocation();
  const { branch } = useParams<{ branch: string }>();
  const currentBranch = branch || '광명';
  const currentPath = location.pathname;
  const isCollapsed = !open;
  
  const navigationItems = getNavigationItems(currentBranch);
  const adminItems = getAdminItems(currentBranch);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200";

  return (
    <Sidebar
      className={`${isCollapsed ? "w-14" : "w-64"} border-r transition-all duration-300`}
      collapsible="icon"
    >
      <div className="p-4 border-b bg-gradient-to-r from-primary to-medical-accent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-sm">면력한방병원</h1>
              <p className="text-primary-light text-xs">환자 관리 시스템</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
            {!isCollapsed && "주요 기능"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 text-gray-600" />
                      {!isCollapsed && <span className="ml-2 text-gray-800 font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* 마스터 전용 메뉴 */}
        {userRole === 'master' && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
              {!isCollapsed && "시스템 관리"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavCls}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0 text-gray-600" />
                        {!isCollapsed && <span className="ml-2 text-gray-800 font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}