// 태그 정규화/추가/삭제 순수 로직.
// UI(TagInput)에서 분리해 단위 테스트 가능하게 함.

/** 입력 문자열을 태그 표준형으로 변환: trim → 선행 # 제거 → 재trim → 내부 공백 축약(-) → 소문자 */
export function normalizeTag(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^#+/, '')
    .trim()
    .replace(/[ \t]+/g, '-')
    .toLowerCase()
}

/**
 * 태그 추가. 빈 값이거나 이미 존재하면 입력 배열을 "그대로(같은 참조)" 반환.
 * 추가되면 새 배열을 반환한다.
 */
export function addTag(tags, raw) {
  const val = normalizeTag(raw)
  if (!val || tags.includes(val)) return tags
  return [...tags, val]
}

/** 태그 삭제. 항상 새 배열 반환(없는 태그면 내용 동일한 새 배열). */
export function removeTag(tags, tag) {
  return tags.filter((t) => t !== tag)
}
