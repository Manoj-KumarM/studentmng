import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearUser, getStoredUser } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { GraduationCap, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  roleLabel: string;
  groupLabel: string;
}

function SidebarNav({ menuItems, roleLabel, groupLabel }: Omit<DashboardLayoutProps, "children">) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const user = getStoredUser();

  const logout = () => {
    clearUser();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Brand Header */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground tracking-tight">Smart SMS</p>
              <p className="text-[10px] font-medium text-sidebar-primary uppercase tracking-widest">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-sidebar-border mx-3 w-auto" />

      <SidebarContent className="px-2 mt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3 mb-1">
            {groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="rounded-lg px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150 group"
                      activeClassName="bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-sm"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <div className="mt-auto p-3">
        <Separator className="bg-sidebar-border mb-3" />
        {!collapsed && user && (
          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg h-9"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>
      </div>
    </Sidebar>
  );
}

export default function DashboardLayout({ children, menuItems, roleLabel, groupLabel }: DashboardLayoutProps) {
  const user = getStoredUser();
  const location = useLocation();

  // Derive breadcrumb from path
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbLabel = pathParts[pathParts.length - 1]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarNav menuItems={menuItems} roleLabel={roleLabel} groupLabel={groupLabel} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-sm px-4 gap-3 shrink-0 sticky top-0 z-10">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{roleLabel}</span>
              {breadcrumbLabel && breadcrumbLabel.toLowerCase() !== roleLabel.toLowerCase() + " dashboard" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>{breadcrumbLabel}</span>
                </>
              )}
            </nav>
            {user && (
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
