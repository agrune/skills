# 다단계 폼 / 위자드 어노테이션 패턴

## 규칙

1. 각 단계를 별도 그룹으로 나눈다 (`wizard-step-basic`, `wizard-step-details` 등)
2. 네비게이션 버튼(이전/다음/제출)은 별도 그룹으로 묶는다
3. 각 단계의 모든 입력 필드, 선택 트리거, 옵션을 빠짐없이 어노테이션한다
4. 리뷰/확인 단계는 표시만 하는 경우 어노테이션이 필요 없다

## 코드 예시

```tsx
<DialogContent data-agrune-group="task-wizard" data-agrune-group-name="태스크 생성 위자드">
  {step === 0 && (
    <div data-agrune-group="wizard-step-basic" data-agrune-group-name="기본 정보">
      <Input
        data-agrune-action="fill"
        data-agrune-name="태스크 이름"
        data-agrune-desc="새 태스크의 제목 입력"
      />
    </div>
  )}
  {step === 1 && (
    <div data-agrune-group="wizard-step-details" data-agrune-group-name="상세 정보">
      <Input
        data-agrune-action="fill"
        data-agrune-name="태스크 설명"
        data-agrune-desc="태스크 상세 설명 입력"
      />
    </div>
  )}
  <div data-agrune-group="wizard-navigation" data-agrune-group-name="위자드 네비게이션">
    <Button
      data-agrune-action="click"
      data-agrune-name="이전 단계"
      data-agrune-desc="이전 입력 단계로 돌아가기"
    />
    <Button
      data-agrune-action="click"
      data-agrune-name="다음 단계"
      data-agrune-desc="다음 입력 단계로 진행"
    />
  </div>
</DialogContent>
```
