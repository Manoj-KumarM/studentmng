
-- Create attendance_sessions table
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  teacher_latitude DOUBLE PRECISION NOT NULL,
  teacher_longitude DOUBLE PRECISION NOT NULL,
  allowed_radius_meters INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create attendance_submissions table
CREATE TABLE public.attendance_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_usn TEXT NOT NULL,
  student_latitude DOUBLE PRECISION NOT NULL,
  student_longitude DOUBLE PRECISION NOT NULL,
  distance_meters DOUBLE PRECISION NOT NULL,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('valid', 'invalid')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_usn)
);

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_submissions ENABLE ROW LEVEL SECURITY;

-- Since no auth, allow all operations (prototype only)
CREATE POLICY "Allow all on sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on submissions" ON public.attendance_submissions FOR ALL USING (true) WITH CHECK (true);
