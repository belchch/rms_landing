#!/usr/bin/env python3
"""Assemble index.html and mockup/index.html from src/: inline the wordmark SVGs (unique
gradient ids per occurrence) and the shared mobile screens."""
import re, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
wm = {k: open(f'img/planbee-wordmark-{k}.svg', encoding='utf-8').read().strip() for k in ('white', 'black')}
screens_src = open('src/screens.html', encoding='utf-8').read()
screens = {m.group(1): m.group(2).strip() for m in re.finditer(r'<!-- screen:(\w+) -->\s*(.*?)(?=<!-- screen:|\Z)', screens_src, re.S)}
counter = [0]

def inline_wm(kind):
    counter[0] += 1
    gid = f'pbg{counter[0]}'
    return wm[kind].replace(f'id="g{kind}"', f'id="{gid}"').replace(f'url(#g{kind})', f'url(#{gid})')

def render(src):
    def screens_sub(m):
        return '\n'.join(screens[name] for name in m.group(1).split(','))
    out = re.sub(r'\{\{SCREENS:([\w,]+)\}\}', screens_sub, src)
    out = re.sub(r'\{\{WM_WHITE\}\}', lambda m: inline_wm('white'), out)
    out = re.sub(r'\{\{WM_BLACK\}\}', lambda m: inline_wm('black'), out)
    return out

os.makedirs('mockup', exist_ok=True)
open('index.html', 'w', encoding='utf-8').write(render(open('src/index.html', encoding='utf-8').read()))
open('mockup/index.html', 'w', encoding='utf-8').write(render(open('src/mockup.html', encoding='utf-8').read()))
print('assembled index.html, mockup/index.html; wordmarks inlined:', counter[0])
