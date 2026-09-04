# 출처와 사용 조건

이 프로젝트가 가져다 쓴 자료와 그 조건을 정리한 문서입니다.

## 1. 달 표면 이미지 · 높낮이 자료

**NASA/GSFC/Arizona State University — Lunar Reconnaissance Orbiter (LRO) CGI Moon Kit**

- 색 지도: `lroc_color_poles_2k` (LROC 광각 카메라)
- 높낮이 지도: `ldem_3` (LOLA 레이저 고도계)
- 원본: https://svs.gsfc.nasa.gov/4720/

미국 정부가 만든 저작물이라 저작권이 붙지 않습니다(public domain). 교육·정보 목적으로 허가 없이 쓸 수 있습니다.
다만 NASA는 다음을 요구하거나 요청합니다.

- **출처를 밝힐 것** — 이 프로젝트는 화면 아래와 README에 `NASA/GSFC/Arizona State University` 를 표기합니다.
- **NASA가 보증하는 것처럼 보이게 하지 말 것** — 이 프로젝트는 NASA와 무관한 개인 제작물입니다.
- **NASA 로고·엠블럼은 쓰지 말 것** — 쓰지 않았습니다.

## 1-2. 행성·태양 표면 이미지

**Solar System Scope — Solar System Textures** (CC BY 4.0)
https://www.solarsystemscope.com/textures/

태양, 수성, 금성, 지구, 화성, 목성, 토성(고리 포함), 천왕성, 해왕성의 표면 지도입니다.
NASA 의 탐사선 자료를 바탕으로 만들어졌으며, **저작자 표시(BY)** 조건으로 자유롭게 쓸 수 있습니다.
이 프로젝트는 태양계 화면 안과 이 문서에 출처를 밝힙니다.

## 1-3. 일식·월식 사진

미국항공우주국(NASA)이 공개한 사진입니다. 미국 정부 저작물이라 저작권이 없습니다(public domain).

| 파일 | 내용 | 촬영 |
|---|---|---|
| `public/photo/solar_eclipse.jpg` | 2017년 8월 21일 개기일식 (다이아몬드 링) | NASA / Carla Thomas |
| `public/photo/lunar_eclipse.jpg` | 2022년 11월 8일 개기월식 | NASA / Bill Ingalls |

## 2. 천체 위치 계산

**astronomy-engine** (MIT License) — https://github.com/cosinekitty/astronomy

```
Copyright (c) 2019-2023 Don Cross <cosinekitty@gmail.com>
```

달의 위상·칭동, 월출·월몰, 고도·방위, 태양 남중 고도, 일식·월식 시각을 모두 이 라이브러리로 계산합니다.

## 3. 화면을 그리는 데 쓴 라이브러리

모두 MIT License 입니다.

| 라이브러리 | 저작권 표시 |
|---|---|
| three.js 0.169 | Copyright © 2010-2024 three.js authors |
| React 18.3 · React DOM 18.3 | Copyright (c) Meta Platforms, Inc. and affiliates |
| Vite 5.4 (빌드 도구) | Copyright (c) 2019-present, VoidZero Inc. and Vite contributors |

MIT License 전문:

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 4. 교육과정

교육부 고시 제2022-33호 [별책 9] 과학과 교육과정, 그리고 이에 따른 성취기준별 성취수준 자료.
성취기준 문구는 고시 원문을 그대로 인용했습니다.

## 5. 이 프로젝트 자체

화면 구성, 설명 문장, 시뮬레이션 방식, 교육과정 분석과 화면 설계는 **초인쌤**이 만든 것입니다.
위의 1~4번을 뺀 나머지에 대한 권리는 초인쌤에게 있고, **CC BY-NC-SA 4.0** 으로 이용할 수 있습니다.

- 저작자표시(BY) — 만든 사람이 초인쌤임을 밝혀 주세요
- 비영리(NC) — 돈을 받고 팔거나 상업적으로 이용할 수 없습니다
- 동일조건변경허락(SA) — 고쳐서 배포할 땐 같은 라이선스를 붙여 주세요

전문은 [LICENSE](LICENSE) 에 있습니다. 상업적 이용은 choinssam@gmail.com 으로 문의해 주세요.

NASA 이미지(1번)와 MIT 라이브러리(2·3번)는 각자의 조건을 따르므로, 이 비영리 조건이
그 자료들에까지 적용되지는 않습니다.
