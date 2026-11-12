# Inputs for make_short.py (2026-11-12, family D). Long render: Type video artifact wart_01m78gvbyme9fsqj7bdgshfd61 rev 1 (long.mp4).
# demo_src.mp4, preview_src.mp4, budget_src.mp4: test-schedule.webp, test-booking-preview.webp, test-project.webp from public/builds/capacity-planner
# untested_src.mp4: still of the long render's NOT TESTED scene at 121.53 s
# outro.mp4: first sentence of video/host/outro-generic-v2.mp4 (0-3.55 s, 0.25 s fade)
# final.mp4: make_short.py output + endcard.png overlaid on the last 3.56 s
for p in "schedule demo" "booking-preview preview" "project budget"; do set -- $p; ffmpeg -v error -y -i test-$1.webp $2.png && ffmpeg -v error -y -loop 1 -i $2.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p ${2}_src.mp4; done
ffmpeg -v error -y -ss 121.53 -i long.mp4 -frames:v 1 u.png && ffmpeg -v error -y -loop 1 -i u.png -t 10 -r 30 -c:v libx264 -pix_fmt yuv420p untested_src.mp4
ffmpeg -v error -y -t 3.55 -i outro-generic-v2.mp4 -vf "fade=t=out:st=3.3:d=0.25" -af "afade=t=out:st=3.35:d=0.2" -c:v libx264 -crf 18 -c:a aac outro.mp4
python3 make_short.py short.json
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 float-short.mp4); ST=$(python3 -c "print($D-3.56)")
ffmpeg -v error -y -i float-short.mp4 -loop 1 -i endcard.png -filter_complex "[0:v][1:v]overlay=0:0:enable='gte(t,$ST)':shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a copy -movflags +faststart final.mp4
