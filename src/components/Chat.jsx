export default function Chat({ user, onLogout, apiKey }) {
    return (
        <div
            style={{
                maxWidth: 600,
                margin: "60px auto",
                padding: 24,
                border: "1px solid #ccc",
                borderRadius: 12,
                background: "#fafafa",
                textAlign: "center",
            }}
        >
            <h2>환영합니다, {user} 👋</h2>
            <p>추후 이 영역에 채팅창을 추가합니다.</p>
            <p style={{ color: "#777" }}>
                현재는 우측의 워크플로우 페이지를 수동으로 편집합니다.<br />
                "AI평가" 버튼을 누르면 해당 항목보다 하위 업무들을 통째로 AI가 분석합니다.
            </p>
        </div>
    );
}
