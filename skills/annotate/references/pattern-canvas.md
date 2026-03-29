# 캔버스 / 노드 에디터 어노테이션 패턴

## data-agrune-canvas 속성

줌/팬이 있는 캔버스 컨테이너에는 `data-agrune-canvas` 속성을 추가하여 AI가 뷰포트 좌표와 캔버스 내부 좌표를 변환할 수 있게 한다.

- **위치:** `data-agrune-group`과 같은 요소에 배치
- **값:** 그룹 내부의 transform이 적용된 요소를 가리키는 CSS 선택자

스냅샷에 `viewportTransform: { translateX, translateY, scale }`이 포함되어, AI가 줌/팬 상태에서도 노드를 정확한 위치로 드래그할 수 있다.

```tsx
<div
  data-agrune-group="workflow-canvas"
  data-agrune-group-name="워크플로우 캔버스"
  data-agrune-group-desc="워크플로우 노드와 연결 편집"
  data-agrune-canvas=".react-flow__viewport"
  data-agrune-meta="getWorkflowMeta"
>
  <ReactFlow nodes={nodes} edges={edges} />
</div>
```

## 커스텀 노드 어노테이션

XYFlow 등에서 커스텀으로 렌더링하는 노드 컴포넌트는 **일반 JSX이므로 반드시 어노테이션 대상이다.** 라이브러리가 자체적으로 렌더링하는 내부 요소만 제외한다.

| 구분 | 어노테이션 | 이유 |
|------|-----------|------|
| 커스텀 노드/셀 컴포넌트 | **O** | 일반 JSX로 렌더링, DOM에 data-* 전달됨 |
| 라이브러리 내부 SVG (엣지, 그리드) | X | 라이브러리가 직접 렌더링, 속성 전달 불가 |
| 라이브러리 내장 컨트롤 (줌, 미니맵) | X | 줌/팬은 pointer 이벤트로 처리 가능 |

커스텀 노드의 `data-agrune-name`에는 노드의 라벨(동적 값)을 사용. 같은 라이브러리의 여러 노드 타입은 동일 그룹으로 묶는다.

## 코드 예시: 커스텀 노드

```tsx
export function StageNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <div
      data-agrune-action="click"
      data-agrune-name={data.label}
      data-agrune-desc="스테이지 노드. 드래그하여 이동, 핸들로 연결"
      data-agrune-group="workflow-nodes"
    >
      {data.label}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
```

## data-agrune-meta 속성

캔버스 그룹에 메타데이터 제공 함수를 지정한다. 스냅샷 시 agrune이 `window[fnName]()`을 호출하여 결과를 그룹의 `meta` 필드에 포함한다.

- **위치:** `data-agrune-group`과 같은 요소에 배치
- **값:** `window`에 등록된 전역 함수 이름
- **용도:** 엣지 연결 정보, 스냅 그리드 설정 등 DOM만으로 알 수 없는 메타데이터 제공

```tsx
function WorkflowEditor() {
  const instance = useReactFlow()

  useEffect(() => {
    window.getWorkflowMeta = () => ({
      edges: instance.getEdges().map(e => ({
        source: e.source,
        target: e.target,
      })),
      viewport: instance.getViewport(),
    })
    return () => { delete window.getWorkflowMeta }
  }, [instance])

  return (
    <div
      data-agrune-group="workflow-canvas"
      data-agrune-canvas=".react-flow__viewport"
      data-agrune-meta="getWorkflowMeta"
    >
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  )
}
```

**오류 처리:** 함수 미등록, 예외 발생, 직렬화 불가 시 `meta: null`로 처리. 앱 동작에 영향 없음.

## 줌/팬 조작

캔버스의 줌/팬은 어노테이션이 아니라 `agrune_pointer` 도구의 `wheel` 액션으로 처리된다. 별도 어노테이션 불필요.
