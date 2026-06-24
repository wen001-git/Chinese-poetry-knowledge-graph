#!/usr/bin/env python3
"""
生成并内嵌「朗读音频」RECITE_AUDIO 到 poemgraph.html（仅【语舒】· 离线版）。

用途：国产安卓(小米等)Chrome 常无 TTS 引擎 → speechSynthesis 不发声；
     本脚本把精选诗词用【语舒】预渲染成 mp3(base64)内嵌作离线朗读兜底(全设备可用)。
     朗读音色分工(见 poemgraph.html reciteStart)：
       · 语舒 = 离线内嵌音频(默认，手机/小米也能读)
       · 语舒 / Li-Mu = 浏览器系统 TTS(零字节，依赖设备语音引擎)

引擎：macOS AVSpeechSynthesis(/tmp/synth_batch.swift) → ffmpeg 转 mp3 单声道 → base64。
     已存在 /tmp/rec3/{pid}__yushu.{caf,mp3} 则复用，不重合成(省时)。
依赖：macOS(swift) + ffmpeg。

数据结构：const RECITE_AUDIO = { poemId: "data:audio/mpeg;base64,...", ... }   # 单字符串 = 语舒

扩覆盖面：把诗 id 加进 MID_PICK（小学 grade<=3 自动全包含）再跑。
订正误读：在 TONE_FIX 登记「原字→正确声调同音字」(仅改音频文本，不改显示)。
"""
import re, pathlib, subprocess, base64, os

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'poemgraph.html'
SWIFT = '/tmp/synth_batch.swift'
REC_DIR = '/tmp/rec3'
RATE, BITRATE = '0.42', '22k'
VOICE = 'com.apple.ttsbundle.siri_yushu_zh-CN_compact'   # 语舒（离线内嵌）
TONE_FIX = {'鹅': '俄'}  # 鹅 é(2声) 部分音误读 → 俄(é)；同声调同音字，安全
MID_PICK = ['mulan','wangyue','chunwang','guolingding','shuidiaogetou','yueyeyi',
'chouletian','wuti','emeishan','jiangnanfeng','xingjun9','yeshangshou','fengrujing',
'wanchun','songyouren','dengyouzhou','busuanbao','poszhenzi','guisuishou','yewang',
'guanju','wangdongtinghu','poshansisi']


def main():
    html = HTML.read_text()
    start = html.index('const POEMS=[')
    poems = {}
    for m in re.finditer(r"\{id:'([a-z0-9]+)',title:'([^']*)',grade:(\d)", html[start:]):
        pid, grade = m.group(1), int(m.group(3))
        seg = html[start + m.start(): start + m.start() + 5000]
        lm = re.search(r"lines:\[(.*?)\]", seg, re.S)
        lines = re.findall(r"t:'([^']*)'", lm.group(1)) if lm else []
        poems[pid] = (grade, lines)
    curated = [p for p, (g, _) in poems.items() if g <= 3] + [p for p in MID_PICK if p in poems]
    curated = [p for p in dict.fromkeys(curated) if poems[p][1]]

    os.makedirs(REC_DIR, exist_ok=True)
    # 仅合成缺失的 .caf（已有语舒片段则复用，不重合成）
    jobs = []
    for pid in curated:
        caf = f'{REC_DIR}/{pid}__yushu.caf'
        if os.path.exists(caf):
            continue
        txt = '\n'.join(poems[pid][1])
        for a, b in TONE_FIX.items():
            txt = txt.replace(a, b)
        esc = txt.replace('\n', '\\n')
        jobs.append(f"{VOICE}\t{caf}\t{esc}")
    if jobs:
        pathlib.Path('/tmp/jobs.tsv').write_text('\n'.join(jobs))
        print(f"synthesizing {len(jobs)} missing meijia clips...")
        subprocess.run(['swift', SWIFT, '/tmp/jobs.tsv', RATE], check=True)
    else:
        print("all yushu .caf present → skip synth (reuse)")

    audio = {}; tot = 0
    for pid in curated:
        caf = f'{REC_DIR}/{pid}__yushu.caf'
        mp3 = f'{REC_DIR}/{pid}__yushu.mp3'
        if not os.path.exists(mp3):
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', caf, '-ac', '1',
                            '-ar', '22050', '-b:a', BITRATE, mp3], check=True)
        b64 = base64.b64encode(pathlib.Path(mp3).read_bytes()).decode()
        audio[pid] = 'data:audio/mpeg;base64,' + b64
        tot += len(b64)

    block = 'const RECITE_AUDIO={' + ','.join(f'{p}:"{audio[p]}"' for p in audio) + '};\n'
    if 'const RECITE_AUDIO={' in html:
        html = re.sub(r'const RECITE_AUDIO=\{.*?\};\n', block, html, count=1, flags=re.S)
    else:  # 首次注入：放在朗读模块注释之前
        i = html.index('F · 朗读')
        i = html.rfind('\n', 0, i) + 1
        i = html.rfind('/*', 0, i)
        html = html[:i] + block + html[i:]
    HTML.write_text(html)
    print(f"poems={len(audio)} (语舒/离线)  audio base64 {tot/1024/1024:.2f} MB  "
          f"file {HTML.stat().st_size/1024/1024:.2f} MB")


if __name__ == '__main__':
    main()
