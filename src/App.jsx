import { useState } from 'react';
import './App.css';
import Login from "./components/Login";
import MainFrame from "./components/MainFrame";

function App() {
  const [user, setUser] = useState("");
  const [apiKey, setApiKey] = useState(""); // 🔑 초기값은 비워둠
  const [mode, setMode] = useState("login"); // "login" | "main_frame" | "require_api_key"

  const [tree, setTree] = useState({
    title: "",
    workflow: [
      {
        title: "신제품 연구개발 및 상용화 계획 수립",
        children: [
          {
            task: "시장 및 기술 조사",
            children: [
              { task: "글로벌 트렌드 분석(시장조사 보고서, 컨퍼런스 자료 등)" },
              { task: "경쟁사 벤치마킹(제품 스펙, 원가, 포지셔닝 비교)" },
              { task: "신기술 스카우팅 및 특허 검색" },
              { task: "고객 VOC(Voice of Customer) 데이터 분석" }
            ]
          },
          {
            task: "제품 콘셉트 도출",
            children: [
              { task: "핵심 가치 제안 정의(기능, 성능, 디자인, 친환경성 등)" },
              { task: "제품 라인업 내 포지셔닝 결정" },
              { task: "초기 디자인 목업 및 기능 시나리오 작성" },
              { task: "내부 검토 및 컨셉 보드 승인" }
            ]
          },
          {
            task: "기술 검증 및 시제품 개발",
            children: [
              { task: "필요 기술 모듈 정의(센서, 소재, 알고리즘 등)" },
              { task: "연구소·협력사 공동개발 진행" },
              { task: "시제품 제작 및 실험 검증" },
              { task: "품질/안전성 테스트(온도, 내구, EMC 등)" }
            ]
          },
          {
            task: "사업성 검토 및 양산 계획",
            children: [
              { task: "원가 및 수익성 분석(BOM, 제조원가, 예상판매가)" },
              { task: "공급망 및 협력사 확보 계획 수립" },
              { task: "양산 공정 설계 및 시험 생산" },
              { task: "환경규제 및 인증 대응(CE, KC, RoHS 등)" }
            ]
          },
          {
            task: "마케팅 및 출시 전략",
            children: [
              { task: "브랜딩 방향성 확정(네이밍, 디자인 언어, 슬로건)" },
              { task: "런칭 이벤트 및 광고 캠페인 기획" },
              { task: "유통 채널 전략 수립(온라인, 리테일, B2B 등)" },
              { task: "출시 일정 조정 및 초기 피드백 모니터링" }
            ]
          },
          {
            task: "사후 평가 및 개선",
            children: [
              { task: "출시 후 품질/클레임 데이터 수집" },
              { task: "고객 만족도 분석 및 개선안 도출" },
              { task: "차세대 모델 피드백 반영" },
              { task: "성과 보고서 작성 및 조직 공유" }
            ]
          }
        ]
      }
    ]
  });

  // 1️⃣ 로그인 모드
  if (mode === "login") {
    return (
      <Login
        onLogin={(username, password) => {
          setUser(username);
          setMode("require_api_key");
        }}
      />
    );
  }

  // 2️⃣ API Key 입력 요청
  if (mode === "require_api_key") {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "120px",
          padding: "24px",
        }}
      >
        <h2>🔐 OpenAI API Key 필요</h2>
        <p>이 애플리케이션을 사용하려면 OpenAI API 키를 입력해야 합니다.</p>
        <input
          type="password"
          placeholder="sk-로 시작하는 OpenAI API Key"
          style={{
            width: "60%",
            padding: "10px",
            marginTop: "12px",
            borderRadius: "8px",
            border: "1px solid #aaa",
            fontSize: "16px"
          }}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <br />
        <button
          onClick={() => {
            if (apiKey.trim().startsWith("sk-")) {
              setMode("main_frame");
              alert("✅ API Key가 등록되었습니다.");
            } else {
              alert("⚠️ 올바른 OpenAI API Key 형식이 아닙니다.");
              setApiKey("");
            }
          }}
          style={{
            marginTop: "16px",
            padding: "10px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold"
          }}
        >
          등록하기
        </button>
        <div style={{ marginTop: "40px" }}>
          <button
            onClick={() => setMode("login")}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer"
            }}
          >
            ← 로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 3️⃣ 메인 프레임
  if (mode === "main_frame") {
    return (
      <MainFrame
        user={user}
        onLogout={() => {
          setUser("");
          setApiKey("");
          setMode("login");
        }}
        tree={tree}
        setTree={setTree}
        apiKey={apiKey}
      />
    );
  }

  return <p>알 수 없는 상태입니다.</p>;
}

export default App;
