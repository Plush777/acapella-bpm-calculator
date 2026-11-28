import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해서 어느 주소 아래에 올려도 동작하게 한다.
  base: './',
  build: {
    outDir: 'dist',
  },
});
