import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../../core/settings';
import { t } from '../../i18n/strings';
import {
  hasGeminiApiKey,
  sendGeminiMessage,
  type ChatMessage,
} from '../../services/geminiChat';

const STORAGE_KEY = 'premt-chat-history';

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore */
  }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ChatBotProps {
  language: Language;
}

export function ChatBot({ language }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const configured = hasGeminiApiKey();

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!configured) {
      setError(t(language, 'chatNoKey'));
      return;
    }

    setError(null);
    const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendGeminiMessage(next, language);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', text: reply }]);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setError(code === 'MISSING_API_KEY' ? t(language, 'chatNoKey') : t(language, 'chatError'));
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [configured, language, loading, messages]);

  const clearChat = () => {
    setMessages([]);
    setError(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const suggestions = ['chatSuggest1', 'chatSuggest2', 'chatSuggest3'] as const;

  return (
    <section className="section sectionAlt" id="chat">
      <div className="sectionInner">
        <h2>{t(language, 'chatTitle')}</h2>
        <p className="sectionIntro">{t(language, 'chatIntro')}</p>

        <div className="chatPanel">
          {!configured && (
            <div className="chatNotice" role="status">
              <strong>{t(language, 'chatNoKeyTitle')}</strong>
              <p>{t(language, 'chatNoKey')}</p>
              <a
                className="chatNoticeLink"
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio →
              </a>
            </div>
          )}

          <div className="chatMessages" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="chatWelcome">
                <p>{t(language, 'chatWelcome')}</p>
                <div className="chatSuggestions">
                  {suggestions.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="chatSuggestBtn"
                      disabled={loading}
                      onClick={() => send(t(language, key))}
                    >
                      {t(language, key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatBubble ${msg.role === 'user' ? 'chatBubbleUser' : 'chatBubbleAssistant'}`}
              >
                <span className="chatBubbleRole">
                  {msg.role === 'user' ? t(language, 'chatYou') : t(language, 'chatBot')}
                </span>
                <p className="chatBubbleText">{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div className="chatBubble chatBubbleAssistant">
                <span className="chatBubbleRole">{t(language, 'chatBot')}</span>
                <p className="chatBubbleText chatTyping">{t(language, 'chatTyping')}</p>
              </div>
            )}
          </div>

          {error && <p className="chatError">{error}</p>}

          <form
            className="chatForm"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              ref={inputRef}
              className="chatInput"
              rows={2}
              value={input}
              placeholder={t(language, 'chatPlaceholder')}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <div className="chatActions">
              <button
                type="button"
                className="btn btnGhost chatClearBtn"
                disabled={loading || messages.length === 0}
                onClick={clearChat}
              >
                {t(language, 'chatClear')}
              </button>
              <button
                type="submit"
                className="btn btnPrimary"
                disabled={loading || !input.trim()}
              >
                {t(language, 'chatSend')}
              </button>
            </div>
          </form>

          <p className="chatDisclaimer">{t(language, 'chatDisclaimer')}</p>
        </div>
      </div>
    </section>
  );
}
