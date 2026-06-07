import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../config/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signupError) throw signupError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Notely</h1>
          <p className="text-sm text-muted-foreground">
            Your workspace for ideas
          </p>
        </div>

        <Card>
          {success ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  We sent a confirmation link to <strong>{email}</strong>. Verify your email to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>
                  Get started with Notely for free
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    Create account
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Secure, fast, and built for productivity.
        </p>
      </div>
    </div>
  );
}
