---
name: agrune:start
description: agrune 원스톱 온보딩. "agrune 시작", "agrune 셋업", "agrune 설치", "시작", "start", "setup" 등을 말하면 이 스킬을 사용할 것. 환경 검증, Chrome 확장 설치, 어노테이션까지 한 번에 처리한다.
allowed-tools: Bash(node *), Read, Glob, Grep, Edit, Write, Agent
---

# agrune Start

플러그인 설치 후 `/agrune:start` 한 번으로 모든 세팅을 완료하는 온보딩 스킬.
모든 단계가 끊김 없이 자동으로 이어진다. 멱등성을 보장한다.

## Step 1: Node.js 버전 확인

`node --version` 실행. 22 미만이면 중단:

> "agrune MCP 서버는 Node.js 22 이상이 필요합니다. 현재 버전: {version}. Node.js를 업데이트한 후 다시 `/agrune:start`를 실행해주세요."

## Step 2: Chrome 확장 확인

`agrune_sessions` MCP 도구를 호출하여 브라우저 연결을 확인한다.

**연결 성공:** Step 3으로 진행.

**연결 실패:** Chrome 확장이 설치되지 않았거나 Chrome이 실행되지 않은 상태. 다음을 수행한다:

1. 사용자에게 안내:
   > "Chrome 확장 프로그램이 필요합니다. Web Store 페이지를 열겠습니다."
2. 사용자의 기본 브라우저로 링크를 연다:
   ```bash
   open "https://chromewebstore.google.com/detail/agrune/gchelkphnedibjihiomlbpjhjlajplke"
   ```
3. 설치 후 안내:
   > "확장 설치 후 Chrome에서 대상 페이지를 열거나 새로고침해주세요. 준비되면 알려주세요."
4. 사용자가 준비됐다고 하면 `agrune_sessions`를 다시 호출하여 확인한다.
5. 여전히 실패하면 트러블슈팅 안내:
   > "연결이 안 되면: (1) Chrome을 완전히 종료 후 재실행, (2) 확장 프로그램 페이지에서 agrune 확장이 활성화되어 있는지 확인, (3) 대상 페이지를 새로고침해주세요."

## Step 3: MCP 서버 헬스체크

Step 2에서 `agrune_sessions`가 성공했으면 이미 검증된 상태. 별도 작업 불필요.

## Step 4: 프로젝트 컨텍스트 (선택)

사용자에게 질문한다:

> "프로젝트에 대해 간단히 알려주세요. (예: '쇼핑몰 프로젝트', '사내 HR 관리 도구') 기획문서가 있으면 경로를 알려줘도 좋습니다. 없으면 '없음'이라고 답해주세요."

- 문서 경로를 받으면 해당 파일을 읽어 컨텍스트로 활용한다.
- 텍스트 설명을 받으면 그대로 컨텍스트로 활용한다.
- "없음" 또는 스킵 의사를 밝히면 컨텍스트 없이 진행한다.

## Step 5: 어노테이션 모드 선택

사용자에게 선택지를 제시한다:

> "어노테이션 모드를 선택해주세요:
> 1. **auto** — 자동으로 전부 처리합니다 (단순한 프로젝트에 추천)
> 2. **interactive** — 애매한 부분은 물어보면서 처리합니다 (복잡한 프로젝트에 추천)"

## Step 6: 어노테이션 실행

`agrune:annotate` 스킬을 호출한다. 선택된 모드와 프로젝트 컨텍스트를 함께 전달한다.

## Step 7: 완료 안내

어노테이션이 완료되면 다음을 안내한다:

> "agrune 세팅이 완료되었습니다! 이제 AI 에이전트가 브라우저를 제어할 수 있습니다."
>
> **사용 가능한 MCP 도구:**
> | 도구 | 설명 |
> |------|------|
> | `agrune_snapshot` | 페이지 스냅샷 조회 (outline/full) |
> | `agrune_act` | 요소 클릭/더블클릭/우클릭/호버 |
> | `agrune_fill` | 입력 필드 값 채우기 |
> | `agrune_drag` | 드래그 앤 드롭 |
> | `agrune_pointer` | 로우레벨 포인터/휠 이벤트 |
> | `agrune_wait` | 요소 상태 변화 대기 |
> | `agrune_read` | 페이지 콘텐츠 마크다운 추출 |
>
> **팁:** Chrome DevTools에서 "agrune" 패널을 열면 스냅샷과 타겟을 실시간으로 확인할 수 있습니다.
