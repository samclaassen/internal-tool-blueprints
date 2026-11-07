set -e
cd ~/samclaassen-1/s31
# piece <out> <start> <dur> <hold_total> <crop w:h:x:y> <canvas WxH>
piece() { # play $3 s from $2, then hold last frame until total $4
  ffmpeg -v error -y -ss $2 -t $3 -i long.mp4 -an -vf "crop=$5,scale=w=940:h=680:force_original_aspect_ratio=decrease,pad=940:680:(ow-iw)/2:(oh-ih)/2:color=0xf4f1ea,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=$(python3 -c "print(max(0,$4-$3))")" -c:v libx264 -pix_fmt yuv420p -r 30 $1
}
cat_pieces() { out=$1; shift; : > list.txt; for p in "$@"; do echo "file '$p'" >> list.txt; done; ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy $out; }
# rule: left card 0-6.0, right panel 6.0-11.6, left card with R5 to end
piece r1.mp4 33.5 6.0 6.0 940:680:60:250
piece r2.mp4 36.0 5.6 5.6 880:680:1020:250
piece r3.mp4 41.5 0.1 2.6 940:680:60:250
cat_pieces rulesrc.mp4 r1.mp4 r2.mp4 r3.mp4
# gaps: panel crop
piece g1.mp4 100.3 0.1 4.8 940:680:940:250
piece g2.mp4 100.8 3.0 3.0 940:680:940:250
piece g3.mp4 104.2 0.1 0.9 940:680:940:250
piece g4.mp4 105.6 0.1 2.5 940:680:940:250
cat_pieces gapsrc.mp4 g1.mp4 g2.mp4 g3.mp4 g4.mp4
# untested: wider list crop, keep its own aspect
ffmpeg -v error -y -ss 115.5 -t 3.1 -i long.mp4 -an -vf "crop=1180:720:40:150,fps=30,tpad=stop_mode=clone:stop_duration=6.2,setsar=1" -c:v libx264 -pix_fmt yuv420p untsrc.mp4
for f in rulesrc gapsrc untsrc; do echo $f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f.mp4); done
