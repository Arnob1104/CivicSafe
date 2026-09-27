import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Plus, LogOut, Clock, AlertTriangle, CheckCircle, Loader2, Eye, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import NearbyIncidentsMap from "@/components/NearbyIncidentsMap";


type Incident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

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

export default function Dashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
  }, [user]);

  const fetchIncidents = async () => {
    if (!user) return;
    try {
      const data = await api.get<Incident[]>("/api/incidents");
      setIncidents(data || []);
    } catch {
      toast.error("Failed to load incidents");
    }
    setLoading(false);
  };

  const stats = {
    total: incidents.length,
    pending: incidents.filter((i) => i.status === "pending").length,
    inProgress: incidents.filter((i) => ["reviewing", "in_progress"].includes(i.status)).length,
    resolved: incidents.filter((i) => ["resolved", "closed"].includes(i.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-green flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CivicSafe</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
              <UserCircle className="h-4 w-4 mr-1" /> Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-muted-foreground mt-1">Track and manage your incident reports</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/report")}>
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Reports", value: stats.total, icon: AlertTriangle },
              { label: "Pending", value: stats.pending, icon: Clock },
              { label: "In Progress", value: stats.inProgress, icon: Loader2 },
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

          {/* Nearby incidents map */}
          <div className="mb-8">
            <NearbyIncidentsMap />
          </div>

          {/* Incidents view */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No incidents reported</h3>
              <p className="text-muted-foreground mb-6">Create your first incident report to get started.</p>
              <Button variant="hero" onClick={() => navigate("/report")}>
                <Plus className="mr-2 h-4 w-4" /> Report Incident
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident, i) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => navigate(`/incident/${incident.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
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
                      <Badge variant="outline" className={statusColor[incident.status]}>
                        {incident.status.replace("_", " ")}
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
