import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, ArrowLeft, MapPin, Clock, AlertTriangle, Image, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function IncidentDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<any>(`/api/incidents/${id}`)
      .then((data) => setIncident(data))
      .catch(() => {
        toast.error("Incident not found");
        navigate("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/incidents/${id}`);
      toast.success("Report deleted");
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch {
      toast.error("Failed to delete report");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!incident) return null;

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    reviewing: "bg-info/10 text-info border-info/20",
    in_progress: "bg-primary/10 text-primary border-primary/20",
    resolved: "bg-success/10 text-success border-success/20",
    closed: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-green flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CivicSafe</span>
          </Link>
        </div>
      </nav>

      <div className="container max-w-3xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Report
              </Button>
            )}
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{incident.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="capitalize">{incident.category?.replace("_", " ")}</span>
                  <Badge variant="outline" className={statusColor[incident.status] || ""}>
                    {incident.status?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <Badge className={
                incident.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                incident.severity === "high" ? "bg-destructive/80 text-destructive-foreground" :
                incident.severity === "medium" ? "bg-warning text-warning-foreground" :
                "bg-muted text-muted-foreground"
              }>
                {incident.severity}
              </Badge>
            </div>

            {incident.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                <p className="text-foreground leading-relaxed">{incident.description}</p>
              </div>
            )}

            {incident.ai_summary && incident.ai_summary.trim() !== (incident.description || "").trim() && (
              <div className="mb-6 rounded-xl bg-primary/5 border border-primary/20 p-4">
                <h3 className="text-sm font-semibold text-primary mb-2">
                  AI Summary <span className="font-normal text-muted-foreground">(original AI analysis, before edits)</span>
                </h3>
                <p className="text-foreground text-sm">{incident.ai_summary}</p>
              </div>
            )}

            {/* Location */}
            {(incident.address || incident.latitude) && (
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {incident.address || `${incident.latitude}, ${incident.longitude}`}
              </div>
            )}

            {/* Media */}
            {incident.media_urls && incident.media_urls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" /> Attached Media
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {incident.media_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="rounded-lg border border-border/50 object-cover h-40 w-full hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/30">
              <Clock className="h-3 w-3" />
              Reported on {new Date(incident.created_at).toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>

      {isAdmin && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this report?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes "{incident.title}" and its uploaded media. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
