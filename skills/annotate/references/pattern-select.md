# Select / 드롭다운 어노테이션 패턴

## 핵심 규칙

SelectTrigger뿐 아니라 **각 SelectItem/Option에도 개별 어노테이션**을 달아야 AI가 특정 옵션을 선택할 수 있다. **SelectContent에 반드시 고유 그룹 ID를 달아야 한다.** 그룹이 없으면 드롭다운 옵션이 상위 그룹에 섞여 TUI 탐색이 어려워진다.

## 코드 예시

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
