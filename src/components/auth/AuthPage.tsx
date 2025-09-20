import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AuthPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [signin, setSignin] = useState({ email: '', password: '' });
  const [signup, setSignup] = useState({ email: '', password: '', name: '' });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: signin.email, password: signin.password });
      if (error) throw error;
      toast({ title: 'Signed in' });
    } catch (err: any) {
      toast({ title: 'Sign in failed', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: signup.email,
        password: signup.password,
        options: { data: { full_name: signup.name } },
      });
      if (error) throw error;
      if (!data.session) {
        toast({ title: 'Check your email', description: 'We sent a confirmation link.' });
      } else {
        toast({ title: 'Account created' });
      }
    } catch (err: any) {
      toast({ title: 'Sign up failed', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:block relative">
        <img src="/placeholder.svg" alt="Placeholder" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-card border shadow-ocean">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" value={signin.email} onChange={(e) => setSignin({ ...signin, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" value={signin.password} onChange={(e) => setSignin({ ...signin, password: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>Sign In</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Name</Label>
                    <Input id="signup-name" value={signup.name} onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>Create Account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
