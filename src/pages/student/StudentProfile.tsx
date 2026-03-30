import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const StudentProfile = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();

  useEffect(() => {
    if (!user || user.role !== "student") navigate("/login");
  }, []);

  if (!user || !roleData) return null;

  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["USN", roleData.usn],
    ["Branch", roleData.branch],
    ["Semester", roleData.semester],
    ["Section", roleData.section],
    ["Phone", roleData.phone || "-"],
  ];

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Profile" description="Your student information" />
      <Card className="max-w-lg">
        <CardContent className="p-5">
          <Table>
            <TableBody>
              {fields.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell className="font-medium text-muted-foreground w-32">{label}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentProfile;
