import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function BranchSwitcher() {
  const { userRole, currentBranch, userBranches, switchBranch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // 마스터 계정은 모든 지점 접근 가능
  const allBranches: Array<{ branch: '강서' | '광명' | '성동'; role: 'master' | 'manager' | 'admin' }> = [
    { branch: '강서', role: 'master' },
    { branch: '광명', role: 'master' },
    { branch: '성동', role: 'master' },
  ];

  const availableBranches = userRole === 'master' ? allBranches : userBranches;

  // 사용자가 접근 가능한 지점이 없으면 표시하지 않음
  if (!availableBranches || availableBranches.length === 0) {
    return null;
  }

  // 사용자가 한 지점에만 권한이 있으면 표시하지 않음 (master 제외)
  if (availableBranches.length === 1 && userRole !== 'master') {
    return null;
  }

  const handleBranchChange = (newBranch: '강서' | '광명' | '성동') => {
    // 로딩 토스트 표시
    toast({
      title: "지점 전환 중...",
      description: `${newBranch}점 데이터를 불러오는 중입니다.`,
      duration: 1500,
    });

    switchBranch(newBranch);
    
    // 현재 경로에서 지점 부분만 변경
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // URL 디코딩 후 처리 (한글 인코딩 문제 해결)
    const decodedParts = pathParts.map(part => decodeURIComponent(part));
    
    if (decodedParts.length > 0) {
      // 첫 번째 부분(지점)을 새 지점으로 교체
      decodedParts[0] = newBranch;
      navigate(`/${decodedParts.join('/')}`);
    } else {
      navigate(`/${newBranch}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select value={currentBranch || undefined} onValueChange={handleBranchChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="지점 선택" />
        </SelectTrigger>
        <SelectContent>
          {availableBranches.map(({ branch }) => (
            <SelectItem key={branch} value={branch}>
              {branch}점
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}