import Chat from "./Chat";
import WorkFlow from "./WorkFlow";

export default function MainFrame({ user, onLogout, tree, setTree, apiKey }) {

    return (
        <>
            {/* 컴포넌트 전용 스타일: 반응형(가로/세로) 분할 */}
            <style>{`
                .mf-container {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    box-sizing: border-box;
                    height: 100vh;      /* 기본 */
                    min-height: 100dvh; /* 모바일 주소창 변동 커버 (지원 브라우저에서 우선) */
                    background: #f5f5f5;
                }
                .mf-pane {
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 12px;
                    background: #ffffff;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                }
                .mf-topbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid #eee;
                    position: sticky; top: 0;
                    background: #fff; z-index: 1;
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                }

                /* 세로(모바일): 위/아래 스택, 각 패널이 한 화면 꽉 채움 */
                @media (orientation: portrait) {
                    .mf-container {
                    flex-direction: column;
                    height: auto;          /* 페이지 스크롤 */
                    min-height: 100vh;
                    min-height: 100dvh;    /* 지원 시 우선 */
                    }
                    .mf-pane {
                    height: 100vh;
                    height: 100dvh;        /* Chat이 1스크린 꽉 차고, 스크롤 내려야 WorkFlow 보임 */
                    }
                }
            `}</style>

            <div className="mf-container">
                {/* Left/Top: Chat */}
                <section className="mf-pane">
                    <div className="mf-topbar">
                        <h3 className="mf-title">Chat</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#666" }}>{user}</span>
                            <button className="mf-btn" onClick={onLogout}>로그아웃</button>
                        </div>
                    </div>
                    <div style={{ padding: 16, flex: 1 }}>
                        <Chat
                            user={user}
                            apikey={apiKey}
                        />
                    </div>
                </section>

                {/* Right/Bottom: WorkFlow */}
                <section className="mf-pane">
                    <div className="mf-topbar">
                        <h3 className="mf-title">WorkFlow</h3>
                    </div>
                    <div style={{ padding: 16, flex: 1 }}>
                        <WorkFlow
                            tree={tree}
                            setTree={setTree}
                            apiKey={apiKey}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}
