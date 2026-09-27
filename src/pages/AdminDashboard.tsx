import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { Shield, LogOut, AlertTriangle, Clock, CheckCircle, Loader2, Eye, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Incident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  address: string | null;
  user_id: string;
};

const statuses = ["pending", "reviewing", "in_progress", "resolved", "closed"] as const;

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewing: "bg-info/10 text-info border-info/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const severityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive/20 text-destructive font-bold",
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await api.get<Incident[]>("/api/admin/incidents");
      setIncidents(data || []);
    } catch {
      toast.error("Failed to load incidents");
    }
    setLoading(false);
  };

  const updateStatus = async (incidentId: string, newStatus: string) => {
    try {
      await api.patch(`/api/incidents/${incidentId}/status`, { status: newStatus });
      toast.success("Status updated");
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: newStatus } : i))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = filter === "all" ? incidents : incidents.filter((i) => i.status === filter);

  const stats = {
    total: incidents.length,
    critical: incidents.filter((i) => i.severity === "critical").length,
    pending: incidents.filter((i) => i.status === "pending").length,
    resolved: incidents.filter((i) => ["resolved", "closed"].includes(i.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-green flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CivicSafe</span>
            <Badge variant="outline" className="ml-2 text-primary border-primary/30">Admin</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              My Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">Manage and oversee all incident reports</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Incidents", value: stats.total, icon: BarChart3 },
              { label: "Critical", value: stats.critical, icon: AlertTriangle },
              { label: "Pending Review", value: stats.pending, icon: Clock },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex gap-2 flex-wrap">
              {["all", ...statuses].map((s) => (
                <Button
                  key={s}
                  variant={filter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(s)}
                  className="capitalize"
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Incidents */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No incidents found</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((incident, i) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-4 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/incident/${incident.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{incident.title}</h3>
                        <Badge variant="outline" className={severityColor[incident.severity]}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{incident.category.replace("_", " ")}</span>
                        {incident.address && <span>• {incident.address}</span>}
                        <span>• {new Date(incident.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={incident.status}
                        onValueChange={(val) => updateStatus(incident.id, val)}
                      >
                        <SelectTrigger className="w-36 bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/incident/${incident.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
