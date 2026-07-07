'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'poemgraph.html');
const html = fs.readFileSync(FILE, 'utf8');

function extractConstLine(varName) {
  const re = new RegExp('^const ' + varName + '=.*$', 'm');
  const m = html.match(re);
  if (!m) throw new Error('not found: ' + varName);
  return { text: m[0], index: m.index };
}

const yueLine = extractConstLine('RECITE_AUDIO_YUE');
const evtLine = extractConstLine('EVENT_AUDIO');
const cmnLine = extractConstLine('RECITE_AUDIO');
const guqinLine = extractConstLine('GUQIN_CLIP');

function evalObjRhs(lineText, varName) {
  // Format: const NAME={...};  -- object literal, ends with "};" exactly (verified no trailing comment)
  const prefix = 'const ' + varName + '=';
  let rhs = lineText.slice(prefix.length);
  if (!rhs.endsWith('};')) throw new Error(varName + ': unexpected ending: ' + JSON.stringify(rhs.slice(-30)));
  rhs = rhs.slice(0, -1); // strip trailing ';' only, keep the '}'
  return new Function('return (' + rhs + ')')();
}

function evalGuqinRhs(lineText) {
  // Format: const GUQIN_CLIP='...';/* trailing comment, may be absent */
  const prefix = 'const GUQIN_CLIP=';
  const rhs = lineText.slice(prefix.length);
  if (rhs[0] !== "'") throw new Error('GUQIN_CLIP: expected leading quote, got: ' + JSON.stringify(rhs.slice(0,20)));
  const lastQuote = rhs.lastIndexOf("'");
  if (lastQuote <= 0) throw new Error('GUQIN_CLIP: no closing quote found');
  const strLiteral = rhs.slice(0, lastQuote + 1); // includes both quotes
  return new Function('return (' + strLiteral + ')')();
}

const cmnObj = evalObjRhs(cmnLine.text, 'RECITE_AUDIO');
const yueObj = evalObjRhs(yueLine.text, 'RECITE_AUDIO_YUE');
const evtObj = evalObjRhs(evtLine.text, 'EVENT_AUDIO');
const guqinStr = evalGuqinRhs(guqinLine.text);

console.log('cmn count:', Object.keys(cmnObj).length);
console.log('yue count:', Object.keys(yueObj).length);
console.log('evt count:', Object.keys(evtObj).length);
console.log('guqin length:', guqinStr.length, 'starts:', guqinStr.slice(0,30));

function idArrayDecl(name, obj) {
  return 'const ' + name + '=' + JSON.stringify(Object.keys(obj)) + ';';
}
const idArrays = [
  idArrayDecl('RECITE_AUDIO_IDS', cmnObj),
  idArrayDecl('RECITE_AUDIO_YUE_IDS', yueObj),
  idArrayDecl('EVENT_AUDIO_IDS', evtObj)
].join('\n');

function clipBlocks(track, obj) {
  return Object.keys(obj).map(function(id) {
    return '<script type="text/plain" id="aud-' + track + '-' + id + '">' + obj[id] + '</script>';
  }).join('\n');
}
const cmnBlocks = clipBlocks('cmn', cmnObj);
const yueBlocks = clipBlocks('yue', yueObj);
const evtBlocks = clipBlocks('evt', evtObj);
const guqinBlock = '<script type="text/plain" id="aud-guqin">' + guqinStr + '</script>';

const allIndices = [cmnLine.index, yueLine.index, evtLine.index, guqinLine.index];
const blockStart = Math.min.apply(null, allIndices);
const blockEndCandidates = [cmnLine, yueLine, evtLine, guqinLine].map(function(l){ return l.index + l.text.length; });
const blockEnd = Math.max.apply(null, blockEndCandidates);

const beforeText = html.slice(0, blockStart);
const scriptOpenIdx = beforeText.lastIndexOf('<script>');
const afterText = html.slice(blockEnd);
const scriptCloseRelIdx = afterText.indexOf('</script>');
if (scriptCloseRelIdx < 0) throw new Error('closing </script> not found after block');
const scriptCloseIdx = blockEnd + scriptCloseRelIdx + '</script>'.length;

const gapBefore = html.slice(scriptOpenIdx + '<script>'.length, blockStart);
const gapAfter = html.slice(blockEnd, blockEnd + scriptCloseRelIdx);
if (gapBefore.trim() !== '' || gapAfter.trim() !== '') {
  console.error('WARNING: unexpected content in gap. gapBefore=', JSON.stringify(gapBefore.slice(0,200)), 'gapAfter=', JSON.stringify(gapAfter.slice(0,200)));
  throw new Error('unexpected surrounding content, aborting for safety');
}

const replacement = '<script>\n' + idArrays + '\n</script>\n' +
  cmnBlocks + '\n' + yueBlocks + '\n' + evtBlocks + '\n' + guqinBlock;

const newHtml = html.slice(0, scriptOpenIdx) + replacement + html.slice(scriptCloseIdx);

fs.writeFileSync(FILE + '.new', newHtml, 'utf8');
console.log('Written to', FILE + '.new');
console.log('Old size:', html.length, 'New size:', newHtml.length);

fs.writeFileSync(path.join(__dirname, '_migrate_verify_data.json'), JSON.stringify({
  cmn: cmnObj, yue: yueObj, evt: evtObj, guqin: guqinStr
}), 'utf8');
console.log('Verification data saved.');
