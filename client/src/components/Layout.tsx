import { NavLink, Outlet } from "react-router-dom";
import { Leaf, Camera, ListTodo, FileText, BookOpen, ClipboardCheck } from "lucide-react";

const navItems = [
  { to: "/", label: "首页", icon: Leaf },
  { to: "/inspections", label: "每日巡检", icon: ClipboardCheck },
  { to: "/tasks", label: "养护任务", icon: ListTodo },
  { to: "/logs", label: "养护日志", icon: FileText },
  { to: "/care-cards", label: "养护卡", icon: BookOpen },
];

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <Leaf className="w-6 h-6" />
            <span>妙植</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;