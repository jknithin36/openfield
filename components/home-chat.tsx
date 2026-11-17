"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  Cancel01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { answer, SUGGESTIONS, type HelperLink } from "@/lib/chat/helper";
import { useCenterSources } from "@/components/site/centers/use-center-sources";

type Entry = { id: string; role: "user" | "helper"; text: string; links: HelperLink[] };

const focusRing = "focus-visible:ring-3 focus-visible:ring-ring";
const GREETING: Entry = {
  id: "hello",
  role: "helper",
  text: "Hi, I'm the Openfield helper. Ask me about borrowing items, free courses, events or family guides.",
  links: [],
};

function HelperAvatar() {
  return (
    <MessageAvatar>
      <Avatar className="size-8">
        <AvatarFallback className="bg-brand-soft">
          <Image src="/logo.svg" alt="" width={16} height={16} className="size-4" />
        </AvatarFallback>
      </Avatar>
    </MessageAvatar>
  );
}

/**
 * A small helper on the home page: a floating button opens a popover chat.
 * Answers come from the site's own live data (lib/chat/helper.ts).
 */
export function HomeChat() {
  const s = useCenterSources();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([GREETING]);
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const count = useRef(0);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || !s) return;
    const n = ++count.current;
    setEntries((list) => [
      ...list,
      { id: `u${n}`, role: "user", text: q, links: [] },
      { id: `h${n}`, role: "helper", ...answer(q, s) },
    ]);
    setText("");
    input.current?.focus();
  };

  const asked = entries.some((e) => e.role === "user");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            className={`fixed right-6 bottom-6 z-40 h-11 gap-2 rounded-full bg-brand pr-4.5 pl-4 text-[15px] font-medium text-white shadow-md ring-1 shadow-brand/25 ring-white/15 ring-inset hover:bg-brand-hover print:hidden ${focusRing}`}
          />
        }
      >
        <HugeiconsIcon
          icon={BubbleChatIcon}
          strokeWidth={1.8}
          data-icon="inline-start"
          className="size-[18px]"
        />
        Ask a question
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        initialFocus={input}
        className="h-[min(34rem,calc(100svh-7rem))] w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <PopoverTitle className="text-base font-semibold text-ink">Ask Openfield</PopoverTitle>
            <PopoverDescription className="text-sm text-neutral-600">
              Quick answers from our website.
            </PopoverDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className={`-mr-1 size-10 ${focusRing}`}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="gap-4 px-4 py-4"
              >
                {entries.map((e) => (
                  <MessageScrollerItem key={e.id} messageId={e.id} scrollAnchor={e.role === "user"}>
                    {e.role === "user" ? (
                      <Message align="end">
                        <MessageContent>
                          <Bubble variant="default" align="end">
                            <BubbleContent className="bg-brand text-[15px] text-white">
                              <span className="sr-only">You said: </span>
                              {e.text}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    ) : (
                      <Message align="start">
                        <HelperAvatar />
                        <MessageContent>
                          <Bubble variant="tinted" className="max-w-[90%]">
                            <BubbleContent className="text-[15px] text-ink">
                              <span className="sr-only">Openfield helper: </span>
                              {e.text}
                              {e.links.length > 0 && (
                                <ul className="mt-2 flex flex-col gap-1">
                                  {e.links.map((l) => (
                                    <li key={l.href + l.label}>
                                      <Link
                                        href={l.href}
                                        onClick={() => setOpen(false)}
                                        className={`inline-flex min-h-9 items-center gap-1 rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand ${focusRing}`}
                                      >
                                        {l.label}
                                        <HugeiconsIcon
                                          icon={ArrowRight01Icon}
                                          strokeWidth={2}
                                          aria-hidden="true"
                                          className="size-3.5 shrink-0"
                                        />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    )}
                  </MessageScrollerItem>
                ))}

                {!asked && (
                  <MessageScrollerItem messageId="suggestions">
                    <div className="flex flex-col gap-2 pl-10">
                      <Marker>
                        <MarkerContent>Try asking</MarkerContent>
                      </Marker>
                      <ul className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((q) => (
                          <li key={q}>
                            <Button
                              variant="outline"
                              onClick={() => ask(q)}
                              disabled={!s}
                              className={`h-auto min-h-10 rounded-full px-3.5 py-2 text-left text-sm whitespace-normal ${focusRing}`}
                            >
                              {q}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
          className="border-t border-border p-3"
        >
          <Label htmlFor="helper-input" className="sr-only">
            Type your question
          </Label>
          <InputGroup className="h-12 bg-white">
            <InputGroupInput
              ref={input}
              id="helper-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question"
              autoComplete="off"
              maxLength={200}
              className="text-base"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                size="icon-sm"
                variant="default"
                disabled={!text.trim() || !s}
                className={`bg-brand text-white hover:bg-brand-hover ${focusRing}`}
              >
                <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <p className="mt-2 px-1 text-xs text-neutral-600">
            Automatic answers. For anything personal,{" "}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className={`rounded-sm font-medium text-brand underline underline-offset-2 ${focusRing}`}
            >
              contact our team
            </Link>
            .
          </p>
        </form>
      </PopoverContent>
    </Popover>
  );
}
