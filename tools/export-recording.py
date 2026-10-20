"""Export recorded live gameplay and its captured Web Audio as H.264/AAC MP4.

No AI-generated game footage, interpolation, speed changes or replacement music.
Browser/bootstrap waits and documented recorder-navigation stalls are trimmed.
"""
import json
import pathlib
import subprocess
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "recordings").resolve()
parts = sys.argv[2:] or ["story", "story-end", "story-finale", "adventure", "living"]
offset = 0.0
chapters = [";FFMETADATA1", "title=LAST SAVE — complete main demo walkthrough",
            "comment=Actual browser gameplay; separate mode chapters; original game audio."]
concat = []
summary = []
for part in parts:
    data = json.loads((root / (part + ".json")).read_text())
    if not data.get("complete") and not data.get("includeRecordedPart"):
        raise RuntimeError(f"{part} did not complete: {data.get('failure')}")
    output = root / (part + ".mp4")
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "warning",
        "-ss", str(data["trimStart"]), "-i", data["rawVideo"],
        "-i", str(root / (part + "-audio.webm")),
        "-map", "0:v:0", "-map", "1:a:0", "-t", str(data.get("exportSeconds", data["recordedSeconds"])),
        "-vf", "fps=25", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-af", "volume=10dB,alimiter=level=false:limit=0.95", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", str(output)
    ], check=True)
    duration = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(output)
    ], text=True))
    for i, item in enumerate(data["chapters"]):
        start = min(item["time"], duration)
        end = min(data["chapters"][i+1]["time"], duration) if i+1 < len(data["chapters"]) else duration
        if end <= start:
            continue
        absolute = offset + start
        stamp = f"{int(absolute)//3600:02}:{int(absolute)//60%60:02}:{int(absolute)%60:02}"
        summary.append(f"{stamp}  {item['title']}")
        chapters.extend(["[CHAPTER]", "TIMEBASE=1/1000", f"START={round(absolute*1000)}",
                         f"END={round((offset+end)*1000)}", "title=" + item["title"].replace("=", "\\=")])
    concat.append("file '" + str(output).replace("'", "'\\''") + "'")
    offset += duration
(root / "parts.txt").write_text("\n".join(concat)+"\n")
(root / "chapters.ffmeta").write_text("\n".join(chapters)+"\n")
(root / "chapters.txt").write_text("\n".join(summary)+"\n")
final = pathlib.Path("/workspace/deliverables/last-save-main-complete-playthrough.mp4")
final.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning", "-f", "concat",
                "-safe", "0", "-i", str(root / "parts.txt"), "-i", str(root / "chapters.ffmeta"),
                "-map_metadata", "1", "-map_chapters", "1", "-c", "copy", "-movflags", "+faststart",
                str(final)], check=True)
print(str(final), "seconds", offset, "bytes", final.stat().st_size)
