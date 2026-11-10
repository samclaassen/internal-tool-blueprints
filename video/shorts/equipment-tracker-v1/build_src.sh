# Inputs for make_short.py (2026-11-10). Long render: Type video artifact wart_01m73c2dpwe3cr6pgcavnx07re rev 2 (long2.mp4).
# gap_src.mp4: import preview screenshot (public/builds/equipment-tracker/test-import-preview.webp)
# fix_src.mp4: outbox screenshot (test-outbox.webp)
# verdict_src.mp4: still of the gaps scene "All 82 fixed" at 105.2 s
# outro.mp4: first sentence of video/host/outro-generic-v2.mp4 (0-3.56 s, 0.25 s fade) so the Short ends on "The full spec is free at personal software factory dot com."
# final.mp4: make_short.py output + endcard.png overlaid on the last 3.56 s ("Free spec: personalsoftwarefactory.com")
ffmpeg -v error -y -i test-import-preview.webp imp.png && ffmpeg -v error -y -loop 1 -i imp.png -t 14 -r 30 -c:v libx264 -pix_fmt yuv420p gap_src.mp4
ffmpeg -v error -y -i test-outbox.webp out.png && ffmpeg -v error -y -loop 1 -i out.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p fix_src.mp4
ffmpeg -v error -y -ss 105.2 -i long2.mp4 -frames:v 1 v.png && ffmpeg -v error -y -loop 1 -i v.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p verdict_src.mp4
ffmpeg -v error -y -t 3.55 -i outro-generic-v2.mp4 -vf "fade=t=out:st=3.3:d=0.25" -af "afade=t=out:st=3.35:d=0.2" -c:v libx264 -crf 18 -c:a aac outro.mp4
python3 make_short.py short.json
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 asset-panda-short.mp4); ST=$(python3 -c "print($D-3.56)")
ffmpeg -v error -y -i asset-panda-short.mp4 -loop 1 -i endcard.png -filter_complex "[0:v][1:v]overlay=0:0:enable='gte(t,$ST)':shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a copy -movflags +faststart final.mp4
