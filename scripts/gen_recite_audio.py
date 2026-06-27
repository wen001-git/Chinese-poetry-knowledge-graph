#!/usr/bin/env python3
"""
生成并内嵌「朗读 / 历史故事」音频到 poemgraph.html（手机离线可播·三轨）。

用途：国产安卓(小米等)Chrome 常无 TTS 引擎 → speechSynthesis 不发声；
     本脚本把内容预渲染成 mp3(base64)内嵌作离线兜底(全设备可播)：
       · RECITE_AUDIO     = 语舒·普通话·诗词朗读（默认音色，见 reciteStart）
       · RECITE_AUDIO_YUE = 善怡·粤语·诗词朗读（recLang=cantonese 时用）
       · EVENT_AUDIO      = 语舒·历史故事旁白（openEvent/eventNarrate 时用）
     另两个浏览器音色(美嘉/Li-Mu/事件男声)仍走系统 TTS(零字节)。

引擎：macOS AVSpeechSynthesis(/tmp/synth_batch.swift) → ffmpeg 22k 单声道 → base64。
     已存在 /tmp/rec3/*.caf 则复用，不重合成(省时)。
依赖：macOS(swift) + ffmpeg。

扩覆盖面：诗加进 MID_PICK（小学 grade<=6 自动全包含）；事件自动全包含(EVENTS)。
订正误读：TONE_FIX 登记「原字→正确声调同音字」(仅改音频文本，不改显示)。
"""
import re, pathlib, subprocess, base64, os

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'poemgraph.html'
SWIFT = '/tmp/synth_batch.swift'
REC_DIR = '/tmp/rec3'
RATE, BITRATE = '0.42', '22k'
V_YUSHU = 'com.apple.ttsbundle.siri_yushu_zh-CN_compact'   # 语舒·普通话
V_SINJI = 'com.apple.voice.compact.zh-HK.Sinji'           # 善怡·粤语
TONE_FIX = {'鹅': '俄'}
MID_PICK = ['mulan','wangyue','chunwang','guolingding','shuidiaogetou','yueyeyi',
'chouletian','wuti','emeishan','jiangnanfeng','xingjun9','yeshangshou','fengrujing',
'wanchun','songyouren','dengyouzhou','busuanbao','poszhenzi','guisuishou','yewang',
'guanju','wangdongtinghu','poshansisi']


def parse_poet_names(html):
    """诗人 id → 姓名，用于朗读开头报「朝代·作者」。"""
    start = html.index('const POETS=')
    block = html[start: html.index('\n};', start) + 3]
    return {m.group(1): m.group(2) for m in re.finditer(r"([a-z0-9]+):\{name:'([^']*)'", block)}


def parse_poems(html):
    start = html.index('const POEMS=[')
    poems = {}
    for m in re.finditer(r"\{id:'([a-z0-9]+)',title:'([^']*)',grade:(\d)", html[start:]):
        pid, title, grade = m.group(1), m.group(2), int(m.group(3))
        seg = html[start + m.start(): start + m.start() + 5000]
        lm = re.search(r"lines:\[(.*?)\]", seg, re.S)
        lines = re.findall(r"t:'([^']*)'", lm.group(1)) if lm else []
        dm = re.search(r"dyn:'([^']*)'", seg); pm = re.search(r"poet:'([^']*)'", seg)
        poems[pid] = (grade, lines, title, dm.group(1) if dm else '', pm.group(1) if pm else '')
    return poems


def parse_events(html):
    start = html.index('const EVENTS=[')
    block = html[start: html.index('\n];', start)]
    evs = []
    for m in re.finditer(r"\{id:'([a-z0-9]+)',year:'([^']*)',[^}]*?t:'([^']*)',desc:'([^']*)',impact:'([^']*)'", block):
        evs.append(m.groups())   # (id, year, t, desc, impact)
    return evs


def synth(jobs):
    """jobs: [(vid, caf, text)]，只合成缺失的 .caf。"""
    pending = [(v, c, t) for v, c, t in jobs if not os.path.exists(c)]
    if not pending:
        print(f"  {len(jobs)} clips all cached → skip synth")
        return
    tsv = '\n'.join(v + '\t' + c + '\t' + t.replace('\n', '\\n') for v, c, t in pending)
    pathlib.Path('/tmp/jobs.tsv').write_text(tsv)
    print(f"  synthesizing {len(pending)}/{len(jobs)} clips...")
    subprocess.run(['swift', SWIFT, '/tmp/jobs.tsv', RATE], check=True)


def mp3_b64(caf, mp3):
    if not os.path.exists(mp3):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', caf, '-ac', '1',
                        '-ar', '22050', '-b:a', BITRATE, mp3], check=True)
    return 'data:audio/mpeg;base64,' + base64.b64encode(pathlib.Path(mp3).read_bytes()).decode()


def embed(html, varname, mapping):
    block = 'const ' + varname + '={' + ','.join('%s:"%s"' % (k, v) for k, v in mapping.items()) + '};\n'
    if 'const ' + varname + '={' in html:
        return re.sub(r'const ' + varname + r'=\{.*?\};\n', block, html, count=1, flags=re.S)
    anchor = html.index('F · 朗读')
    i = html.rfind('/*', 0, html.rfind('\n', 0, anchor) + 1)
    return html[:i] + block + html[i:]


def main():
    html = HTML.read_text()
    poems = parse_poems(html)
    poet_names = parse_poet_names(html)
    curated = [p for p, v in poems.items() if v[0] <= 6] + [p for p in MID_PICK if p in poems]
    curated = [p for p in dict.fromkeys(curated) if poems[p][1]]
    os.makedirs(REC_DIR, exist_ok=True)

    def ptext(pid):
        _, lines, title, dyn, poet = poems[pid]
        author = poet_names.get(poet, '')
        # 开头报题：「标题。朝代·作者。」再读正文（句号→自然停顿，与句间节奏一致）
        head = title + '。' + (dyn + '·' if dyn else '') + author + '。'
        t = head + '\n' + '\n'.join(lines)
        for a, b in TONE_FIX.items():
            t = t.replace(a, b)
        return t

    # 1) 语舒·普通话·诗
    synth([(V_YUSHU, f'{REC_DIR}/{p}__yushu.caf', ptext(p)) for p in curated])
    rec = {p: mp3_b64(f'{REC_DIR}/{p}__yushu.caf', f'{REC_DIR}/{p}__yushu.mp3') for p in curated}

    # 2) 善怡·粤语·诗
    synth([(V_SINJI, f'{REC_DIR}/{p}__sinji.caf', ptext(p)) for p in curated])
    yue = {p: mp3_b64(f'{REC_DIR}/{p}__sinji.caf', f'{REC_DIR}/{p}__sinji.mp3') for p in curated}

    # 3) 语舒·历史故事旁白
    events = parse_events(html)

    def etext(eid, year, t, desc, impact):
        s = f'{t}，{year}年。\n{desc}'
        if impact:
            s += f'\n对诗人与诗作的影响。\n{impact}'
        return s
    synth([(V_YUSHU, f'{REC_DIR}/evt_{e[0]}__yushu.caf', etext(*e)) for e in events])
    evt = {e[0]: mp3_b64(f'{REC_DIR}/evt_{e[0]}__yushu.caf', f'{REC_DIR}/evt_{e[0]}__yushu.mp3') for e in events}

    html = embed(html, 'RECITE_AUDIO', rec)
    html = embed(html, 'RECITE_AUDIO_YUE', yue)
    html = embed(html, 'EVENT_AUDIO', evt)
    HTML.write_text(html)

    mb = lambda d: sum(len(v) for v in d.values()) / 1024 / 1024
    print(f"普通话诗={len(rec)}({mb(rec):.2f}MB)  粤语诗={len(yue)}({mb(yue):.2f}MB)  "
          f"历史故事={len(evt)}({mb(evt):.2f}MB)  文件 {HTML.stat().st_size/1024/1024:.2f}MB")


if __name__ == '__main__':
    main()
