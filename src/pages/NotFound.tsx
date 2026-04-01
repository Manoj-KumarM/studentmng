import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex h-16 w-16 rounded-2xl gradient-primary items-center justify-center shadow-lg mb-6">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold gradient-text mb-2">404</h1>
        <p className="text-lg font-medium text-foreground mb-1">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="text-xs bg-muted px-2 py-0.5 rounded">{location.pathname}</code> doesn't exist.
        </p>
        <Button asChild>
          <Link to="/login" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
