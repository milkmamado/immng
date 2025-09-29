import { PatientBasicForm } from "@/components/PatientBasicForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FirstVisitManagement() {
  const { toast } = useToast();

  const handleClose = () => {
    toast({
      title: "등록 완료",
      description: "환자가 성공적으로 등록되었습니다.",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">초진관리</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 환자 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientBasicForm onClose={handleClose} />
        </CardContent>
      </Card>
    </div>
  );
}