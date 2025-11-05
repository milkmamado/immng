import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function BranchSwitcher() {
  const { userRole, currentBranch, switchBranch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // master만 지점 전환 가능
  if (userRole !== 'master') {
    return null;
  }

  const handleBranchChange = (newBranch: '강서' | '광명' | '성동') => {
    switchBranch(newBranch);
    
    // 현재 경로에서 지점 부분만 변경
    const pathParts = location.pathname.split('/');
    if (pathParts.length > 1) {
      pathParts[1] = newBranch;
      navigate(pathParts.join('/'));
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
          <SelectItem value="강서">강서점</SelectItem>
          <SelectItem value="광명">광명점</SelectItem>
          <SelectItem value="성동">성동점</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}