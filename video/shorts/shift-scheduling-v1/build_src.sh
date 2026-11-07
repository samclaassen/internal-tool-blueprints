# gaps_src.mp4: stills from the F21 render timed to the gaps narration
set -e
i=0; : > gl.txt
for pair in "97.5 2.9" "101.5 3.0" "105.5 1.6" "108.4 1.4" "110.0 2.6"; do set -- $pair
  ffmpeg -v error -y -ss $1 -i long.mp4 -frames:v 1 g$i.png
  ffmpeg -v error -y -loop 1 -i g$i.png -t $2 -r 30 -c:v libx264 -pix_fmt yuv420p g$i.mp4
  echo "file 'g$i.mp4'" >> gl.txt; i=$((i+1)); done
ffmpeg -v error -y -f concat -safe 0 -i gl.txt -c copy gaps_src.mp4
