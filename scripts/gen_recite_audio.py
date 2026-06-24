#!/usr/bin/env python3
"""
生成并内嵌「朗读音频」RECITE_AUDIO 到 poemgraph.html。
用途：国产安卓(小米等)Chrome 常无 TTS 引擎，speechSynthesis 不发声；
     本脚本把精选诗词预渲染成 mp3(base64)内嵌，作朗读兜底(见 reciteStart/recitePlayAudio)。

依赖：macOS `say`(系统自带) + `ffmpeg`(brew install ffmpeg)。
用法：python3 scripts/gen_recite_audio.py        # 全量重生成 RECITE_AUDIO
     仅需扩覆盖面时，把诗的 id 加进 MID_PICK(或放宽 grade 条件)再跑。

注意：
- 音色用 macOS Tingting(婷婷，清晰女声)，所有设备播放一致。
- Tingting 声调不如浏览器(尤其 Windows MS 音)准；遇到误读，在 TONE_FIX 里登记
  「原字 → 正确声调的同音字」(仅替换音频生成文本，不改页面显示)。已知：鹅 é 被读 1 声。
- 文件体积：小学短诗 ~30KB/首，初中长诗 ~60-120KB/首(base64)。当前 57 首 ~3.3MB。
"""
import re, pathlib, subprocess, base64, os

HTML = pathlib.Path(__file__).resolve().parent.parent / 'poemgraph.html'
VOICE, RATE, BITRATE = 'Tingting', '90', '24k'

# 读音订正(仅用于音频生成，不改显示)：误读字 → 正确声调的同音字
TONE_FIX = {
    '鹅': '俄',   # é(2声)；Tingting 误读 1 声 → 俄(é)
}

# 初中精选(小学 grade<=3 自动全包含)
MID_PICK = ['mulan','wangyue','chunwang','guolingding','shuidiaogetou','yueyeyi',
'chouletian','wuti','emeishan','jiangnanfeng','xingjun9','yeshangshou','fengrujing',
'wanchun','songyouren','dengyouzhou','busuanbao','poszhenzi','guisuishou','yewang',
'guanju','wangdongtinghu','poshansisi']

def main():
    html = HTML.read_text()
    start = html.index('const POEMS=[')
    poems = {}
    for m in re.finditer(r"\{id:'([a-z0-9]+)',title:'([^']*)',grade:(\d)", html[start:]):
        pid, title, grade = m.group(1), m.group(2), int(m.group(3))
        seg = html[start + m.start(): start + m.start() + 5000]
        lm = re.search(r"lines:\[(.*?)\]", seg, re.S)
        lines = re.findall(r"t:'([^']*)'", lm.group(1)) if lm else []
        poems[pid] = (grade, title, lines)

    curated = [p for p, (g, _, _) in poems.items() if g <= 3] + [p for p in MID_PICK if p in poems]
    curated = list(dict.fromkeys(curated))

    os.makedirs('/tmp/rec', exist_ok=True)
    audio, total = {}, 0
    for pid in curated:
        g, title, lines = poems[pid]
        if not lines:
            continue
        txt = '\n'.join(lines)
        for a, b in TONE_FIX.items():
            txt = txt.replace(a, b)
        aiff, mp3 = f'/tmp/rec/{pid}.aiff', f'/tmp/rec/{pid}.mp3'
        subprocess.run(['say', '-v', VOICE, '-r', RATE, '-o', aiff, txt], check=True)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', aiff, '-ac', '1',
                        '-ar', '22050', '-b:a', BITRATE, mp3], check=True)
        b64 = base64.b64encode(pathlib.Path(mp3).read_bytes()).decode()
        audio[pid] = 'data:audio/mpeg;base64,' + b64
        total += len(b64)

    block = 'const RECITE_AUDIO={' + ','.join(f'{p}:"{audio[p]}"' for p in audio) + '};\n'
    if 'const RECITE_AUDIO={' in html:
        html = re.sub(r'const RECITE_AUDIO=\{.*?\};\n', block, html, count=1, flags=re.S)
    else:
        anchor = '/* 朗读：系统 TTS 优先'
        i = html.index(anchor)
        html = html[:i] + block + html[i:]
    HTML.write_text(html)
    print(f'embedded {len(audio)} poems, base64 {total/1024/1024:.2f} MB, '
          f'file {HTML.stat().st_size/1024/1024:.2f} MB')

if __name__ == '__main__':
    main()
