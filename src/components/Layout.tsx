import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, User, LogOut, Crown, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, userRole, signOut } = useAuth();

  // 승인되지 않은 사용자에게는 Layout 숨김
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">승인 대기 중</h1>
            <p className="text-muted-foreground">
              계정이 아직 승인되지 않았습니다.
            </p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              관리자의 승인을 기다려주세요.
            </p>
            <p className="text-sm text-muted-foreground">
              승인이 완료되면 시스템을 이용하실 수 있습니다.
            </p>
          </div>

          <button 
            onClick={signOut}
            className="text-primary hover:underline text-sm"
          >
            다른 계정으로 로그인하기
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '사용자';
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'master': return '마스터';
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      default: return '사용자';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'master': return Crown;
      case 'admin': return UserCheck;
      case 'manager': return User;
      default: return User;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b bg-card shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="환자명, 등록번호로 검색..." 
                  className="w-80 pl-10 bg-background"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs"></span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
                    <User className="h-4 w-4" />
                    <div className="text-sm text-left">
                      <div className="font-medium">{getUserDisplayName()}</div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const RoleIcon = getRoleIcon();
                          return <RoleIcon className="h-3 w-3" />;
                        })()}
                        <span className="text-xs text-muted-foreground">{getRoleDisplayName()}</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getUserDisplayName()}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={userRole === 'master' ? 'default' : 'secondary'} className="text-xs">
                          {(() => {
                            const RoleIcon = getRoleIcon();
                            return (
                              <>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {getRoleDisplayName()}
                              </>
                            );
                          })()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}