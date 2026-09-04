# -*- coding: utf-8 -*-
"""캡처한 프레임을 인디스쿨에 올릴 GIF 로 묶는다."""
import io, os, sys, glob
from PIL import Image

OUT = 'docs/gif'
os.makedirs(OUT, exist_ok=True)

SCENES = [
    # (폴더, 결과이름, 자르기(하단), 가로폭, 프레임간격ms, 색수)
    ('01-phase',   'phase',   700, 860, 110, 160),
    ('02-globe',   'globe',   760, 860, 90,  160),
    ('03-month',   'month',   740, 860, 130, 160),
    ('04-tonight', 'tonight', 700, 860, 110, 160),
    ('05-earth',   'earth',   760, 860, 100, 160),
    ('06-season',  'season',  700, 860, 130, 160),
    ('07-stars',   'stars',   740, 860, 95,  160),
    ('08-planets', 'planets', 740, 860, 150, 180),
    ('09-tide',    'tide',    700, 860, 95,  160),
    ('10-eclipse', 'eclipse', 700, 860, 150, 180),
]

for folder, name, cut, W, dur, colors in SCENES:
    files = sorted(glob.glob(f'capture/{folder}/frame_*.png'))
    if not files:
        print('건너뜀(프레임 없음):', folder); continue
    frames = []
    for f in files:
        im = Image.open(f).convert('RGB')
        im = im.crop((0, 0, im.width, min(cut, im.height)))
        h = round(im.height * W / im.width)
        im = im.resize((W, h), Image.LANCZOS)
        frames.append(im.convert('P', palette=Image.ADAPTIVE, colors=colors))
    dst = f'{OUT}/{name}.gif'
    frames[0].save(dst, save_all=True, append_images=frames[1:],
                   duration=dur, loop=0, optimize=True, disposal=2)
    kb = os.path.getsize(dst) / 1024
    print(f'{name}.gif  {len(frames)}프레임  {W}x{frames[0].height}  {kb:.0f}KB')
