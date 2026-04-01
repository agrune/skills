# Select / 드롭다운 어노테이션 패턴

Select/드롭다운은 구현 방식에 따라 어노테이션 전략이 다르다. **반드시 구현 방식을 먼저 확인**하고 해당 패턴을 적용하라.

## 구현 방식 판별

| 구현 방식 | 특징 | 예시 |
|-----------|------|------|
| **Native HTML select** | `<select>` + `<option>` 태그 사용. 옵션 드롭다운을 브라우저가 렌더링 | 레거시 프로젝트, 간단한 폼 |
| **Custom dropdown** | `<div>`, `<ul>/<li>`, `<button>` 등으로 직접 구현. 옵션이 DOM에 렌더링됨 | 자체 구현 드롭다운, Bootstrap dropdown |
| **Headless UI** | Radix, Headless UI, MUI 등 라이브러리의 Select 프리미티브 사용 | SelectTrigger + SelectContent + SelectItem |

**한 컴포넌트에 native와 custom이 공존하는 경우도 있다** (예: `useCustomSelect` prop으로 모드 전환). 이 경우 양쪽 모두 어노테이션해야 한다.

## 패턴 1: Native HTML `<select>`

Native `<select>`의 옵션은 브라우저가 렌더링하므로 `<option>`에 `data-agrune-*`를 달아도 agrune 스냅샷에 노출되지 않는다. **`<select>` 요소 자체에만 어노테이션한다.**

agrune 런타임은 native select를 `fill` 액션으로 처리한다 — 값을 직접 설정하고 change 이벤트를 발생시킨다.

```tsx
// ✅ Native select — select 요소에 action="click" 어노테이션
<select
  onChange={handleChange}
  data-agrune-action="click"
  data-agrune-name="Action 선택"
  data-agrune-desc="태스크의 액션 타입 변경"
>
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

**desc에 선택 가능한 옵션을 나열하면 AI가 올바른 값을 선택할 수 있다:**

```tsx
data-agrune-desc="상태 필터 변경. 옵션: ALL, ACTIVE, INACTIVE"
```

옵션이 동적이거나 너무 많으면 나열하지 않아도 된다 — AI가 스냅샷의 `<select>` value 속성과 option 목록을 읽을 수 있다.

## 패턴 2: Custom dropdown (`<ul>/<li>`, `<div>` 기반)

Custom dropdown은 옵션이 실제 DOM 요소로 렌더링되므로 **각 옵션에 개별 어노테이션**을 달아야 한다. 트리거 버튼과 옵션 목록 모두 어노테이션한다.

```tsx
// Custom dropdown — 트리거 + 각 옵션 개별 어노테이션
<div className="dropdown">
  <button
    className="dropdown-toggle"
    data-agrune-action="click"
    data-agrune-name="역할 필터"
    data-agrune-desc="역할별 필터 드롭다운 열기"
  >
    {selectedValue}
  </button>
  <ul
    className="dropdown-menu"
    data-agrune-group="role-filter-options"
    data-agrune-group-name="역할 필터 옵션"
    data-agrune-group-desc="역할 필터 드롭다운의 선택지"
  >
    {options.map(opt => (
      <li
        key={opt.value}
        onClick={() => onChange(opt.value)}
        data-agrune-action="click"
        data-agrune-name={opt.label}
        data-agrune-desc={`${opt.label} 선택`}
      >
        <a className="dropdown-item">{opt.label}</a>
      </li>
    ))}
  </ul>
</div>
```

## 패턴 3: Headless UI (Radix, MUI 등)

SelectTrigger뿐 아니라 **각 SelectItem/Option에도 개별 어노테이션**을 달아야 AI가 특정 옵션을 선택할 수 있다. **SelectContent에 반드시 고유 그룹 ID를 달아야 한다.** 그룹이 없으면 드롭다운 옵션이 상위 그룹에 섞여 TUI 탐색이 어려워진다.

```tsx
<Select>
  <SelectTrigger
    data-agrune-action="click"
    data-agrune-name="역할 필터"
    data-agrune-desc="역할별 필터 드롭다운 열기"
  >
    <SelectValue placeholder="Role" />
  </SelectTrigger>
  <SelectContent
    data-agrune-group="role-filter-options"
    data-agrune-group-name="역할 필터 옵션"
    data-agrune-group-desc="역할 필터 드롭다운의 선택지"
  >
    <SelectItem value="all"
      data-agrune-action="click"
      data-agrune-name="All Roles"
      data-agrune-desc="모든 역할의 멤버 표시"
    >All Roles</SelectItem>
    <SelectItem value="admin"
      data-agrune-action="click"
      data-agrune-name="Admin"
      data-agrune-desc="Admin 역할 멤버만 필터링"
    >Admin</SelectItem>
  </SelectContent>
</Select>
```

## 듀얼 모드 Select 컴포넌트

하나의 Select 컴포넌트가 native와 custom 모드를 모두 지원하는 경우, **양쪽 경로 모두 어노테이션해야 한다.** native `<select>`에는 패턴 1, custom dropdown에는 패턴 2를 적용한다.

```tsx
// 듀얼 모드 Select 컴포넌트
const Select = ({ useCustomSelect, children, ...props }) => (
  <>
    {useCustomSelect && (
      <div className="dropdown">
        <button
          className="dropdown-toggle"
          data-agrune-action="click"
          data-agrune-name={props['data-agrune-name']}
          data-agrune-desc={props['data-agrune-desc']}
        >...</button>
        <ul className="dropdown-menu">
          {/* 각 옵션에 개별 어노테이션 */}
        </ul>
      </div>
    )}
    <select
      style={useCustomSelect ? { display: 'none' } : {}}
      {...props}
    >
      {children}
    </select>
  </>
)
```

이 경우 native `<select>`는 custom 모드일 때 `display: none`으로 숨겨지므로, 숨겨진 요소 제외 규칙에 따라 **조건부 숨김은 제외하지 않는다** — 모드에 따라 표시될 수 있기 때문이다.
