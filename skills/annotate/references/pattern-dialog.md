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

## 오버레이 감지 시스템

agrune 런타임은 오버레이를 자동 감지한다. 감지 기준:
- `role="dialog"`
- `role="alertdialog"`
- `aria-modal="true"`
- `position:fixed` + 양수 `z-index`

오버레이가 열리면 배경 타겟이 자동으로 차단되고, 오버레이 내부 타겟만 actionable 상태가 된다. 따라서 모달/다이얼로그에 적절한 ARIA 속성을 부여해야 오버레이 감지가 정확히 동작한다.

## FLOW_BLOCKED 에러

오버레이가 활성 상태일 때 배경 타겟에 접근하면 `FLOW_BLOCKED` 에러가 발생한다. 오버레이를 먼저 닫거나, 오버레이 내부의 타겟만 사용해야 한다.
