import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowLeft, User, Phone, Mail, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(100, "Max 100 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Max 20 characters")
    .regex(/^[+\d\s\-()]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});

  useEffect(() => {
    if (!user) return;
    api
      .get<{ full_name: string | null; phone: string | null }>("/api/profile")
      .then((data) => {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse({ full_name: fullName, phone });
    if (!result.success) {
      const fieldErrors: { full_name?: string; phone?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as "full_name" | "phone";
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      await api.put("/api/profile", {
        full_name: result.data.full_name,
        phone: result.data.phone || null,
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to save profile");
    }
    setSaving(false);
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container py-10 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="pl-10 bg-secondary/30 border-border/30 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-muted-foreground text-sm">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      maxLength={100}
                      className={`pl-10 bg-secondary/50 border-border/50 focus:border-primary ${
                        errors.full_name ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-muted-foreground text-sm">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      maxLength={20}
                      className={`pl-10 bg-secondary/50 border-border/50 focus:border-primary ${
                        errors.phone ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" variant="hero" size="lg" disabled={saving}>
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
