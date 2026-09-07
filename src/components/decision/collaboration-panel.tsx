"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DecisionComment, DecisionMember, DecisionNote, NoteType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime, initials } from "@/lib/utils";
import { Send, UserPlus } from "lucide-react";

const NOTE_VARIANT: Record<NoteType, "success" | "danger" | "info" | "muted"> = {
  pro: "success",
  concern: "danger",
  question: "info",
  implementation: "muted",
};

export function CollaborationPanel({
  decisionId,
  comments,
  notes,
  members,
}: {
  decisionId: string;
  comments: DecisionComment[];
  notes: DecisionNote[];
  members: DecisionMember[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [commentBody, setCommentBody] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("question");
  const [inviteName, setInviteName] = useState("");

  async function postComment() {
    if (!commentBody.trim()) return;
    await fetch(`/api/decisions/${decisionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody }),
    });
    setCommentBody("");
    startTransition(() => router.refresh());
  }

  async function postNote() {
    if (!noteBody.trim()) return;
    await fetch(`/api/decisions/${decisionId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody, type: noteType }),
    });
    setNoteBody("");
    startTransition(() => router.refresh());
  }

  async function invite() {
    if (!inviteName.trim()) return;
    await fetch(`/api/decisions/${decisionId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inviteName, role: "member" }),
    });
    setInviteName("");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-900">Comments</p>
          <div className="space-y-3 max-h-72 overflow-y-auto matchiq-scrollbar">
            {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-800 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {initials(c.authorName)}
                </div>
                <div>
                  <p className="text-xs">
                    <span className="font-semibold text-slate-900">{c.authorName}</span>{" "}
                    <span className="text-slate-400">{relativeTime(c.createdAt)}</span>
                  </p>
                  <p className="text-sm text-slate-700 mt-0.5">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Textarea rows={1} value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add a comment... use @Name to mention" />
            <Button size="sm" onClick={postComment}><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Team</p>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{m.userName}</span>
                  <Badge variant="muted">{m.role}</Badge>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Invite by name" className="text-xs" />
              <Button size="sm" variant="outline" onClick={invite}><UserPlus className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-900">Structured notes</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {notes.length === 0 && <p className="text-xs text-slate-400">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <Badge variant={NOTE_VARIANT[n.type]}>{n.type}</Badge>
                  <span className="text-[10px] text-slate-400">{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 mt-1.5">{n.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">— {n.authorName}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)} className="sm:w-40">
              <option value="pro">Pro</option>
              <option value="concern">Concern</option>
              <option value="question">Question</option>
              <option value="implementation">Implementation</option>
            </Select>
            <Input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add a structured note..." />
            <Button size="sm" onClick={postNote}>Add note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
