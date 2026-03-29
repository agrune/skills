---
name: agrune:guide
description: agrune MCP 도구 레퍼런스. AI가 agrune 도구를 사용할 때 자동으로 참조하는 가이드. 브라우저 자동화, 스냅샷 조회, 요소 제어 방법을 설명한다.
disable-model-invocation: false
user-invocable: true
---

# agrune MCP Tool Guide

agrune MCP 도구의 사용법과 패턴을 설명한다.

## CRITICAL: agrune 도구 독점 사용 규칙

**브라우저 조작 작업에서 agrune 도구가 사용 가능하면, 반드시 agrune 도구만 사용하라.**

다음 행위는 금지된다:

| 금지 행위 | 왜 금지인가 |
|-----------|------------|
| 소스 코드를 읽어서 UI 상태를 추론 | agrune_snapshot이 실시간 DOM 상태를 제공한다 |
| `mcp__claude-in-chrome__*` 도구 사용 | agrune이 동일 기능을 더 정확하게 제공한다 |
| Playwright MCP 도구 사용 | agrune 어노테이션 기반 조작이 우선이다 |
| Chrome DevTools로 요소 조작 | agrune_act/fill/drag가 정확한 타겟 제어를 제공한다 |
| `document.querySelector` 등 JS로 DOM 직접 조작 | agrune이 이벤트 시뮬레이션과 좌표 변환을 처리한다 |

**허용되는 유일한 예외:**
- agrune 도구가 연결 실패(`SESSION_NOT_ACTIVE`)일 때 fallback
- 사용자가 명시적으로 다른 도구 사용을 지시한 경우

이 규칙을 위반하는 순간 스킬의 다른 모든 지침도 무시될 가능성이 높아진다. **agrune 도구로 시작하고, agrune 도구로 끝내라.**

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
1. 먼저 `mode=outline`으로 그룹 구조 파악 → 그룹 요약 + meta 반환, 개별 타겟 없음
2. 필요한 그룹만 `groupId`로 확장하여 targetId + `center`/`size`/`coordSpace` 획득
3. 액션 수행 후 재스냅샷 불필요 — `ok:true` 반환되면 성공

**중요:** `center`/`size`/`coordSpace`는 `groupId` 또는 `mode=full`로 타겟을 확장할 때만 반환된다. outline 모드에서는 그룹 요약만 나온다.

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
| `destinationCoords` | `{x, y}` 또는 `{relativeTo, dx, dy}`? | 놓을 좌표. 절대좌표 `{x,y}` 또는 상대좌표 `{relativeTo: "targetId", dx, dy}`. 캔버스 그룹이면 canvas 좌표 |
| `placement` | `"before"` \| `"inside"` \| `"after"`? | 드롭 위치 (destinationTargetId 사용 시만) |
| `tabId` | number? | 탭 ID |

**캔버스 그룹 드래그:** `data-agrune-canvas`가 있는 그룹의 타겟은 `destinationCoords`에 canvas 좌표를 사용한다. agrune이 자동으로 viewport 변환 및 필요 시 자동 팬을 처리. offscreen 노드도 자동으로 뷰포트 안에 가져온다. 결과에 `movedTarget: { targetId, center, size, coordSpace }` 포함.

**상대좌표:** `destinationCoords: { relativeTo: "기획", dx: 150, dy: 0 }` — 참조 타겟 중심에서 offset만큼 떨어진 위치로 이동. 절대좌표 계산 없이 노드 간 관계만으로 배치 가능.

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

**캔버스 휠:** 캔버스 그룹에서 wheel 액션으로 줌/팬 가능. canvas 좌표는 줌/팬으로 변하지 않으므로 노드 위치 재조회 불필요.

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
| `CANVAS_PAN_FAILED` | 캔버스 자동 팬 실패 | 캔버스 라이브러리의 wheel 동작이 예상과 다를 수 있음. agrune_pointer로 수동 팬 시도 |

## 스냅샷 시스템

- 각 타겟에는 `reason` 필드: `ready`, `hidden`, `offscreen`, `covered`, `disabled`, `sensitive`
- `actionableNow=true`인 타겟만 즉시 제어 가능
- 액션 수행 후 `ok:true`가 반환되면 재스냅샷 불필요. 한 번의 스냅샷으로 여러 액션 수행 가능

### 좌표 시스템

타겟 위치는 `center` + `size` + `coordSpace`로 표현된다. **`groupId` 또는 `mode=full`로 타겟을 확장해야만 반환된다** (outline 모드에서는 나오지 않음):
- `center: { x, y }` — 타겟 중심점
- `size: { w, h }` — 너비/높이
- `coordSpace: "viewport" | "canvas"` — 좌표 공간

**캔버스 그룹** (`data-agrune-canvas` 적용)의 타겟은 `coordSpace: "canvas"`로 제공된다. 이 좌표는 줌/패닝과 무관한 절대 위치이므로 정렬/간격 계산에 직접 사용 가능. viewport 밖 타겟도 canvas 좌표로 포함되며, agrune이 조작 시 자동으로 뷰포트를 조정한다.

캔버스 그룹의 타겟은 `covered: true`여도 `actionableNow: true` — 겹쳐도 드래그 가능.

**좌표 예시 (캔버스 드래그):**
```
스냅샷 결과:  { targetId: "기획", center: {x:50, y:100}, coordSpace: "canvas" }
드래그 입력:  destinationCoords: {x:200, y:100}  ← canvas 좌표
드래그 결과:  movedTarget: { center: {x:200, y:100}, coordSpace: "canvas" }
```
`destinationCoords`에 canvas 좌표를 넣으면 agrune이 viewport 좌표로 자동 변환한다. 결과의 `movedTarget.center`는 드래그 후 실제 위치(앱의 snap-to-grid 등 반영).

### 그룹 메타데이터

`data-agrune-meta` 어노테이션이 있는 그룹은 스냅샷의 `groups[].meta` 필드에 메타데이터가 포함된다. 앱이 제공하는 구조화된 메타데이터(엣지 연결 정보, 스냅 그리드 설정 등)로 레이아웃 판단에 활용. `groups`는 outline 모드와 expanded 모드 모두에서 반환된다.

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

### 캔버스 노드 정렬
```
1. agrune_snapshot(groupId="workflow-nodes", mode="full")  → 전체 노드 (canvas 좌표)
2. 노드 center 좌표와 meta의 edges 정보 확인
3. 기준 노드 배치: agrune_drag(sourceTargetId="기획", destinationCoords={x:200, y:100})
4. 나머지 노드는 상대좌표로 배치 (절대좌표 계산 불필요):
   agrune_drag(sourceTargetId="디자인", destinationCoords={relativeTo:"기획", dx:180, dy:0})
   agrune_drag(sourceTargetId="개발", destinationCoords={relativeTo:"디자인", dx:180, dy:0})
   agrune_drag(sourceTargetId="라벨링", destinationCoords={relativeTo:"개발", dx:0, dy:170})
5. 결과의 movedTarget으로 최종 위치 확인
6. (선택) agrune_capture로 시각적 결과 검증
```

**상대좌표 우선:** 캔버스 배치 시 기준 노드 1개만 절대좌표로 놓고, 나머지는 `relativeTo`로 배치한다. 같은 행 노드는 동일한 `dy:0`, 분기 노드는 동일한 `dy` 값을 사용하면 자연스럽게 정렬된다.

**겹친 노드 처리:** 여러 노드가 같은 위치에 겹쳐있으면 드래그 시 최상위 노드만 잡힌다. **권장 패턴: agrune_act(click)으로 원하는 노드를 먼저 선택하여 z-order 최상위로 올린 후 agrune_drag로 이동.** 이렇게 하면 겹침과 무관하게 의도한 노드를 확실히 잡을 수 있다. 드래그 후 movedTarget의 center가 변하지 않았으면 다른 노드에 가려진 것이므로 click으로 선택 후 재시도.

**캔버스 타깃이 부족한 그룹 (라벨링 등):** 스냅샷에 조작 대상 타깃이 없으면 `agrune_capture`로 시각 확인 후 작업.
