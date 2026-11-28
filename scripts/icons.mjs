// 앱 아이콘과 시작 화면 원본 이미지를 만든다.
// 사이트 로고(파란 바탕에 흰 음표)와 같은 모양이다.
//   npm run icons  ->  assets/*.png, electron/build/icon.png 를 만들고
//                      안드로이드와 iOS 아이콘까지 생성한다.

import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const BLUE = '#256ef4';
const LIGHT_BG = '#ffffff';
const DARK_BG = '#131416';

/** 24x24 기준의 음표. img/icons.svg 의 music 아이콘과 같은 선이다. */
const note = (size, scale, color = '#ffffff') => {
  const offset = (size - 24 * scale) / 2;
  return `
    <g transform="translate(${offset} ${offset}) scale(${scale})"
       fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 17.5V5.5l10-2v12"/>
      <circle cx="6.5" cy="17.5" r="2.5"/>
      <circle cx="16.5" cy="15.5" r="2.5"/>
    </g>`;
};

const svg = (size, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`);

const square = (size, color) => `<rect width="${size}" height="${size}" fill="${color}"/>`;

/** 둥근 사각형 로고. 시작 화면과 PC 앱 아이콘에 쓴다. */
const roundLogo = (size, logoSize) => {
  const x = (size - logoSize) / 2;
  return `
    <rect x="${x}" y="${x}" width="${logoSize}" height="${logoSize}" rx="${logoSize * 0.22}" fill="${BLUE}"/>
    ${note(size, (logoSize * 0.6) / 24)}`;
};

const images = [
  // iOS, 안드로이드 기본 아이콘: 꽉 찬 파란 바탕 (모서리는 운영체제가 둥글게 자른다)
  ['assets/icon-only.png', svg(1024, square(1024, BLUE) + note(1024, 560 / 24))],
  // 안드로이드 적응형 아이콘: 앞면(음표)과 뒷면(바탕)을 나눈다. 앞면은 가운데 안전 영역 안에 둔다.
  ['assets/icon-foreground.png', svg(1024, note(1024, 440 / 24))],
  ['assets/icon-background.png', svg(1024, square(1024, BLUE))],
  // 시작 화면
  ['assets/splash.png', svg(2732, square(2732, LIGHT_BG) + roundLogo(2732, 560))],
  ['assets/splash-dark.png', svg(2732, square(2732, DARK_BG) + roundLogo(2732, 560))],
  // PC 앱 아이콘: 바깥이 투명한 둥근 사각형
  ['electron/build/icon.png', svg(1024, roundLogo(1024, 880))],
];

await mkdir('assets', { recursive: true });
await mkdir('electron/build', { recursive: true });

await Promise.all(images.map(([file, image]) => sharp(image).png().toFile(file)));

images.forEach(([file]) => console.log(`만듦: ${file}`));
