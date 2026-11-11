# Inputs for make_short.py (2026-11-11). Long render: Type video artifact wart_01m75yc8adecwb8gydww1ky6gt rev 1 (long.mp4).
# gap_src.mp4: feed screenshot (public/builds/async-standups/test-feed.webp)
# fix_src.mp4: still of the gaps scene, GAP 43 · SLACK panel with its fix, at 97.4 s
# verdict_src.mp4: still of the gaps scene "All 73 fixed" at 108.8 s
# outro.mp4: first sentence of video/host/outro-generic-v2.mp4 (0-3.55 s, 0.25 s fade)
# final.mp4: make_short.py output + endcard.png overlaid on the last 3.56 s
ffmpeg -v error -y -i test-feed.webp feed.png && ffmpeg -v error -y -loop 1 -i feed.png -t 14 -r 30 -c:v libx264 -pix_fmt yuv420p gap_src.mp4
ffmpeg -v error -y -ss 97.4 -i long.mp4 -frames:v 1 f.png && ffmpeg -v error -y -loop 1 -i f.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p fix_src.mp4
ffmpeg -v error -y -ss 108.8 -i long.mp4 -frames:v 1 v.png && ffmpeg -v error -y -loop 1 -i v.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p verdict_src.mp4
ffmpeg -v error -y -t 3.55 -i outro-generic-v2.mp4 -vf "fade=t=out:st=3.3:d=0.25" -af "afade=t=out:st=3.35:d=0.2" -c:v libx264 -crf 18 -c:a aac outro.mp4
python3 make_short.py short.json
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 geekbot-short.mp4); ST=$(python3 -c "print($D-3.56)")
ffmpeg -v error -y -i geekbot-short.mp4 -loop 1 -i endcard.png -filter_complex "[0:v][1:v]overlay=0:0:enable='gte(t,$ST)':shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a copy -movflags +faststart final.mp4
