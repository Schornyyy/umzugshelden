"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import {
  knowledgeChatMessageSchema,
  knowledgeChatSchema,
  type KnowledgeChat,
  type KnowledgeChatMessage,
} from "@/lib/knowledgeChat";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
} from "@/lib/knowledgeSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import {
  Bot,
  FlaskConical,
  LoaderCircle,
  MessageSquarePlus,
  MessagesSquare,
  Plus,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const chatsResponseSchema = z.object({
  chats: z.array(knowledgeChatSchema),
});
const chatResponseSchema = z.object({
  chat: knowledgeChatSchema,
  messages: z.array(knowledgeChatMessageSchema),
});
const sendResponseSchema = z.object({
  chat: knowledgeChatSchema,
  userMessage: knowledgeChatMessageSchema,
  assistantMessage: knowledgeChatMessageSchema,
});

export default function KnowledgeChatPage() {
  const { companyData } = useCompanyData();
  const [chats, setChats] = useState<KnowledgeChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState<KnowledgeChatMessage[]>([]);
  const [newCategory, setNewCategory] =
    useState<KnowledgeCategory>("marketing");
  const [newTestMode, setNewTestMode] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [content, setContent] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingChat, setUpdatingChat] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const selectedChat =
    chats.find((chat) => chat.id === selectedChatId) ?? null;

  const authorizedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bitte erneut anmelden.");
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [],
  );

  const loadChats = useCallback(async () => {
    if (!companyData?.id) return;
    setLoadingChats(true);
    setError("");
    try {
      const response = await authorizedFetch(
        `/api/admin/knowledge/chats?ownerId=${encodeURIComponent(companyData.id)}`,
        { cache: "no-store" },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readError(result, "Chats konnten nicht geladen werden."));
      }
      const loaded = chatsResponseSchema.parse(result).chats;
      setChats(loaded);
      setSelectedChatId((current) => current || loaded[0]?.id || "");
      if (!loaded.length) setShowNewChat(true);
    } catch (caughtError) {
      console.error("Wissens-Chats laden fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Chats konnten nicht geladen werden.",
      );
    } finally {
      setLoadingChats(false);
    }
  }, [authorizedFetch, companyData?.id]);

  const loadMessages = useCallback(
    async (chatId: string, signal?: AbortSignal) => {
      if (!companyData?.id || !chatId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      setError("");
      try {
        const response = await authorizedFetch(
          `/api/admin/knowledge/chats/${encodeURIComponent(chatId)}?ownerId=${encodeURIComponent(companyData.id)}`,
          { cache: "no-store", signal },
        );
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readError(result, "Chat konnte nicht geladen werden."));
        }
        const loaded = chatResponseSchema.parse(result);
        setMessages(loaded.messages);
        setChats((current) =>
          current.map((chat) => (chat.id === loaded.chat.id ? loaded.chat : chat)),
        );
      } catch (caughtError) {
        if (signal?.aborted) return;
        console.error("Wissens-Chat laden fehlgeschlagen:", caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chat konnte nicht geladen werden.",
        );
      } finally {
        if (!signal?.aborted) setLoadingMessages(false);
      }
    },
    [authorizedFetch, companyData?.id],
  );

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMessages(selectedChatId, controller.signal);
    return () => controller.abort();
  }, [loadMessages, selectedChatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function createChat(event: React.FormEvent) {
    event.preventDefault();
    if (!companyData?.id) return;
    setCreating(true);
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/knowledge/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: companyData.id,
          category: newCategory,
          testMode: newTestMode,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readError(result, "Chat konnte nicht erstellt werden."));
      }
      const chat = knowledgeChatSchema.parse(result);
      setChats((current) => [
        chat,
        ...current.filter((item) => item.id !== chat.id),
      ]);
      setSelectedChatId(chat.id);
      setMessages([]);
      setShowNewChat(false);
      setNewTestMode(false);
    } catch (caughtError) {
      console.error("Wissens-Chat erstellen fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Chat konnte nicht erstellt werden.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleTestMode() {
    if (!companyData?.id || !selectedChat || updatingChat || sending) return;
    setUpdatingChat(true);
    setError("");
    try {
      const response = await authorizedFetch(
        `/api/admin/knowledge/chats/${encodeURIComponent(selectedChat.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId: companyData.id,
            testMode: !selectedChat.testMode,
          }),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          readError(result, "Testmodus konnte nicht geändert werden."),
        );
      }
      const updated = knowledgeChatSchema.parse(result);
      setChats((current) =>
        current
          .map((chat) => (chat.id === updated.id ? updated : chat))
          .sort((first, second) => second.updatedAt - first.updatedAt),
      );
    } catch (caughtError) {
      console.error("Chat-Testmodus ändern fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Testmodus konnte nicht geändert werden.",
      );
    } finally {
      setUpdatingChat(false);
    }
  }

  async function deleteChat() {
    if (!companyData?.id || !selectedChat || deletingChat || sending) return;
    if (
      !window.confirm(
        `Chat „${selectedChat.title}“ und alle Nachrichten endgültig löschen?`,
      )
    ) {
      return;
    }
    setDeletingChat(true);
    setError("");
    try {
      const response = await authorizedFetch(
        `/api/admin/knowledge/chats/${encodeURIComponent(selectedChat.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId: companyData.id }),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readError(result, "Chat konnte nicht gelöscht werden."));
      }
      const remaining = chats.filter((chat) => chat.id !== selectedChat.id);
      setChats(remaining);
      setMessages([]);
      setSelectedChatId(remaining[0]?.id ?? "");
      if (!remaining.length) setShowNewChat(true);
    } catch (caughtError) {
      console.error("Wissens-Chat löschen fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Chat konnte nicht gelöscht werden.",
      );
    } finally {
      setDeletingChat(false);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const message = content.trim();
    if (!companyData?.id || !selectedChatId || !message || sending) return;
    const optimisticId = `pending-${crypto.randomUUID()}`;
    const optimisticMessage: KnowledgeChatMessage = {
      id: optimisticId,
      chatId: selectedChatId,
      role: "user",
      content: message,
      createdAt: Date.now(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    setContent("");
    setSending(true);
    setError("");
    try {
      const response = await authorizedFetch(
        `/api/admin/knowledge/chats/${encodeURIComponent(selectedChatId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId: companyData.id, content: message }),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        await loadMessages(selectedChatId);
        throw new Error(
          readError(result, "Nachricht konnte nicht beantwortet werden."),
        );
      }
      const sent = sendResponseSchema.parse(result);
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticId),
        sent.userMessage,
        sent.assistantMessage,
      ]);
      setChats((current) =>
        [sent.chat, ...current.filter((chat) => chat.id !== sent.chat.id)].sort(
          (first, second) => second.updatedAt - first.updatedAt,
        ),
      );
    } catch (caughtError) {
      console.error("Wissens-Chat Nachricht fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nachricht konnte nicht beantwortet werden.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-7xl flex-col gap-5 pb-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Wissen
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Chat</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gespeicherte Gespräche mit den spezialisierten Wissens-Workflows.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex min-h-[240px] flex-col border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <Button
              type="button"
              disabled={sending}
              className="w-full"
              onClick={() => setShowNewChat((current) => !current)}>
              <MessageSquarePlus size={16} /> Neuer Chat
            </Button>
            {showNewChat && (
              <form
                onSubmit={(event) => void createChat(event)}
                className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <label className="text-sm font-medium text-slate-800">
                  Bereich auswählen
                  <select
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(event.target.value as KnowledgeCategory)
                    }
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                    {KNOWLEDGE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {KNOWLEDGE_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={newTestMode}
                    onChange={(event) => setNewTestMode(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  Testmodus verwenden (`/webhook-test/`). Der n8n-Workflow muss
                  dabei auf eine Testanfrage warten.
                </label>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="mt-3 w-full">
                  {creating ? (
                    <LoaderCircle className="animate-spin" size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  Chat starten
                </Button>
              </form>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingChats ? (
              <p className="flex items-center gap-2 p-3 text-sm text-slate-500">
                <LoaderCircle className="animate-spin" size={16} /> Chats laden ...
              </p>
            ) : chats.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">
                Noch keine Chats vorhanden.
              </p>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    disabled={sending}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full rounded-lg p-3 text-left transition ${
                      selectedChatId === chat.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    }`}>
                    <span className="block truncate text-sm font-semibold">
                      {chat.title}
                    </span>
                    <span
                      className={`mt-1 block text-xs ${
                        selectedChatId === chat.id
                          ? "text-blue-100"
                          : "text-slate-500"
                      }`}>
                      {KNOWLEDGE_CATEGORY_LABELS[chat.category]} ·{" "}
                      {chat.testMode ? "Test · " : ""}
                      {new Intl.DateTimeFormat("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      }).format(chat.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[560px] min-w-0 flex-col">
          {selectedChat ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold text-slate-950">
                      {selectedChat.title}
                    </h2>
                    {selectedChat.testMode && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        <FlaskConical size={12} /> Test
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {KNOWLEDGE_CATEGORY_LABELS[selectedChat.category]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={updatingChat || deletingChat || sending}
                    onClick={() => void toggleTestMode()}>
                    {updatingChat ? (
                      <LoaderCircle className="animate-spin" size={15} />
                    ) : (
                      <FlaskConical size={15} />
                    )}
                    {selectedChat.testMode
                      ? "Testmodus beenden"
                      : "Testmodus aktivieren"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={deletingChat || updatingChat || sending}
                    aria-label="Chat löschen"
                    title="Chat löschen"
                    onClick={() => void deleteChat()}
                    className="text-red-700 hover:bg-red-50 hover:text-red-800">
                    {deletingChat ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                {loadingMessages ? (
                  <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                    <LoaderCircle className="animate-spin" size={18} />
                    Verlauf wird geladen ...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="mx-auto max-w-lg py-16 text-center">
                    <Bot className="mx-auto text-blue-600" size={34} />
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">
                      Neuer {KNOWLEDGE_CATEGORY_LABELS[selectedChat.category]}-Chat
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Schreiben Sie Ihre erste Nachricht. Der Verlauf wird
                      automatisch gespeichert.
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-4">
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}>
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-900 text-white"
                          }`}>
                          {message.role === "user" ? (
                            <UserRound size={17} />
                          ) : (
                            <Bot size={17} />
                          )}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            message.role === "user"
                              ? "whitespace-pre-wrap rounded-tr-sm bg-blue-600 text-white"
                              : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                          }`}>
                          {message.role === "assistant" ? (
                            <MarkdownMessage content={message.content} />
                          ) : (
                            message.content
                          )}
                        </div>
                      </article>
                    ))}
                    {sending && (
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Bot size={17} />
                        </span>
                        <span className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <LoaderCircle className="animate-spin" size={16} />
                          Antwort wird erstellt ...
                        </span>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => void sendMessage(event)}
                className="border-t border-slate-200 bg-white p-3 sm:p-4">
                <div className="mx-auto flex max-w-3xl items-end gap-3">
                  <textarea
                    required
                    rows={2}
                    maxLength={20_000}
                    value={content}
                    disabled={sending}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Nachricht schreiben ..."
                    className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !content.trim()}
                    aria-label="Nachricht senden"
                    className="h-12 w-12 shrink-0 rounded-xl">
                    {sending ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessagesSquare className="text-slate-400" size={38} />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                Chat auswählen oder neu starten
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Jeder neue Chat wird einem Wissensbereich und dessen n8n-Workflow
                zugeordnet.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function readError(value: unknown, fallback: string) {
  return value && typeof value === "object" && "error" in value
    ? String(value.error)
    : fallback;
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-5 text-xl font-bold first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-5 text-lg font-bold first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-4 font-bold first:mt-0">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="my-3 first:mt-0 last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-slate-950">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 list-decimal space-y-2 pl-6">{children}</ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-blue-300 bg-blue-50 px-4 py-2 text-slate-700">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900">
            {children}
          </a>
        ),
        code: ({ children, className }) => (
          <code
            className={`${className ?? ""} rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900`}>
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <table className="my-4 block w-full overflow-x-auto border-collapse text-left text-sm">
            {children}
          </table>
        ),
        th: ({ children }) => (
          <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-slate-300 px-3 py-2 align-top">
            {children}
          </td>
        ),
        hr: () => <hr className="my-5 border-slate-200" />,
      }}>
      {content}
    </ReactMarkdown>
  );
}
