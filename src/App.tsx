import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminFeedbackForms from "./pages/admin/AdminFeedbackForms";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherModifyAttendance from "./pages/teacher/TeacherModifyAttendance";
import TeacherUploadMarks from "./pages/teacher/TeacherUploadMarks";
import TeacherUploadNotes from "./pages/teacher/TeacherUploadNotes";
import TeacherDownloadAttendance from "./pages/teacher/TeacherDownloadAttendance";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentAttendancePercentage from "./pages/student/StudentAttendancePercentage";
import StudentMarks from "./pages/student/StudentMarks";
import StudentNotes from "./pages/student/StudentNotes";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentFeedback from "./pages/student/StudentFeedback";
import StudentProfile from "./pages/student/StudentProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          {/* Admin */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/feedback-forms" element={<AdminFeedbackForms />} />
          {/* Teacher */}
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/modify-attendance" element={<TeacherModifyAttendance />} />
          <Route path="/teacher/upload-marks" element={<TeacherUploadMarks />} />
          <Route path="/teacher/upload-notes" element={<TeacherUploadNotes />} />
          <Route path="/teacher/download-attendance" element={<TeacherDownloadAttendance />} />
          {/* Student */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/attendance-percentage" element={<StudentAttendancePercentage />} />
          <Route path="/student/marks" element={<StudentMarks />} />
          <Route path="/student/notes" element={<StudentNotes />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/feedback" element={<StudentFeedback />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
