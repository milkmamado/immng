import { 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  DollarSign, 
  Settings, 
  Home,
  UserPlus,
  ClipboardList,
  Heart
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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

const navigationItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "환자 관리", url: "/patients", icon: Users },
  { title: "신규 환자", url: "/patients/new", icon: UserPlus },
  { title: "진료 기록", url: "/records", icon: FileText },
  { title: "치료 현황", url: "/treatment", icon: Activity },
  { title: "일정 관리", url: "/schedule", icon: Calendar },
];

const managementItems = [
  { title: "결제 관리", url: "/payments", icon: DollarSign },
  { title: "건강 상태", url: "/health-status", icon: Heart },
  { title: "보고서", url: "/reports", icon: ClipboardList },
  { title: "설정", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = !open;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200";

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
              <h1 className="text-white font-bold text-sm">암한방병원</h1>
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
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
            {!isCollapsed && "관리"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}