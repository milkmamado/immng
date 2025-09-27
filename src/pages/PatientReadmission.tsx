import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';

export default function PatientReadmission() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">재입원 처리</h1>
            <p className="text-muted-foreground">
              기존 환자의 재입원을 처리합니다. (개발 예정)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}