import { defineConfig } from 'vitest/config'

// 순수 로직 단위 테스트용. 컴포넌트/훅 테스트를 추가할 때
// environment를 'jsdom'으로 바꾸고 @testing-library/react를 설치하면 된다.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
