# build_src.mp4: the released-review screenshot (public/builds/performance-reviews/test-released.webp)
# gap_src.mp4: gap-40 panel still (101.8 s) for 5.2 s, then the gap-37 panel still (104.6 s)
# verdict_src.mp4: still of the cost card at 147.5 s
ffmpeg -v error -y -i test-released.webp r.png && ffmpeg -v error -y -loop 1 -i r.png -t 16 -r 30 -c:v libx264 -pix_fmt yuv420p build_src.mp4
ffmpeg -v error -y -ss 101.8 -i long.mp4 -frames:v 1 g1.png && ffmpeg -v error -y -ss 104.6 -i long.mp4 -frames:v 1 g2.png
ffmpeg -v error -y -loop 1 -t 5.4 -i g1.png -loop 1 -t 10 -i g2.png -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" -map "[v]" -r 30 -c:v libx264 -pix_fmt yuv420p gap_src.mp4
ffmpeg -v error -y -ss 147.5 -i long.mp4 -frames:v 1 v.png && ffmpeg -v error -y -loop 1 -i v.png -t 12 -r 30 -c:v libx264 -pix_fmt yuv420p verdict_src.mp4
