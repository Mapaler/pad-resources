set id=6995
::��Ⱦ��һҳ
if not exist png-single md png-single
node render --bg 0 --single --out-dir png-single ./out/mons_%id%.json
::��Ⱦ����
if not exist png-sequences md png-sequences
node render --bg 0 --out-dir png-sequences ./out/mons_%id%.json