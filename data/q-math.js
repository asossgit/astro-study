/* 数学 ※オリジナル問題 */
(() => {
const ax = (w, h, ox, oy) => `<line x1="10" y1="${oy}" x2="${w - 10}" y2="${oy}" stroke="#172033" stroke-width="1.2"/><line x1="${ox}" y1="${h - 8}" x2="${ox}" y2="8" stroke="#172033" stroke-width="1.2"/><text x="${w - 16}" y="${oy - 6}">x</text><text x="${ox + 6}" y="16">y</text><text x="${ox - 12}" y="${oy + 14}">O</text>`;
const grid = (w, h, ox, oy, s) => { let g = ''; for (let x = ox % s; x < w; x += s) g += `<line x1="${x}" y1="8" x2="${x}" y2="${h - 8}" stroke="#eef1f6"/>`; for (let y = oy % s; y < h; y += s) g += `<line x1="10" y1="${y}" x2="${w - 10}" y2="${y}" stroke="#eef1f6"/>`; return g; };
const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-size="12" fill="#172033" font-family="sans-serif">${inner}</svg>`;

QB.add([
{id:'math-1-1',s:'math',l:1,q:'方程式 2x + 3 = 11 を解け。',c:['x = 3','x = 4','x = 5','x = 7','x = 8'],a:1,e:'2x = 11 − 3 = 8 より x = 4。'},
{id:'math-1-2',s:'math',l:1,q:'半径 3 cm の円の面積はいくらか。ただし円周率を π とする。',c:['3π cm²','6π cm²','9π cm²','12π cm²','27π cm²'],a:2,e:'円の面積 ＝ πr² ＝ π × 3² ＝ 9π cm²。円周は 2πr ＝ 6π cm。'},
{id:'math-1-3',s:'math',l:1,q:'図の直角三角形で、斜辺 x の長さはいくらか。',
 fig:svg(240,150,`<path d="M40 130 L200 130 L40 10 Z" fill="#e8eefc" stroke="#2457d6" stroke-width="2"/><path d="M40 118 h12 v12" fill="none" stroke="#2457d6"/><text x="112" y="146">4</text><text x="24" y="74">3</text><text x="128" y="64" fill="#d63b3b" font-weight="bold">x</text>`),
 c:['5','6','7','√7','12'],a:0,e:'三平方の定理：x² ＝ 3² ＋ 4² ＝ 25 より x ＝ 5。「3:4:5」は代表的な直角三角形の辺の比。'},
{id:'math-1-4',s:'math',l:1,q:'1個のサイコロを1回投げるとき、偶数の目が出る確率はいくらか。',c:['1/6','1/3','1/2','2/3','5/6'],a:2,e:'偶数の目は 2, 4, 6 の3通り。3/6 ＝ 1/2。'},
{id:'math-1-5',s:'math',l:1,q:'図の直線の式として、正しいものはどれか（1目盛りは1）。',
 fig:svg(220,200,grid(220,200,100,140,25)+ax(220,200,100,140)+`<line x1="62.5" y1="190" x2="150" y2="15" stroke="#d63b3b" stroke-width="2.2"/><circle cx="100" cy="115" r="3.5" fill="#d63b3b"/><circle cx="125" cy="65" r="3.5" fill="#d63b3b"/><text x="122" y="155" font-size="10">1</text><text x="86" y="120" font-size="10">1</text>`),
 c:['y = 2x + 1','y = x + 1','y = −2x + 1','y = 2x − 1','y = x + 2'],a:0,e:'y切片は 1（点(0, 1)を通る）。x が 1 増えると y は 1 → 3 と 2 増えるので傾きは 2。よって y ＝ 2x ＋ 1。'},
{id:'math-2-1',s:'math',l:2,q:'2次方程式 x² − 5x + 6 = 0 の解として、正しいものはどれか。',c:['x = 2, 3','x = −2, −3','x = 1, 6','x = −1, 6','x = 2, −3'],a:0,e:'因数分解すると (x − 2)(x − 3) ＝ 0 より x ＝ 2, 3。解と係数の関係より、2解の和 ＝ 5、積 ＝ 6 でも確認できる。'},
{id:'math-2-2',s:'math',l:2,q:'図は 2次関数 y = x² − 4x + 3 のグラフである。このグラフの頂点の座標はどれか。',
 fig:svg(240,200,grid(240,200,80,140,25)+ax(240,200,80,140)+`<path d="M70 21 Q130 309 190 21" fill="none" stroke="#2457d6" stroke-width="2.2"/><circle cx="105" cy="140" r="3" fill="#2457d6"/><circle cx="155" cy="140" r="3" fill="#2457d6"/><text x="101" y="156" font-size="10">1</text><text x="151" y="156" font-size="10">3</text><text x="66" y="69" font-size="10">3</text><circle cx="80" cy="65" r="3" fill="#2457d6"/>`),
 c:['(2, −1)','(−2, −1)','(2, 1)','(4, 3)','(1, 0)'],a:0,e:'平方完成：y ＝ (x − 2)² − 1。頂点は (2, −1)。グラフが x軸と交わる x ＝ 1, 3 の中点が軸 x ＝ 2 になることからも分かる。'},
{id:'math-2-3',s:'math',l:2,q:'図の直角三角形ABCで、∠C = 90°、∠A = 30°、AB = 10 のとき、BC の長さはいくらか。',
 fig:svg(260,170,`<path d="M30 150 L230 150 L230 35 Z" fill="#e8eefc" stroke="#2457d6" stroke-width="2"/><path d="M218 150 v-12 h12" fill="none" stroke="#2457d6"/><text x="14" y="160">A</text><text x="236" y="160">C</text><text x="236" y="34">B</text><text x="64" y="144" font-size="11">30°</text><path d="M70 150 A40 40 0 0 0 66 131" fill="none" stroke="#172033"/><text x="110" y="80">10</text><text x="238" y="98" fill="#d63b3b" font-weight="bold">?</text>`),
 c:['5','5√2','5√3','10√3','20'],a:0,e:'sin30° ＝ BC/AB ＝ 1/2 より BC ＝ 10 × 1/2 ＝ 5。30°・60°・90°の直角三角形の辺の比は 1 : √3 : 2（AC ＝ 5√3）。'},
{id:'math-2-4',s:'math',l:2,q:'大小2個のサイコロを同時に投げるとき、出た目の和が7になる確率はいくらか。',c:['1/12','1/9','1/6','7/36','1/4'],a:2,e:'全事象は 6 × 6 ＝ 36 通り。和が7になるのは (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) の6通り。6/36 ＝ 1/6。和の中で最も起こりやすい。'},
{id:'math-2-5',s:'math',l:2,q:'初項 3、公差 4 の等差数列の第10項はいくらか。',c:['36','39','40','43','210'],a:1,e:'一般項 aₙ ＝ a₁ ＋ (n − 1)d ＝ 3 ＋ 9 × 4 ＝ 39。なお初項から第10項までの和は 10 × (3 ＋ 39)/2 ＝ 210。'},
{id:'math-3-1',s:'math',l:3,q:'関数 f(x) = x³ − 3x の極大値はいくらか。',c:['−2','0','1','2','3'],a:3,e:'f′(x) ＝ 3x² − 3 ＝ 3(x + 1)(x − 1)。x ＝ −1 で f′ が正→負に変わるので極大。f(−1) ＝ −1 ＋ 3 ＝ 2。x ＝ 1 で極小値 −2。'},
{id:'math-3-2',s:'math',l:3,q:'図の斜線部分（放物線 y = x²、x軸、直線 x = 2 で囲まれた部分）の面積はいくらか。',
 fig:svg(220,190,`<line x1="20" y1="170" x2="210" y2="170" stroke="#172033" stroke-width="1.2"/><line x1="50" y1="182" x2="50" y2="10" stroke="#172033" stroke-width="1.2"/><path d="M50 170 Q110 170 170 110 L170 170 Z" fill="#5b47d6" fill-opacity=".25" stroke="none"/><path d="M50 170 Q122 170 194 83.6" fill="none" stroke="#2457d6" stroke-width="2.2"/><line x1="170" y1="20" x2="170" y2="180" stroke="#8a94a6" stroke-dasharray="4 3"/><text x="166" y="186" font-size="11">2</text><text x="36" y="184" font-size="11">O</text><text x="176" y="80">y = x²</text><text x="174" y="30" font-size="11">x = 2</text>`),
 c:['2','8/3','4','16/3','8'],a:1,e:'∫₀² x² dx ＝ [x³/3]₀² ＝ 8/3。'},
{id:'math-3-3',s:'math',l:3,q:'図の三角形ABCで、AB = 8、AC = 5、∠A = 60° のとき、BC の長さはいくらか。',
 fig:svg(260,180,`<path d="M40 160 L216 160 L95 64.7 Z" fill="#e8eefc" stroke="#2457d6" stroke-width="2"/><text x="24" y="172">A</text><text x="220" y="172">B</text><text x="90" y="56">C</text><text x="122" y="176">8</text><text x="52" y="110">5</text><path d="M64 160 A24 24 0 0 0 52 139.2" fill="none" stroke="#172033"/><text x="68" y="150" font-size="11">60°</text><text x="162" y="104" fill="#d63b3b" font-weight="bold">?</text>`),
 c:['√39','7','√89','9','√129'],a:1,e:'余弦定理：BC² ＝ AB² ＋ AC² − 2·AB·AC·cos60° ＝ 64 ＋ 25 − 2·8·5·(1/2) ＝ 49。よって BC ＝ 7。'},
{id:'math-3-4',s:'math',l:3,q:'log₁₀2 = 0.3010 とするとき、2⁵⁰ は何桁の整数か。',c:['14桁','15桁','16桁','17桁','50桁'],a:2,e:'log₁₀2⁵⁰ ＝ 50 × 0.3010 ＝ 15.05。よって 10¹⁵ ≦ 2⁵⁰ ＜ 10¹⁶ なので16桁。'},
{id:'math-3-5',s:'math',l:3,q:'赤玉3個と白玉2個が入った袋から、同時に2個の玉を取り出すとき、2個とも赤玉である確率はいくらか。',c:['3/25','1/5','3/10','2/5','9/25'],a:2,e:'取り出し方の総数は ₅C₂ ＝ 10 通り、2個とも赤は ₃C₂ ＝ 3 通り。よって 3/10。'},
]);
})();
