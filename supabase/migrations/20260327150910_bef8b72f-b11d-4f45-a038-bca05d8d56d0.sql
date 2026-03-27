
-- Users table for authentication
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on users" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

-- Students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  usn text UNIQUE NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  phone text,
  parent_phone text,
  parent_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on students" ON public.students FOR ALL TO public USING (true) WITH CHECK (true);

-- Teachers table
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on teachers" ON public.teachers FOR ALL TO public USING (true) WITH CHECK (true);

-- Subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name text NOT NULL,
  subject_code text NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subjects" ON public.subjects FOR ALL TO public USING (true) WITH CHECK (true);

-- Marks table
CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  exam_name text NOT NULL,
  marks numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on marks" ON public.marks FOR ALL TO public USING (true) WITH CHECK (true);

-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on notes" ON public.notes FOR ALL TO public USING (true) WITH CHECK (true);

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  branch text,
  semester text,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on announcements" ON public.announcements FOR ALL TO public USING (true) WITH CHECK (true);

-- Feedback forms table
CREATE TABLE public.feedback_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on feedback_forms" ON public.feedback_forms FOR ALL TO public USING (true) WITH CHECK (true);

-- Feedback responses table
CREATE TABLE public.feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.feedback_forms(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on feedback_responses" ON public.feedback_responses FOR ALL TO public USING (true) WITH CHECK (true);

-- Password reset codes table
CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  reset_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on password_reset_codes" ON public.password_reset_codes FOR ALL TO public USING (true) WITH CHECK (true);

-- Attendance records (final per session)
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.attendance_sessions(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('Present', 'Absent')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on attendance_records" ON public.attendance_records FOR ALL TO public USING (true) WITH CHECK (true);

-- Add subject_id to attendance_sessions
ALTER TABLE public.attendance_sessions ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Insert default admin user (password: admin123, using simple hash for prototype)
INSERT INTO public.users (name, email, password_hash, role) VALUES ('Admin', 'admin@college.com', 'admin123_hashed', 'admin');
