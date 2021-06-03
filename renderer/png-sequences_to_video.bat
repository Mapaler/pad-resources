::渲染MP4（用于分享）
ffmpeg -f image2 -i ./png-sequences/mons_7417-%%01d.png -vcodec libx264 -r 33.333 -b 800000 output.mp4
::渲染WebM(用于网页)
::ffmpeg -f image2 -i ./png-sequences/mons_7417-%%01d.png -vcodec libvpx-vp9 -r 33.333 -b:v 0 -crf 50 -pass 1 -an -f webm NUL &&
::ffmpeg -f image2 -i ./png-sequences/mons_7417-%%01d.png -vcodec libvpx-vp9 -r 33.333 -b:v 0 -crf 50 -pass 2 output.webm
::ffmpeg -i input.mp4 -b:v 0 -crf 30 -pass 1 -an -f webm /dev/null
::ffmpeg -i input.mp4 -b:v 0 -crf 30 -pass 2 output.webm