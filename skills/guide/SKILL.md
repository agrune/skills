---
name: guide
description: agrune MCP 도구 레퍼런스. AI가 agrune 도구를 사용할 때 자동으로 참조하는 가이드. 브라우저 자동화, 스냅샷 조회, 요소 제어 방법을 설명한다.
disable-model-invocation: false
user-invocable: true
---

# agrune MCP Tool Guide

agrune MCP 도구의 사용법과 패턴을 설명한다.

## 도구 목록

### agrune_sessions

활성 브라우저 세션(탭) 목록 조회. 여러 탭 간 전환이 필요할 때만 호출한다. agrune_snapshot은 자동으로 활성 탭을 사용한다.

파라미터: 없음

### agrune_snapshot

페이지의 어노테이션 스냅샷을 조회한다.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `groupId` | string? | 특정 그룹을 확장하여 targetId 목록을 가져온다 |
| `groupIds` | string[]? | 여러 그룹을 동시에 확장 |
| `mode` | `"outline"` \| `"full"`? | outline(기본): 그룹 요약, full: 모든 타겟 |
| `includeTextContent` | boolean? | 텍스트 콘텐츠 포함 |
| `tabId` | number? | 탭 ID (생략 시 활성 탭) |

**사용 패턴:**
1. 먼저 `mode=outline`으로 그룹 구조 파악
2. 필요한 그룹만 `groupId`로 확장하여 targetId 획득
3. 액션 수행 후 재스냅샷 불필요 — `ok:true` 반환되면 성공

### agrune_act

타겟 요소에 인터랙션을 수행한다. `ok:true` 반환 시 재스냅샷 불필요.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `targetId` | string | 타겟 ID |
| `action` | `"click"` \| `"dblclick"` \| `"contextmenu"` \| `"hover"` \| `"longpress"`? | 인터랙션 타입 (기본: click) |
| `tabId` | number? | 탭 ID |

### agrune_fill

입력 요소에 값을 채운다. `ok:true` 반환 시 재스냅샷 불필요.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `targetId` | string | 타겟 ID |
| `value` | string | 채울 값 |
| `tabId` | number? | 탭 ID |

### agrune_drag

드래그 앤 드롭. destination은 `destinationTargetId` 또는 `destinationCoords` 중 하나만 지정. `ok:true` 반환 시 재스냅샷 불필요.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `sourceTargetId` | string | 잡을 요소 |
| `destinationTargetId` | string? | 놓을 요소 |
| `destinationCoords` | `{x, y}`? | 놓을 뷰포트 좌표 |
| `placement` | `"before"` \| `"inside"` \| `"after"`? | 드롭 위치 (destinationTargetId 사용 시만) |
| `tabId` | number? | 탭 ID |

### agrune_pointer

로우레벨 포인터/휠 이벤트 시퀀스. 캔버스 팬, 줌, 프리핸드 드로잉 등 좌표 기반 조작용. 타겟 지정 우선순위: targetId > selector > coords.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `targetId` | string? | 어노테이션된 타겟 ID |
| `selector` | string? | CSS 선택자 |
| `coords` | `{x, y}`? | 뷰포트 좌표 |
| `actions` | array | 이벤트 시퀀스 (아래 참조) |
| `tabId` | number? | 탭 ID |

**actions 타입:**
- `{ type: "pointerdown", x, y, delayMs? }` — 마우스/터치 다운
- `{ type: "pointermove", x, y, delayMs? }` — 포인터 이동
- `{ type: "pointerup", x, y, delayMs? }` — 릴리스
- `{ type: "wheel", x, y, deltaY, ctrlKey?, delayMs?, steps?, durationMs? }` — 스크롤/줌. `ctrlKey=true`로 핀치 줌, `steps`로 부드러운 줌

### agrune_wait

타겟 상태 변화를 대기한다.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `targetId` | string | 타겟 ID |
| `state` | `"visible"` \| `"hidden"` \| `"enabled"` \| `"disabled"` | 원하는 상태 |
| `timeoutMs` | number? | 타임아웃 (기본: 10000ms) |
| `tabId` | number? | 탭 ID |

### agrune_guide

타겟 요소를 시각적으로 하이라이트한다. 디버깅/시연용.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `targetId` | string | 타겟 ID |
| `tabId` | number? | 탭 ID |

### agrune_config

런타임 시각 설정 변경. 사용자가 명시적으로 요청할 때만 호출.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `pointerAnimation` | boolean? | 포인터 애니메이션 켜기/끄기 |
| `auroraGlow` | boolean? | 오로라 글로우 효과 |
| `auroraTheme` | `"dark"` \| `"light"`? | 오로라 테마 |
| `clickDelayMs` | number? | 클릭 딜레이 |
| `pointerDurationMs` | number? | 포인터 이동 시간 |
| `autoScroll` | boolean? | 자동 스크롤 |
| `agentActive` | boolean? | 에이전트 시각적 존재 표시 |

### agrune_read

페이지 콘텐츠를 구조화된 마크다운으로 추출한다.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `selector` | string? | CSS 선택자로 범위 제한 (기본: 전체 페이지) |
| `tabId` | number? | 탭 ID |

## 에러 코드

| 코드 | 의미 | 대처 |
|------|------|------|
| `STALE_SNAPSHOT` | 스냅샷이 변경됨 | 새 스냅샷 조회 후 재시도 |
| `FLOW_BLOCKED` | 오버레이가 배경 타겟 차단 | 오버레이 닫거나 내부 타겟 사용 |
| `TARGET_NOT_FOUND` | 타겟 ID가 스냅샷에 없음 | 스냅샷 재조회 |
| `NOT_VISIBLE` | 타겟이 보이지 않음 | 스크롤 또는 오버레이 확인 |
| `DISABLED` | 타겟이 비활성 | 선행 조건 충족 후 재시도 |
| `TIMEOUT` | 대기 시간 초과 | 조건 확인 후 재시도 |
| `SESSION_NOT_ACTIVE` | 브라우저 세션 없음 | 페이지 새로고침 |
| `AGENT_STOPPED` | 에이전트 중단됨 | 세션 재시작 |
| `INVALID_TARGET` | 잘못된 타겟 | 타겟 ID 확인 |
| `INVALID_COMMAND` | 잘못된 명령 | 파라미터 확인 |

## 스냅샷 시스템

- 각 타겟에는 `reason` 필드: `ready`, `hidden`, `offscreen`, `covered`, `disabled`, `sensitive`
- `actionableNow=true`인 타겟만 즉시 제어 가능
- 액션 수행 후 `ok:true`가 반환되면 재스냅샷 불필요. 한 번의 스냅샷으로 여러 액션 수행 가능

## 일반적인 작업 패턴

### 폼 채우기
```
1. agrune_snapshot(mode=outline)  → 그룹 구조 파악
2. agrune_snapshot(groupId="form-group")  → 폼 타겟 목록
3. agrune_fill(targetId="이름", value="홍길동")
4. agrune_fill(targetId="이메일", value="hong@example.com")
5. agrune_act(targetId="제출")
```

### 네비게이션
```
1. agrune_snapshot(mode=outline)  → 그룹 구조 파악
2. agrune_snapshot(groupId="main-nav")  → 네비게이션 타겟
3. agrune_act(targetId="설정")
4. agrune_wait(targetId="설정-페이지-헤더", state="visible")
```

### 드래그 앤 드롭
```
1. agrune_snapshot(groupId="kanban-cards")  → 카드 목록
2. agrune_snapshot(groupId="kanban-columns")  → 컬럼 목록
3. agrune_drag(sourceTargetId="카드A", destinationTargetId="Done 컬럼", placement="inside")
```
