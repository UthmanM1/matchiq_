import { getSession } from "@/lib/auth";
import { db } from "@/lib/store/db";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;
  const org = db.organisations.find((o) => o.id === session.organisationId);
  const members = db.organisationMembers.filter((m) => m.organisationId === session.organisationId);
  const profiles = db.profiles.filter((p) => p.organisationId === session.organisationId);

  return (
    <div>
      <Topbar title="Settings" fullName={session.fullName} />
      <div className="p-4 lg:p-8 max-w-2xl space-y-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">{initials(session.fullName)}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{session.fullName}</p>
                <p className="text-xs text-slate-500">{session.email}</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Full name
              <Input defaultValue={session.fullName} className="mt-1" disabled />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Email
              <Input defaultValue={session.email} className="mt-1" disabled />
            </label>
            <p className="text-[11px] text-slate-400">Profile editing is disabled in this demo build.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Organisation</CardTitle>
              <CardDescription>Members only see decisions that belong to this organisation</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Organisation name
              <Input defaultValue={org?.name} className="mt-1" disabled />
            </label>
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1.5">Members</p>
              <div className="space-y-1.5">
                {members.map((m) => {
                  const profile = profiles.find((p) => p.id === m.userId);
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{profile?.fullName || m.userId}</span>
                      <Badge variant="muted">{m.role}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Personalisation options</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-500">
            <p>Currency: GBP (£)</p>
            <p>Date format: DD Month YYYY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Not wired to email delivery in this demo build</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-500">
            <p>Comment mentions, votes, and status changes would notify here in production.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
