import { useState } from "react";

// 🔒 SHA-256 해싱 함수
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setError("아이디와 비밀번호를 입력하세요.");
            return;
        }

        const hashed = await hashString(password);
        const hashed_id = await hashString(username);

        const VALID_ID_HASH = "b4fa9639f04733a56d709925c6a287b83e26a74ccc4b645dc8c7c7da42d59812";
        const VALID_HASH = "2aa3b6db11bc20e15234b642a3d49e9c376d4957ab64592a6bd6e5c7018f0e88";

        if (hashed_id === VALID_ID_HASH && hashed === VALID_HASH) {
            console.log("✅ 로그인 성공:", username);
            setError("");

            onLogin(username);
        } else {
            setError("❌ 아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    };

    return (
        <div
            style={{
                maxWidth: 400,
                margin: "80px auto",
                textAlign: "center",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 24,
            }}
        >
            <h2>Test Build 2025.10.17.</h2>
            <span>서버리스 프로토타입으로, 데이터가 저장되지 않습니다.</span><br /><br />
            <span>ChatGPT API 사용으로, 모든 대화는 OpenAI로 전달되오니 대외비 관리에 주의하시기 바랍니다.</span><br /><br />
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    placeholder="아이디"
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #aaa",
                        width: "80%",
                        marginBottom: 12,
                    }}
                />
                <input
                    type="password"
                    value={password}
                    placeholder="비밀번호"
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #aaa",
                        width: "80%",
                        marginBottom: 12,
                    }}
                />
                <button
                    type="submit"
                    style={{
                        display: "block",
                        width: "80%",
                        margin: "16px auto 0",
                        padding: "10px 0",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: "bold",
                    }}
                >
                    로그인
                </button>
            </form>
            {error && (
                <p style={{ color: "red", marginTop: 16, whiteSpace: "pre-line" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
