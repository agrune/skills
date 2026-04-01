# 모달 / 다이얼로그 어노테이션 패턴

## 닫기 버튼

공통 Dialog 컴포넌트의 닫기 버튼에 반드시 어노테이션을 달아야 한다. 닫기 버튼에 어노테이션이 없으면 모달이 열려도 AI가 닫기 액션을 수행할 수 없다. 공통 UI 래퍼에서 한 번만 어노테이션하면 모든 Dialog에 자동 적용된다.

```tsx
<DialogPrimitive.Close
  data-agrune-action="click"
  data-agrune-name="닫기"
  data-agrune-desc="다이얼로그 닫기"
>
  <X className="h-4 w-4" />
</DialogPrimitive.Close>
```

## 숨겨진 트리거 버튼 제외

Bootstrap 등 일부 프레임워크는 모달을 프로그래밍적으로 열기 위해 **숨겨진 트리거 버튼**을 사용한다 (`display: none` + `data-bs-toggle="modal"`). 이런 요소는 사용자가 직접 조작하는 것이 아니므로 **어노테이션하지 않는다.**

```tsx
// ❌ 어노테이션 불필요 — 프로그래밍적 트리거용 숨겨진 버튼
<Button
  ref={presentRef}
  style={{ display: "none" }}
  data-bs-toggle="modal"
  data-bs-target="#myModal"
/>

// ✅ 어노테이션 필요 — 사용자에게 표시되는 실제 닫기 버튼
<Button
  ref={dismissRef}
  className="close-btn"
  data-agrune-action="click"
  data-agrune-name="닫기"
  data-agrune-desc="모달 닫기"
>
  <CloseIcon />
</Button>
```

## 모달 내부 액션 버튼 (OK, Cancel, Confirm 등)

모달 컴포넌트가 footer에 **내부적으로** 버튼을 렌더링하면, 해당 버튼에도 어노테이션이 필요하다. 이 부분이 가장 많이 누락된다 — 모달의 닫기 버튼만 어노테이션하고 footer 버튼을 빠뜨리는 실수.

### 고정 버튼 (OK, Cancel)

모달 컴포넌트가 `onConfirm`, `onCancel` prop으로 OK/Cancel 버튼을 자체 렌더링하면:

```tsx
const Modal = ({ onConfirm, onCancel, children }) => (
  <div className="modal">
    {children}
    <footer>
      {onConfirm && (
        <Button
          onClick={onConfirm}
          data-agrune-action="click"
          data-agrune-name="OK"
          data-agrune-desc="확인"
        >OK</Button>
      )}
      {onCancel && (
        <Button
          onClick={onCancel}
          data-agrune-action="click"
          data-agrune-name="Cancel"
          data-agrune-desc="취소"
        >Cancel</Button>
      )}
    </footer>
  </div>
)
```

### 동적 버튼 (buttons 배열)

모달이 `buttons` prop으로 버튼 배열을 받아 렌더링하면:

```tsx
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

### Alert/Confirm 훅

`useAlert`, `useConfirm` 같은 커스텀 훅이 내부에서 Modal을 생성하는 경우, 훅이 사용하는 Modal 컴포넌트에 어노테이션이 있어야 한다. 훅의 반환값(alertComponent 등)은 JSX이므로 직접 수정할 수 없다 — **훅이 참조하는 Modal 컴포넌트를 수정**해야 한다.

## 오버레이 감지 시스템

agrune 런타임은 오버레이를 자동 감지한다. 감지 기준:
- `role="dialog"`
- `role="alertdialog"`
- `aria-modal="true"`
- `position:fixed` + 양수 `z-index`

오버레이가 열리면 배경 타겟이 자동으로 차단되고, 오버레이 내부 타겟만 actionable 상태가 된다. 따라서 모달/다이얼로그에 적절한 ARIA 속성을 부여해야 오버레이 감지가 정확히 동작한다.

## FLOW_BLOCKED 에러

오버레이가 활성 상태일 때 배경 타겟에 접근하면 `FLOW_BLOCKED` 에러가 발생한다. 오버레이를 먼저 닫거나, 오버레이 내부의 타겟만 사용해야 한다.
