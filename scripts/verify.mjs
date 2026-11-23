// MP4 doğrulama: ffprobe ile teknik özellikler, ffmpeg signalstats ile boş/donuk kare analizi.
// Kullanım: node scripts/verify.mjs out/anicixor-promo.mp4
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const file = process.argv[2] ?? "out/anicixor-promo.mp4";
fs.mkdirSync("report", { recursive: true });
const out = { file, checks: {}, problems: [] };

const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,nb_frames:format=duration,size", "-of", "json", file]).toString());
const s = probe.streams[0];
const duration = Number(probe.format.duration);
const size = Number(probe.format.size);
out.probe = { codec: s.codec_name, profile: s.profile, width: s.width, height: s.height, fps: s.r_frame_rate, pix_fmt: s.pix_fmt, frames: Number(s.nb_frames), duration, size };

const expect = (name, ok, detail) => { out.checks[name] = ok; if (!ok) out.problems.push(`${name}: ${detail}`); };
expect("codec_h264", s.codec_name === "h264", s.codec_name);
expect("resolution_1920x1080", s.width === 1920 && s.height === 1080, `${s.width}x${s.height}`);
expect("fps_30", s.r_frame_rate === "30/1", s.r_frame_rate);
expect("pix_fmt_yuv420p", s.pix_fmt === "yuv420p", s.pix_fmt);
expect("duration_40_50s", duration >= 40 && duration <= 50, String(duration));
expect("size_over_1MB", size > 1_000_000, String(size));

// Bütünlük: tüm akış hatasız çözülmeli.
try { execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] }); expect("full_decode", true, ""); }
catch (e) { expect("full_decode", false, String(e.stderr).slice(0, 200)); }

// Saniyede 1 kare: parlaklık (YAVG) ve önceki kareyle fark (YDIF).
const stats = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "fps=1,signalstats,metadata=print:file=-", "-f", "null", "-"], { maxBuffer: 1 << 26 }).toString();
const yavg = [...stats.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const ydif = [...stats.matchAll(/lavfi\.signalstats\.YDIF=([\d.]+)/g)].map((m) => Number(m[1]));
out.perSecond = yavg.map((v, i) => ({ t: i, yavg: Math.round(v * 10) / 10, ydif: Math.round((ydif[i] ?? 0) * 100) / 100 }));
const dark = out.perSecond.filter((p) => p.yavg < 12).map((p) => p.t);
const frozen = out.perSecond.filter((p) => p.t > 0 && p.ydif < 0.05).map((p) => p.t);
out.darkSeconds = dark;
out.frozenSeconds = frozen;
// Açılış/kapanış hariç çok koyu saniye varsa sahne eksik demektir.
const midDark = dark.filter((t) => t > 8 && t < 40);
expect("no_blank_scenes", midDark.length <= 2, `orta bölümde koyu saniyeler: ${midDark.join(",")}`);
expect("not_mostly_frozen", frozen.length <= Math.floor(duration * 0.3), `donuk saniye sayısı: ${frozen.length}`);

// Görsel inceleme için temas sayfası (3 sn'de bir kare).
try { execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf", "fps=1/3,scale=480:-2,tile=4x4", "-frames:v", "1", "report/contact-sheet.jpg"]); out.contactSheet = "report/contact-sheet.jpg"; } catch { out.contactSheet = null; }

out.passed = out.problems.length === 0;
fs.writeFileSync("report/verify.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ passed: out.passed, probe: out.probe, problems: out.problems }, null, 2));
process.exit(out.passed ? 0 : 1);
