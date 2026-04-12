import { useState, useEffect } from "react";
import api from "../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ShareDialog({ noteId }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("READ");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/${noteId}/shares`);
      setShares(res.data);
    } catch (err) {
      console.error("Failed to load shares", err);
      // 404 or 403 means they are not the owner
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchShares();
      setError("");
      setEmail("");
    }
  }, [open, noteId]);

  const handleAddShare = async (e) => {
    e.preventDefault();
    if (!email) return;
    setAdding(true);
    setError("");
    try {
      await api.post(`/notes/${noteId}/shares`, { email, role });
      setEmail("");
      setRole("READ");
      fetchShares();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (shareId, newRole) => {
    try {
      await api.put(`/notes/${noteId}/shares/${shareId}`, { role: newRole });
      fetchShares();
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleRemoveShare = async (shareId) => {
    try {
      await api.delete(`/notes/${noteId}/shares/${shareId}`);
      fetchShares();
    } catch (err) {
      console.error("Failed to remove share", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Invite others to view or edit this note.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddShare} className="flex items-end gap-2 mt-4">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="email" className="sr-only">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="READ">Viewer</SelectItem>
                <SelectItem value="EDIT">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={adding || !email}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Collaborators</h4>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              This note is not shared with anyone yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate flex-1" title={share.userEmail}>
                    {share.userEmail}
                  </span>
                  <div className="w-28 shrink-0">
                    <Select
                      value={share.role}
                      onValueChange={(val) => handleUpdateRole(share.id, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ" className="text-xs">Viewer</SelectItem>
                        <SelectItem value="EDIT" className="text-xs">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveShare(share.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
