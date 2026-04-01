import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity, Globe } from "lucide-react";

export default function ControlHubDashboard() {
  const stats = [
    { title: "Total Tenants", value: "12", icon: Building2, color: "text-blue-600" },
    { title: "Active Users", value: "2.4k", icon: Users, color: "text-green-600" },
    { title: "System Health", value: "99.9%", icon: Activity, color: "text-emerald-600" },
    { title: "Global Reach", value: "5 States", icon: Globe, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Avec ControlHub</h1>
        <p className="text-muted-foreground mt-1 text-lg">System-wide monitoring and multi-tenant management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Tenant Registered</p>
                    <p className="text-xs text-muted-foreground">Mainstream University was added to the platform</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2h ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Notifications</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground italic">No critical system alerts at this time.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
