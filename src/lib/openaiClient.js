// src/lib/openaiClient.js
/* eslint-disable no-console */

function normalizeContent(content) {
    // 허용: string 그대로
    if (typeof content === "string") return content;

    // 허용: content parts 배열 (e.g., [{type:"text", text:"..."}])
    if (Array.isArray(content)) {
        // 배열 내 원소가 문자열이면 text part로 변환
        return content.map((p) =>
            typeof p === "string" ? { type: "text", text: p } : p
        );
    }

    // object로 들어온 경우 → 문자열로 직렬화해서 보냄 (API 요구사항 충족)
    try {
        return JSON.stringify(content);
    } catch {
        return String(content);
    }
}

function sanitizeMessages(messages = []) {
    return messages.map((m, i) => {
        const role = m.role || (i === 0 ? "system" : "user");
        return { role, content: normalizeContent(m.content) };
    });
}

export async function chatComplete({
    apiKey,
    messages,
    model = "gpt-4.1",
    max_completion_tokens = 3000,
    temperature = 1,
    top_p,
    presence_penalty,
    frequency_penalty,
    signal,
    continueIfTruncated = false,
    maxContinues = 2,
}) {
    if (!apiKey) throw new Error("OpenAI apiKey가 없습니다.");

    const isModern = /^gpt-(5|4\.1|4o)/.test(model);

    const once = async (callMessagesRaw) => {
        const callMessages = sanitizeMessages(callMessagesRaw); // ✅ 여기서 정규화

        const body = { model, messages: callMessages, max_completion_tokens };
        if (!isModern) {
            if (temperature != null) body.temperature = temperature;
            if (top_p != null) body.top_p = top_p;
            if (presence_penalty != null) body.presence_penalty = presence_penalty;
            if (frequency_penalty != null) body.frequency_penalty = frequency_penalty;
        }

        console.groupCollapsed("[openaiClient.chatComplete] → request");
        console.log("model:", model);
        console.log("body:", body);
        console.groupEnd();

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal,
        });

        const rawText = await res.text().catch(() => "");
        let json = null;
        try { json = rawText ? JSON.parse(rawText) : null; } catch { }

        console.groupCollapsed("[openaiClient.chatComplete] ← response");
        console.log("status:", res.status, res.statusText);
        console.log("rawText:", rawText);
        console.log("json:", json);
        console.groupEnd();

        if (!res.ok) {
            throw new Error(`OpenAI API 오류: ${res.status} ${res.statusText} ${rawText}`);
        }

        const choice = json?.choices?.[0];
        return {
            content: choice?.message?.content ?? "",
            finish_reason: choice?.finish_reason ?? null,
            usage: json?.usage ?? null,
            json,
            rawText,
        };
    };

    let history = [...(messages || [])];
    let { content, finish_reason, usage, json, rawText } = await once(history);

    if (continueIfTruncated) {
        let acc = content || "";
        let times = 0;
        while (finish_reason === "length" && times < maxContinues) {
            times++;
            history = [...history, { role: "assistant", content }, { role: "user", content: "계속" }];
            const next = await once(history);
            acc += (acc && next.content ? "\n" : "") + (next.content || "");
            content = acc;
            finish_reason = next.finish_reason;
        }
    }

    return { content, finish_reason, usage, json, rawText };
}
