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
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const user = getStoredUser();

  const logout = () => {
    clearUser();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <GraduationCap className="h-6 w-6 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Smart SMS</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</p>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <p className="text-xs text-sidebar-foreground/60 mb-2 truncate px-1">{user.name}</p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </Sidebar>
  );
}

export default function DashboardLayout({ children, menuItems, roleLabel, groupLabel }: DashboardLayoutProps) {
  const user = getStoredUser();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav menuItems={menuItems} roleLabel={roleLabel} groupLabel={groupLabel} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-foreground">Smart Student Management System</span>
            </div>
            {user && (
              <span className="ml-auto text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{user.name}</span>
              </span>
            )}
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
