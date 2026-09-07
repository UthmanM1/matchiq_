import { DecisionComment, DecisionMember, DecisionNote, DecisionVote, NoteType, VoteValue } from "@/types";
import { db, newId, nowIso } from "@/lib/store/db";
import { AnalyticsService } from "./AnalyticsService";

export const CollaborationService = {
  listMembers(decisionId: string): DecisionMember[] {
    return db.members.filter((m) => m.decisionId === decisionId);
  },

  invite(decisionId: string, userId: string, userName: string, role: DecisionMember["role"] = "member") {
    const member: DecisionMember = { id: newId("mem"), decisionId, userId, userName, role, addedAt: nowIso() };
    db.members.push(member);
    return CollaborationService.listMembers(decisionId);
  },

  addComment(decisionId: string, organisationId: string, authorId: string, authorName: string, body: string, vendorId?: string) {
    // Matches @Name or @First Last (up to 3 capitalised words) without
    // swallowing the rest of the sentence.
    const mentions = Array.from(body.matchAll(/@([A-Z][a-zA-Z'-]*(?:\s[A-Z][a-zA-Z'-]*){0,2})/g)).map((m) => m[1].trim());
    const comment: DecisionComment = {
      id: newId("cmt"),
      decisionId,
      vendorId,
      authorId,
      authorName,
      body,
      mentions,
      createdAt: nowIso(),
    };
    db.comments.push(comment);
    AnalyticsService.track(organisationId, authorId, "comment_created", { decisionId, vendorId });
    return comment;
  },

  listComments(decisionId: string, vendorId?: string): DecisionComment[] {
    return db.comments
      .filter((c) => c.decisionId === decisionId && (vendorId ? c.vendorId === vendorId : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },

  vote(decisionId: string, organisationId: string, vendorId: string, voterId: string, voterName: string, value: VoteValue) {
    const existing = db.votes.find((v) => v.decisionId === decisionId && v.vendorId === vendorId && v.voterId === voterId);
    if (existing) {
      existing.value = value;
      existing.createdAt = nowIso();
    } else {
      db.votes.push({ id: newId("vote"), decisionId, vendorId, voterId, voterName, value, createdAt: nowIso() });
      AnalyticsService.track(organisationId, voterId, "vote_created", { decisionId, vendorId, value });
    }
    return CollaborationService.getVotes(decisionId, vendorId);
  },

  getVotes(decisionId: string, vendorId?: string): DecisionVote[] {
    return db.votes.filter((v) => v.decisionId === decisionId && (vendorId ? v.vendorId === vendorId : true));
  },

  voteSummary(decisionId: string, vendorId: string) {
    const votes = CollaborationService.getVotes(decisionId, vendorId);
    return {
      strong_choice: votes.filter((v) => v.value === "strong_choice").length,
      acceptable: votes.filter((v) => v.value === "acceptable").length,
      not_suitable: votes.filter((v) => v.value === "not_suitable").length,
      total: votes.length,
    };
  },

  addNote(decisionId: string, type: NoteType, body: string, authorId: string, authorName: string, vendorId?: string) {
    const note: DecisionNote = { id: newId("note"), decisionId, vendorId, type, body, authorId, authorName, createdAt: nowIso() };
    db.notes.push(note);
    return note;
  },

  listNotes(decisionId: string, vendorId?: string): DecisionNote[] {
    return db.notes.filter((n) => n.decisionId === decisionId && (vendorId ? n.vendorId === vendorId : true));
  },
};
