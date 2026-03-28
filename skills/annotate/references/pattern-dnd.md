# 드래그 앤 드롭 어노테이션 패턴

## 핵심 원칙

드래그 앤 드롭은 별도의 action이 아니라 `drag` **command**로 처리된다. 런타임이 두 개의 `click` 타겟(source, destination)을 받아 pointer 이벤트 시퀀스(pointerdown → pointermove → pointerup)로 드래그를 수행한다.

**따라서 드래그 소스와 드롭 대상 모두 `action="click"`으로 어노테이션해야 한다.**

## drag command 파라미터

- `sourceTargetId`: 잡을 요소
- `destinationTargetId`: 놓을 요소
- `placement`: `"before"` | `"inside"` | `"after"`

### placement가 결정하는 것

런타임은 destination 요소의 바운딩 박스를 기준으로 포인터를 놓는다:
- **`before`**: destination 상단 가장자리 → destination 앞에 삽입
- **`after`**: destination 하단 가장자리 → destination 뒤에 삽입
- **`inside`** (기본값): destination 중앙 → destination 내부에 삽입

## 드래그 핸들 규칙

UI에 드래그 핸들(grip icon 등)이 따로 있으면 카드 본체가 아니라 **핸들에** 어노테이션한다. 런타임은 source 요소의 중심에서 pointerdown을 발생시키므로, 핸들이 아닌 카드 본체에 달면 실제 드래그가 시작되지 않을 수 있다. 핸들이 없고 카드 전체가 드래그 가능하면 카드 루트 요소에 단다.

## 칸반 보드 패턴

DnD가 가장 흔히 쓰이는 UI. 어노테이션해야 하는 요소 4가지:

| 요소 | 역할 | name 예시 | desc 예시 |
|------|------|-----------|-----------|
| 카드 (또는 드래그 핸들) | drag source | `{task.title}` (동적) | `"이 카드를 드래그하여 이동"` |
| 컬럼 드롭 영역 | drag destination (컬럼 이동) | `{column.title} 컬럼` (동적) | `"이 컬럼으로 카드를 이동"` |
| 다른 카드 | drag destination (순서 변경) | 카드 자체 name과 동일 | 카드 자체 desc와 동일 |
| 빈 컬럼의 빈 영역 | drag destination (빈 컬럼 이동) | `{column.title} 빈 영역` (동적) | `"빈 컬럼에 카드를 놓기"` |

### 칸반 그룹 설계

반드시 다음 그룹들로 분리:
- `kanban-toolbar`: 필터, 정렬, 보기 전환 등 상단 도구 모음
- `kanban-columns`: 모든 컬럼 드롭 영역 + 빈 컬럼 드롭존 (같은 그룹)
- `kanban-cards`: 드래그 가능한 카드들
- `kanban-card-actions`: 카드 삭제, 편집 등 카드별 액션 버튼

**빈 컬럼 드롭존은 `kanban-columns`와 같은 그룹에 넣어야 한다** — 별도 그룹으로 분리하면 DnD 목적지가 컬럼과 따로 놀아서 탐색 구조가 어색해진다.

### DnD 이름 규칙

- **카드**: 카드의 고유 제목 그대로 (예: `"로그인 페이지 리디자인"`)
- **컬럼**: `"{컬럼명} 컬럼"` 접미사 (예: `"진행중 컬럼"`)
- **빈 영역**: `"{컬럼명} 빈 영역"` 접미사 (예: `"Done 빈 영역"`)

### AI가 drag command를 구성하는 방식

- "카드를 Done 컬럼으로 이동" → `source=카드, destination=Done 컬럼, placement=inside`
- "카드 B 위에 놓기" → `source=카드, destination=카드B, placement=before`
- "카드 B 아래에 놓기" → `source=카드, destination=카드B, placement=after`
- "빈 컬럼에 놓기" → `source=카드, destination=빈 영역, placement=inside`

## 코드 예시: 칸반 보드

```tsx
{columns.map(column => (
  <div
    key={column.id}
    data-agrune-group={`column-${column.id}`}
    data-agrune-group-name={column.title}
    data-agrune-group-desc={`${column.title} 컬럼의 카드 목록`}
  >
    <h3>{column.title}</h3>

    <div
      className="card-list"
      data-agrune-action="click"
      data-agrune-name={`${column.title} 컬럼`}
      data-agrune-desc="이 컬럼으로 카드를 이동"
    >
      {column.tasks.length === 0 ? (
        <div
          className="empty-state"
          data-agrune-action="click"
          data-agrune-name={`${column.title} 빈 영역`}
          data-agrune-desc="빈 컬럼에 카드를 놓기"
        >
          No tasks
        </div>
      ) : (
        column.tasks.map(task => (
          <div key={task.id} className="card">
            <button
              className="drag-handle"
              data-agrune-action="click"
              data-agrune-name={task.title}
              data-agrune-desc="이 카드를 드래그하여 이동"
            >
              ⠿
            </button>
            <span>{task.title}</span>
          </div>
        ))
      )}
    </div>
  </div>
))}
```
