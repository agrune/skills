---
name: agrune:annotate
description: agrune 어노테이션을 컴포넌트에 자동으로 추가하는 스킬. "어노테이션 달아줘", "이 컴포넌트를 AI가 제어할 수 있게 해줘", "data-agrune 추가", "프로젝트 전체 어노테이션" 등을 말하면 이 스킬을 사용할 것.
argument-hint: "[auto|interactive]"
allowed-tools: Read, Glob, Grep, Edit, Write, Agent
---

# agrune Annotate

컴포넌트의 인터랙티브 요소를 분석하여 `data-agrune-*` 어노테이션을 추가한다.
이 어노테이션이 있어야 AI 에이전트가 브라우저의 DOM 요소를 원격으로 제어할 수 있다.

## 어노테이션 범위 선택

시작 시 사용자에게 범위를 물어본다:

> "어노테이션 범위를 선택해주세요:
> 1. **전체** — 프로젝트의 모든 페이지/컴포넌트에 어노테이션
> 2. **일부** — 특정 파일이나 디렉토리만 지정"

- **전체**: 프로젝트 라우트 구조를 파악 후 모든 페이지를 처리한다.
- **일부**: 사용자가 지정한 파일/디렉토리만 처리한다.

start 스킬에서 호출될 때는 이 단계도 자동으로 포함된다.

## 어노테이션 모드

`$ARGUMENTS`로 모드를 받는다. 인자가 없으면 `auto`.

- **auto**: 전체 자동 처리. 판단이 애매한 부분도 최선의 추정으로 진행한다.
- **interactive**: 자동 처리하되, 다음 상황에서 사용자에게 질문한다:
  - 요소의 action 타입이 불명확할 때 (click vs dblclick 등)
  - 그룹 경계를 어디로 잡을지 판단이 어려울 때
  - 커스텀 컴포넌트가 인터랙티브한지 판단이 어려울 때
  - name/desc에 넣을 적절한 표현을 모를 때

## 필수 속성

모든 타겟 요소에 반드시 있어야 하는 속성:

| 속성 | 설명 | 정적/동적 |
|------|------|-----------|
| `data-agrune-action` | 액션 타입. 아래 6가지 중 하나 또는 쉼표 구분 복수 | **정적만 가능** |
| `data-agrune-name` | 타겟의 표시 이름 | 정적 또는 동적 |
| `data-agrune-desc` | 타겟이 하는 일 설명 | 정적 또는 동적 |

## 선택 속성

| 속성 | 설명 |
|------|------|
| `data-agrune-key` | 명시적 타겟 ID (정적만 가능) |
| `data-agrune-group` | 그룹 ID (여러 타겟을 묶음) |
| `data-agrune-group-name` | 그룹 표시 이름 |
| `data-agrune-group-desc` | 그룹 설명 |
| `data-agrune-sensitive` | 값 없이 속성만 존재해도 동작. 값 미리보기 숨김 (비밀번호 등) |
| `data-agrune-canvas` | 캔버스 그룹의 transform 요소 CSS 선택자 (줌/팬 변환용) |
| `data-agrune-meta` | 메타데이터 제공 전역 함수 이름 (엣지 정보 등) |

## Action 타입 (6가지)

- **`click`**: 버튼, 링크, 탭, 체크박스, 라디오, 토글, 드롭다운 트리거, 메뉴 아이템, 드래그 가능한 요소, 드롭 대상
- **`fill`**: input, textarea, contenteditable 요소
- **`dblclick`**: 더블 클릭으로 활성화하는 요소 (인라인 편집 등)
- **`contextmenu`**: 우클릭 컨텍스트 메뉴를 가진 요소
- **`hover`**: 호버 시 툴팁, 드롭다운, 미리보기가 나타나는 요소
- **`longpress`**: 길게 누르기로 활성화하는 요소

### 복수 액션

하나의 요소에 여러 인터랙션이 필요하면 쉼표로 구분한다: `data-agrune-action="click,dblclick"`. `data-agrune-desc`에 각 액션이 무엇을 하는지 기술한다.

```tsx
<div
  data-agrune-action="click,dblclick"
  data-agrune-name={task.title}
  data-agrune-desc="클릭으로 선택, 더블클릭으로 상세 보기"
>
```

## name/desc 작성 가이드

**name:**
- 사용자가 보는 UI 라벨과 일치 (버튼 텍스트, 메뉴 이름 등)
- 반복 요소는 각 인스턴스를 구분할 수 있는 데이터 사용
- 같은 페이지에서 중복 불가

**desc:**
- "이 요소를 클릭/입력하면 무슨 일이 생기는가?"에 답하는 문장
- 화면 전환, 상태 변경, API 호출 등 결과를 설명
- 반복 요소에서 desc가 동일하면 정적 문자열로 충분

**프로젝트 컨텍스트가 제공된 경우:** 도메인 맥락을 반영하여 name/desc를 작성한다. "쇼핑몰 프로젝트"라는 한 줄만 있어도 "버튼1" 대신 "장바구니 담기" 같은 의미 있는 이름을 붙일 수 있다. 기획문서가 제공되면 용어와 기능 설명을 더 정확하게 반영한다.

## 동적 name/desc

반복문에서 렌더링되는 컴포넌트는 각 인스턴스를 구분할 수 있도록 동적 name을 사용한다. 컴포넌트 데이터에서 가장 의미 있는 식별값을 name으로 매핑한다.

```tsx
{tasks.map(task => (
  <button
    data-agrune-action="click"
    data-agrune-name={task.title}
    data-agrune-desc="태스크 상세 페이지로 이동"
  />
))}
```

테이블 행에서 행별 액션도 동적 name으로 구분한다:

```tsx
{members.map(member => (
  <tr data-agrune-group={`member-${member.id}`}>
    <td>
      <button
        data-agrune-action="click"
        data-agrune-name={member.name}
        data-agrune-desc="멤버 프로필 보기"
      />
    </td>
    <td>
      <button
        data-agrune-action="click"
        data-agrune-name={`${member.name} 삭제`}
        data-agrune-desc="멤버를 목록에서 제거"
      />
    </td>
  </tr>
))}
```

## 그룹 설계 원칙

그룹은 관련된 타겟들을 논리적으로 묶는다. 터미널 TUI에서 탐색 단위로 사용된다.

**그룹 경계를 나누는 기준:**
1. **UI 섹션 단위**: 헤더, 사이드바, 메인 콘텐츠, 모달 등
2. **기능 단위**: 검색 영역, 필터 패널, CRUD 폼 등
3. **반복 단위**: 카드 리스트의 각 카드, 테이블의 각 행 (동적 group ID 사용)

그룹 경계 요소에 group ID + 메타데이터를 함께 둔다:

```tsx
<nav
  data-agrune-group="main-nav"
  data-agrune-group-name="메인 네비게이션"
  data-agrune-group-desc="페이지 간 이동 메뉴"
>
  <button data-agrune-action="click" data-agrune-name="홈" data-agrune-desc="홈 페이지로 이동">홈</button>
</nav>
```

그룹이 필요 없는 단순한 경우(독립적인 버튼 하나)에는 그룹 없이 어노테이션만 추가해도 된다.

## 커버리지 원칙: 빠짐없이 달아라

AI 에이전트는 어노테이션이 달린 요소만 제어할 수 있다. 하나라도 빠지면 그 기능은 자동화할 수 없다.

**모든 action 타입을 고려:**
- 더블 클릭 편집이 있으면 `dblclick`
- 우클릭 메뉴가 있으면 `contextmenu`
- 호버 UI가 있으면 `hover`
- 길게 누르기가 있으면 `longpress`

## 어노테이션 위치 원칙

**어노테이션은 반드시 실제 인터랙티브 DOM 요소에 직접 달아야 한다.** wrapper 요소에 달면 disabled, hidden 등의 상태가 agrune 스냅샷에 반영되지 않는다.

```tsx
// ❌ BAD — wrapper span에 어노테이션, disabled 상태 반영 안됨
<span data-agrune-action="click" data-agrune-name="Tagging" data-agrune-desc="...">
  <Button disabled={!items.length} onClick={handleClick}>Tagging</Button>
</span>

// ✅ GOOD — 실제 버튼 요소에 직접 어노테이션
<Button
  disabled={!items.length}
  onClick={handleClick}
  data-agrune-action="click"
  data-agrune-name="Tagging"
  data-agrune-desc="선택한 항목에 태그 추가/수정 모달 열기"
>
  Tagging
</Button>
```

**판단 기준:** 어노테이션할 요소가 브라우저에서 실제로 클릭/입력되는 요소인지 확인한다. `<div>`로 감싼 `<button>`이라면 `<button>`에 달아야 한다. 컴포넌트가 rest props를 DOM에 전파(`{...props}`)하면 사용처에서 `data-agrune-*`를 넣을 수 있다. 전파하지 않으면 컴포넌트 내부를 수정해야 한다.

## 어노테이션 대상이 아닌 요소

다음만 제외. 이 목록에 없으면 어노테이션 대상이다:
- 순수 표시 요소 (텍스트, 이미지, 아이콘 — 클릭/드래그 이벤트 없음)
- 레이아웃 컨테이너 (div, section — 인터랙션 없음)
- 영구적으로 비활성화된 요소
- 스크롤 영역 자체
- 서드파티 임베드 (iframe 내부)
- 서드파티 라이브러리의 내부 렌더링 요소 (SVG 엣지, 내장 컨트롤 등)
- **영구적으로 숨겨진 요소** (`display: none`, `visibility: hidden`이 항상 적용되는 요소). 프로그래밍적 트리거용 숨겨진 버튼(Bootstrap modal trigger 등)이 대표적 — DOM에 존재하지만 사용자가 직접 조작하는 요소가 아니므로 제외한다. 단, **조건부로 표시/숨김이 토글되는 요소는 제외하지 않는다** — 표시될 때 AI가 제어할 수 있어야 한다.

## 공통 컴포넌트 분석 및 처리

프로젝트에서 가장 많이 누락되는 어노테이션은 **공통/공유 UI 컴포넌트 내부**에 있다. 페이지 컴포넌트만 분석하면 공통 컴포넌트가 내부에서 자체 생성하는 인터랙티브 요소를 놓친다.

### 왜 공통 컴포넌트가 문제인가

```
페이지 컴포넌트                  공통 컴포넌트 (내부 렌더링)
─────────────                  ──────────────────────
<ContentBox                    → <Search>          필터 input/select
  tableConfig={...}            → <CheckableTable>  체크박스
  editConfig={...}             → <EditBox>         Save/Cancel/Edit 버튼
/>                             → <Pagination>      페이지 네비게이션
                               → <Modal>           닫기/OK/Cancel 버튼
```

페이지 컴포넌트에서 `data-agrune-*`를 아무리 잘 달아도, 공통 컴포넌트가 **내부에서 직접 생성하는** 버튼/입력/체크박스에는 어노테이션이 전달되지 않는다.

### 공통 컴포넌트 식별 방법

1. **import 체인 추적**: 페이지 컴포넌트의 import를 따라가며 공통 디렉토리(components/atoms, components/molecules, components/organisms, components/ui, lib/ui 등)에서 가져오는 컴포넌트를 식별한다
2. **내부 렌더링 분석**: 각 공통 컴포넌트를 열어 내부에서 인터랙티브 요소를 자체 생성하는지 확인한다
3. **props 전파 여부 확인**: `{...props}` 또는 `{...rest}`로 DOM에 전파하면 사용처에서 어노테이션 가능, 아니면 내부 수정 필요

### 3가지 패턴과 처리 방법

#### 패턴 A: Props 전파 — 사용처에서 어노테이션

컴포넌트가 rest props를 DOM 요소에 전파하면, 사용처에서 `data-agrune-*`를 추가할 수 있다.

```tsx
// 공통 컴포넌트 — rest props 전파
const Button = ({ children, className, ...props }) => (
  <button className={className} {...props}>{children}</button>
)

// 사용처 — 여기서 어노테이션
<Button
  onClick={handleSave}
  data-agrune-action="click"
  data-agrune-name="Save"
  data-agrune-desc="변경사항 저장"
>Save</Button>
```

#### 패턴 B: 내부 자체 생성 — 공통 컴포넌트 내부 수정

컴포넌트가 내부에서 인터랙티브 요소를 직접 렌더링하면, 해당 컴포넌트 파일을 수정해야 한다.

```tsx
// ❌ 공통 컴포넌트가 내부에서 버튼 생성 — 사용처에서 제어 불가
const EditBox = ({ onSave, onCancel }) => (
  <div className="btn-wrap">
    <Button onClick={onSave}>Save</Button>      // ← 어노테이션 없음!
    <Button onClick={onCancel}>Cancel</Button>   // ← 어노테이션 없음!
  </div>
)

// ✅ 공통 컴포넌트 내부에 직접 어노테이션 추가
const EditBox = ({ onSave, onCancel }) => (
  <div className="btn-wrap">
    <Button onClick={onSave}
      data-agrune-action="click"
      data-agrune-name="Save"
      data-agrune-desc="변경사항 저장"
    >Save</Button>
    <Button onClick={onCancel}
      data-agrune-action="click"
      data-agrune-name="Cancel"
      data-agrune-desc="편집 취소하고 이전 상태로 복원"
    >Cancel</Button>
  </div>
)
```

#### 패턴 C: Config/Array 기반 동적 렌더링 — 반복문 내에서 어노테이션

컴포넌트가 config 객체나 배열을 받아 인터랙티브 요소를 동적으로 생성하는 패턴이다. 대표적으로 모달의 `buttons` prop, 테이블의 `columns` config 등이 있다.

```tsx
// 공통 Modal 컴포넌트 — buttons 배열을 받아 렌더링
const Modal = ({ buttons = [] }) => (
  <footer>
    {buttons.map(({ name, ...props }) => (
      <Button
        key={name}
        data-agrune-action="click"
        data-agrune-name={name}
        data-agrune-desc={`모달에서 ${name} 실행`}
        {...props}
      >{name}</Button>
    ))}
  </footer>
)
```

### 공통 컴포넌트에서 동적 name 생성

공통 컴포넌트는 여러 곳에서 사용되므로, name이 겹치지 않도록 컨텍스트 정보를 활용한다:

- **버튼**: 버튼 텍스트(name prop, children)를 그대로 사용 (`Save`, `Cancel`, `Edit` 등)
- **체크박스**: 연관된 데이터의 식별자 사용 (`{item.name} 선택` 등)
- **필터**: 필터의 prop명이나 label 사용 (`{filter.name} 필터` 등)
- **테이블 행**: 행 데이터의 고유 식별자 사용 (`{item.name}` 등)
- **페이지네이션**: 기능 고정이므로 정적 name 사용 (`첫 페이지`, `이전`, `다음` 등)

### 공통 컴포넌트 처리 우선순위

공통 컴포넌트를 **먼저** 처리해야 한다. 공통 컴포넌트 하나를 수정하면 이를 사용하는 모든 페이지에 자동 적용되기 때문이다.

**처리 순서:**
1. **1순위 — 공통 UI 컴포넌트**: Modal, Dialog, EditBox, Table, Search, Pagination 등
2. **2순위 — 페이지 고유 컴포넌트**: 각 페이지에서만 사용되는 컴포넌트

## 특수 패턴 레퍼런스

프로젝트를 분석한 후, 다음 패턴이 발견되면 `references/` 디렉토리에서 해당 문서를 **반드시** 읽고 규칙을 적용하라:

| 패턴 | 파일 | 트리거 |
|------|------|--------|
| 드래그 앤 드롭 / 칸반 | `references/pattern-dnd.md` | DnD 라이브러리, 칸반 보드, 드래그 핸들 |
| 캔버스 / 노드 에디터 | `references/pattern-canvas.md` | ReactFlow, XYFlow, 캔버스, 줌/팬 UI |
| Select / 드롭다운 | `references/pattern-select.md` | Select, 드롭다운, 콤보박스 |
| 다단계 폼 / 위자드 | `references/pattern-wizard.md` | 스텝퍼, 위자드, 다단계 폼 |
| 모달 / 다이얼로그 | `references/pattern-dialog.md` | Dialog, Modal, 오버레이 |
| 서드파티 커스텀 컴포넌트 | `references/pattern-thirdparty.md` | XYFlow 커스텀 노드, DnD Kit 등 |

## 작업 흐름

### 단일 파일

1. 파일을 읽고 컴포넌트 구조를 파악한다
2. **import된 공통 컴포넌트를 확인한다**: 해당 파일이 사용하는 공통 컴포넌트를 열어, 내부에서 인터랙티브 요소를 자체 생성하는지 확인한다. 자체 생성하는데 어노테이션이 없으면 공통 컴포넌트도 함께 수정 대상에 포함한다
3. 인터랙티브 요소를 식별한다:
   - onClick, onSubmit 등 이벤트 핸들러가 있는 요소
   - `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>` 등
   - UI 라이브러리의 인터랙티브 프리미티브 (Radix, MUI 등)
   - 공통 컴포넌트가 내부에서 자체 생성하는 인터랙티브 요소
4. 각 요소에 적절한 action, name, desc를 결정한다
5. 반복 렌더링 여부를 확인하고, 반복이면 동적 name을 사용한다
6. 관련 요소들을 그룹으로 묶을지 판단한다
7. 특수 패턴이 있으면 해당 reference를 읽는다
8. 어노테이션을 적용한다

### 프로젝트 전체 — 서브에이전트 병렬 처리

메인 에이전트는 **분석만** 수행하고, 실제 어노테이션은 **서브에이전트에 위임**한다.

#### Phase 1: 분석 (메인 에이전트)

1. 프로젝트의 페이지/라우트 구조를 파악한다 (Glob, Grep 사용)
2. 각 페이지의 컴포넌트 트리를 식별한다 (import 관계 추적)
3. **공통 UI 컴포넌트를 식별하고, 내부 렌더링을 분석한다:**
   - 공통 컴포넌트 디렉토리를 탐색한다 (atoms, molecules, organisms, ui, shared, common, lib 등)
   - 각 공통 컴포넌트를 열어 **내부에서 인터랙티브 요소를 자체 생성하는지** 확인한다
   - props 전파 패턴(A), 내부 자체 생성 패턴(B), config/array 동적 렌더링 패턴(C)을 구분한다
   - 패턴 B, C에 해당하는 공통 컴포넌트 목록을 작성한다 — 이 파일들이 반드시 수정 대상이다
4. 특수 패턴을 감지한다 (import문, 컴포넌트명, 라이브러리 의존성 기반):
   - DnD/칸반 → `references/pattern-dnd.md`
   - 캔버스/노드 에디터 → `references/pattern-canvas.md`
   - Select/드롭다운 → `references/pattern-select.md`
   - 다단계 폼/위자드 → `references/pattern-wizard.md`
   - 모달/다이얼로그 → `references/pattern-dialog.md`
   - 서드파티 커스텀 컴포넌트 → `references/pattern-thirdparty.md`
5. 서브에이전트 작업 단위를 결정한다

**레퍼런스 문서를 메인 에이전트가 직접 읽지 않는다.** 패턴 감지는 import문과 컴포넌트명으로 충분하다.

#### Phase 2: 서브에이전트 디스패치

작업 단위별로 서브에이전트를 **병렬** 디스패치한다. 각 서브에이전트 프롬프트에 다음을 포함한다:

1. **담당 파일 목록**: 해당 서브에이전트가 어노테이션할 파일 경로
2. **해당 레퍼런스 경로**: 감지된 패턴에 맞는 reference 파일의 **절대 경로**만 전달 (이 스킬의 base directory 기준)
3. **프로젝트 컨텍스트**: 사용자가 제공한 프로젝트 설명
4. **어노테이션 모드**: auto 또는 interactive
5. **이 스킬의 어노테이션 규칙**: 필수 속성, 선택 속성, action 타입, name/desc 가이드, 그룹 설계 원칙, 커버리지 원칙, 어노테이션 대상 제외 목록

서브에이전트 프롬프트 예시:
```
다음 파일에 agrune 어노테이션을 추가하라.

담당 파일:
- src/components/features/KanbanBoard.tsx
- src/components/features/TaskDetailDialog.tsx

참조할 레퍼런스 (반드시 읽고 규칙을 적용):
- /abs/path/to/references/pattern-dnd.md
- /abs/path/to/references/pattern-dialog.md
- /abs/path/to/references/pattern-select.md

프로젝트 컨텍스트: 칸반보드 기반 프로젝트 관리 도구
모드: auto

[어노테이션 규칙 전문]
```

#### 작업 분배 기준

- **공통 UI 컴포넌트 (최우선)**: 반드시 별도 서브에이전트로 **가장 먼저** 디스패치한다. 공통 컴포넌트 수정이 완료되어야 페이지 컴포넌트에서 중복 어노테이션을 피할 수 있다. Phase 1에서 식별한 패턴 B, C 공통 컴포넌트를 모두 이 서브에이전트에 할당한다
- **페이지/탭 단위**: 독립된 페이지는 서로 다른 서브에이전트에 할당
- **의존 관계 있는 컴포넌트**: 같은 서브에이전트에 묶기 (KanbanBoard + TaskDetailDialog 등)
- 서브에이전트 수는 **2~5개**가 적정. 너무 잘게 나누면 오버헤드가 커진다
- **페이지 서브에이전트에 공통 컴포넌트 정보를 전달**: 각 페이지 서브에이전트 프롬프트에 "이미 어노테이션된 공통 컴포넌트 목록"을 포함시켜, 공통 컴포넌트가 내부에서 처리하는 요소에 중복 어노테이션을 달지 않도록 한다

#### Phase 3: 검증

1. 서브에이전트 완료 후 TypeScript 빌드 확인 (`tsc --noEmit`)
2. 빌드 에러 시 해당 파일만 수정
3. 서브에이전트가 새로운 훅이나 import를 추가한 경우, 해당 코드가 컴포넌트의 위치(provider 트리 내부/외부)에서 런타임 에러 없이 동작하는지 확인한다. TypeScript 빌드는 통과하지만 런타임에 provider 누락 에러가 발생하는 경우가 있다.
4. 전체 결과를 요약한다

페이지 수가 많으면 중요도가 높은 페이지부터 처리하고, 진행 상황을 알린다.
