// 미리보기 전용 노트 목록
// 해당 노트는 기본적으로 미리보기만 표시되며, 편집하기 버튼으로 편집 가능
// 새로운 노트 추가 시 아래 Set에 UUID를 추가하면 됩니다
const PREVIEW_ONLY_NOTES = new Set([
  '5f0e0692-e27c-453b-883e-9f92570022d3', // Notepad 소개
])

export function isPreviewOnlyNote(noteId) {
  return PREVIEW_ONLY_NOTES.has(noteId)
}
