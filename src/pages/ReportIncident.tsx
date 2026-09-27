import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Shield, Upload, MapPin, Brain, ArrowLeft, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  "fire", "medical", "crime", "traffic_accident", "natural_disaster",
  "hazardous_material", "public_disturbance", "infrastructure", "other",
] as const;

const severities = ["low", "medium", "high", "critical"] as const;

export default function ReportIncident() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [severity, setSeverity] = useState<string>("medium");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; description: string; category: string; severity: string } | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    selectedFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        toast.success("Location captured");
      },
      () => toast.error("Could not get location")
    );
  }, []);

  const analyzeWithAI = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one image/video first");
      return;
    }
    setAiProcessing(true);

    try {
      // Convert first image to base64
      const file = files[0];
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const data = await api.post<{ title: string; description: string; category: string; severity: string }>(
        "/api/ai/analyze-incident",
        { image: base64, fileCount: files.length }
      );
      setAiResult(data);
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.severity) setSeverity(data.severity);
      toast.success("AI analysis complete! Review and edit the fields below before submitting.");
    } catch (err) {
      console.error(err);
      toast.error("AI analysis failed. You can still submit manually.");
    }
    setAiProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      // Upload media
      const mediaUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("incident-media").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("incident-media").getPublicUrl(path);
        mediaUrls.push(urlData.publicUrl);
      }

      await api.post("/api/incidents", {
        title: title.trim() || "Incident Report",
        description: description.trim() || null,
        category,
        severity,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        address: address || null,
        media_urls: mediaUrls,
        ai_summary: aiResult?.description || null,
        ai_classification: aiResult || null,
      });

      toast.success("Incident reported successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    }
    setSubmitting(false);
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
          </Link>
        </div>
      </nav>

      <div className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="glass-card rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Report an Incident</h1>
            <p className="text-muted-foreground mb-8">Upload media and let AI generate the report for you.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Media Upload */}
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">Upload Photos/Videos</Label>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/20">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload or drag files</span>
                  <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFiles} />
                </label>

                {previews.length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {previews.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg border border-border/50" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Analyze Button */}
              <Button
                type="button"
                variant="hero-outline"
                className="w-full"
                onClick={analyzeWithAI}
                disabled={aiProcessing || files.length === 0}
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" /> Analyze with AI
                  </>
                )}
              </Button>

              {/* AI provenance note */}
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-2"
                >
                  <Brain className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-primary">
                    AI analysis complete — the fields below have been filled in. Review and edit as needed.
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Click 'Analyze with AI' above, or type a title yourself"
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's happening? Describe the incident, or let AI describe it from your photo."
                  className="bg-secondary/50 border-border/50 min-h-[120px]"
                />
              </div>

              {/* Category + Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severities.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">Location</Label>
                <div className="flex gap-3">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address or location description"
                    className="bg-secondary/50 border-border/50 flex-1"
                  />
                  <Button type="button" variant="outline" onClick={getLocation}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {location && (
                  <p className="text-xs text-muted-foreground mt-2">
                    📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
