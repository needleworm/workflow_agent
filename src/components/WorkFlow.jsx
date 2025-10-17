// WorkFlow.jsx
import React, { useCallback, useState, useEffect } from "react";
import "./workflow.css";
import { chatComplete } from "../lib/openaiClient"; // ✅ 공용 유틸 임포트

// 파일 하단(혹은 상단)에 컴포넌트 정의
function LoadingDots({ text = "평가 중.", interval = 350 }) {
    const [dots, setDots] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setDots((d) => (d + 1) % 4), interval);
        return () => clearInterval(id);
    }, [interval]);
    return (
        <span className="wf-loading">
            {text}
            <span className="wf-dots">{'.'.repeat(dots)}</span>
        </span>
    );
}

export default function WorkFlow({ tree, setTree, apiKey }) {
    // ✅ 모델 옵션 (표시Label → 실제 API 모델명 매핑)
    const MODEL_OPTIONS = [
        { label: "GPT 5", key: "gpt-5" },
        { label: "GPT 5 mini", key: "gpt-5-mini" },
        { label: "GPT 4.1", key: "gpt-4.1" },
        { label: "GPT 4o", key: "gpt-4o" },
    ];

    const [modelKey, setModelKey] = useState("gpt-4.1"); // 기본값
    const [modelMenuOpen, setModelMenuOpen] = useState(false);

    const toggleModelMenu = () => setModelMenuOpen((v) => !v);
    const chooseModel = (key) => {
        setModelKey(key);
        setModelMenuOpen(false);
    };

    const workflow = Array.isArray(tree?.workflow) ? tree.workflow : [];
    // 🔧 프롬프트 설정 모달 상태
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptDraft, setPromptDraft] = useState("");

    // 열기
    const openPromptModal = () => {
        setPromptDraft(evaluationPrompt);
        setIsPromptOpen(true);
    };

    // 저장
    const savePrompt = () => {
        setEvaluationPrompt(promptDraft);
        setIsPromptOpen(false);
    };

    // 취소(닫기)
    const closePrompt = () => {
        setIsPromptOpen(false);
    };


    const [evaluationPrompt, setEvaluationPrompt] = useState(
        "너는 기업의 R&D/상용화 워크플로우를 평가하는 전문가 컨설턴트다. 입력으로 주어진 트리(노드와 children) 구조를 보고 '이 업무 구조가 생성형 AI를 적용하기에 적합한지'를 평가하라. 특히 적용 시 어려운 점(데이터 품질, 승인체계, 보안/법규, 책임소재, 인간 의사결정/관계, 장비/물리 실험 등)을 항목별로 명확히 서술하라. 과장 없이 실무 기준으로 답하라. 출력은 다음 구조를 따르라:\n\n- 총평 (한 문장)\n- 적합 영역 (불릿)\n- 비적합/주의 영역 (불릿)\n- 예상 난관 (불릿)\n- 예상 효과 (불릿)\n- 총 10줄 이내로 답변하라.",
    )

    const [evalState, setEvalState] = useState({ open: false, loading: false, text: "", title: "" });

    const updateAtPath = useCallback((draft, path, updater) => {
        if (!path?.length) return updater(draft);
        const [head, ...rest] = path;
        const clone = Array.isArray(draft) ? [...draft] : { ...draft };
        clone[head] = updateAtPath(clone[head], rest, updater);
        return clone;
    }, []);

    const addChild = useCallback((path) => {
        setTree((prev) =>
            updateAtPath(prev, path, (node) => {
                const next = { ...(node || {}) };
                if (!Array.isArray(next.children)) next.children = [];
                next.children = [...next.children, { task: "업무를 입력하세요", blink: true, children: [] }];
                return next;
            })
        );
    }, [setTree, updateAtPath]);

    const removeNode = useCallback((path) => {
        if (!path || path.length < 2) return;
        const parentPath = path.slice(0, -1);
        const myKey = path[path.length - 1];

        setTree((prev) =>
            updateAtPath(prev, parentPath, (parent) => {
                if (Array.isArray(parent)) {
                    const arr = [...parent];
                    arr.splice(myKey, 1);
                    return arr;
                }
                if (parent && Array.isArray(parent.children)) {
                    const arr = [...parent.children];
                    arr.splice(myKey, 1);
                    return { ...parent, children: arr };
                }
                return parent;
            })
        );
    }, [setTree, updateAtPath]);

    const editField = useCallback((path, field, value) => {
        setTree((prev) =>
            updateAtPath(prev, path, (node) => ({ ...(node || {}), [field]: value }))
        );
    }, [setTree, updateAtPath]);

    // ✅ 서브트리 추출 (자기 자신 + 모든 children)
    const extractSubtree = useCallback((node) => {
        if (!node) return null;
        const base = {};
        if (node.title) base.title = node.title;
        if (node.task) base.task = node.task;
        if (Array.isArray(node.children) && node.children.length) {
            base.children = node.children.map(extractSubtree);
        }
        return base;
    }, []);

    // ✅ OpenAI 평가 실행
    const runEvaluation = useCallback(async (node) => {
        const subtree = extractSubtree(node);
        const jsonStr = JSON.stringify(subtree, null, 2);

        setEvalState({ open: true, loading: true, text: "", title: node.title || node.task || "평가" });

        try {
            const messages = [
                {
                    role: "system",
                    content: evaluationPrompt,

                },
                {
                    role: "user",
                    content: jsonStr,
                },
            ];

            const { content, finish_reason, usage, json, rawText } = await chatComplete({
                apiKey,
                messages,
                model: modelKey,           // ✅ 선택된 모델로 호출
                continueIfTruncated: true,
            });

            setEvalState((s) => ({
                ...s,
                loading: false,
                text: content,                 // ✅ 모달 본문은 '문자열'만
                meta: { finish_reason, usage },// (선택) 토큰/종료사유는 따로 저장
                raw: rawText,                  // (선택) 원문 응답 저장
                json,                          // (선택) 파싱된 JSON 저장
            }));
        } catch (err) {
            setEvalState((s) => ({
                ...s,
                loading: false,
                text: `⚠️ 평가 중 오류가 발생했습니다.\n${String(err.message || err)}`,
            }));
        }
    }, [apiKey, extractSubtree]);

    return (
        <div className="wf-root">
            <div className="wf-toolbar">
                <button className="wf-primary" onClick={openPromptModal}>프롬프트 설정</button>

                <div className="wf-model-switch">
                    <button className="wf-secondary" onClick={toggleModelMenu}>
                        AI모델 변경 · <strong>{MODEL_OPTIONS.find(o => o.key === modelKey)?.label}</strong>
                    </button>

                    {modelMenuOpen && (
                        <div className="wf-dropdown" onMouseLeave={() => setModelMenuOpen(false)}>
                            {MODEL_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    className={`wf-dropdown-item ${opt.key === modelKey ? "active" : ""}`}
                                    onClick={() => chooseModel(opt.key)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {workflow.map((rootNode, idx) => (
                <div key={idx} className="wf-block">
                    <TreeNode
                        node={rootNode}
                        path={["workflow", idx]}
                        addChild={addChild}
                        removeNode={removeNode}
                        editField={editField}
                        onEval={runEvaluation}         // ✅ 평가 핸들러 전달
                        isRoot
                        depth={0}
                    />
                </div>
            ))}
            {/* 🧠 프롬프트 설정 모달 */}
            {isPromptOpen && (
                <div className="wf-modal-backdrop" onClick={closePrompt}>
                    <div className="wf-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wf-modal-header">
                            <strong>프롬프트 설정</strong>
                            <button className="wf-modal-close" onClick={closePrompt}>✕</button>
                        </div>

                        <div className="wf-modal-body">
                            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                                시스템 프롬프트
                            </label>
                            <textarea
                                value={promptDraft}
                                onChange={(e) => setPromptDraft(e.target.value)}
                                rows={12}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    resize: "vertical",
                                }}
                                placeholder="여기에 시스템 프롬프트를 입력하세요"
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                        savePrompt();
                                    }
                                }}
                            />
                            <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                                ⌘/Ctrl + Enter 로 저장할 수 있어요.
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px" }}>
                            <button className="wf-btn-secondary" onClick={closePrompt}>취소</button>
                            <button className="wf-btn-primary" onClick={savePrompt}>저장</button>
                        </div>
                    </div>
                </div>
            )}


            {/* ✅ 간단 모달 */}
            {evalState.open && (
                <div className="wf-modal-backdrop" onClick={() => setEvalState({ open: false, loading: false, text: "", title: "" })}>
                    <div className="wf-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wf-modal-header">
                            <strong>AI 평가 — {evalState.title}</strong>
                            <button className="wf-modal-close" onClick={() => setEvalState({ open: false, loading: false, text: "", title: "" })}>✕</button>
                        </div>
                        <div className="wf-modal-body">
                            {evalState.loading
                                ? <LoadingDots text="평가 중" />        // ← 요기!
                                : <pre style={{ whiteSpace: "pre-wrap" }}>{evalState.text}</pre>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TreeNode({
    node, path, addChild, removeNode, editField, onEval, isRoot = false, depth = 0,
}) {
    const labelKey = node?.title ? "title" : "task";
    const label = node?.[labelKey] ?? "";

    return (
        <div className={`wf-node ${isRoot ? "wf-node-root" : ""} depth-${depth}`}>
            <div className="wf-row">
                <div className="wf-box-wrap">
                    <EditableBox
                        value={label}
                        placeholder={labelKey === "title" ? "제목" : "작업"}
                        onChange={(v) => {
                            editField(path, labelKey, v);
                            if (node?.blink) editField(path, "blink", false);
                        }}
                        prominent={labelKey === "title"}
                        blink={node?.blink}
                    />
                    <button
                        type="button"
                        className="wf-eval-inside"
                        title="이 항목 AI 평가"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onEval?.(node)}    // ✅ 서브트리 평가
                    >
                        AI평가
                    </button>
                </div>

                <div className="wf-actions">
                    {!isRoot && (
                        <button className="wf-btn wf-btn-add" title="하위 항목 추가" onClick={() => addChild(path)}>+</button>
                    )}
                    {!isRoot && (
                        <button className="wf-btn wf-btn-del" title="이 항목 삭제" onClick={() => removeNode(path)}>–</button>
                    )}
                </div>
            </div>

            {Array.isArray(node?.children) && node.children.length > 0 && (
                <div className="wf-children">
                    {node.children.map((child, i) => (
                        <TreeNode
                            key={i}
                            node={child}
                            path={[...path, "children", i]}
                            addChild={addChild}
                            removeNode={removeNode}
                            editField={editField}
                            onEval={onEval}              // ✅ 하위에도 전달
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function EditableBox({ value, onChange, placeholder, prominent, blink }) {
    return (
        <input
            className={`wf-box ${prominent ? "wf-box-title" : ""} ${blink ? "wf-blink" : ""}`}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}
