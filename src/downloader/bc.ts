import Axios from 'axios';
import { existsSync, readFileSync, writeFileSync, statSync, utimesSync} from 'fs';
import { padStart } from 'lodash';
import { join } from 'path';
import { BC } from '../models/bc';
import { ExtlistEntry } from '../models/extlist';
import { TEX } from '../models/tex';

export async function downloadBc(
  bcPath_compressed: string, bcPath_game: string, bcPath_TEX2: string,
  extlist: string, entry: ExtlistEntry,
): Promise<void> {
  const key = `${entry.isCards ? 'cards' : 'mons'}_${padStart(entry.id.toString(), 3, '0')}`;
  //这个文件的最终修改时间
  const lastUpdate = new Date((entry.lastUpdate + 16305120) * 60 * 1000);
  const bcFileName_compressed = join(bcPath_compressed, `${key}.bc`);
  const bcFileName_game = join(bcPath_game, `${key}.bc`);
  const bcFileName_TEX2 = join(bcPath_TEX2, `${key}.bc`);
  
  let data: Buffer, bcFileExist_compress: Boolean = false;
  if (existsSync(bcFileName_compressed)) {
    const fileStat = statSync(bcFileName_compressed);
    bcFileExist_compress = fileStat.mtime >= lastUpdate && fileStat.size == entry.compressedSize;
  }
  if (bcFileExist_compress) {
    //已经存在的旧的
    let bcFileExist_game: Boolean = false, bcFileExist_TEX2: Boolean = false;
    if (existsSync(bcFileName_game)) { //游戏版本的文件
      const fileStat = statSync(bcFileName_game);
      bcFileExist_game = fileStat.mtime >= lastUpdate && fileStat.size == entry.compressedSize;
    }
    if (existsSync(bcFileName_TEX2)) { //TEX2版本的文件
      const fileStat = statSync(bcFileName_TEX2);
      bcFileExist_TEX2 = fileStat.mtime >= lastUpdate && fileStat.size == entry.compressedSize;
    }

    if (!bcFileExist_game || !bcFileExist_TEX2)
    {
      data = await readFileSync(bcFileName_compressed);
      const bc = BC.load(data);
      let binData = bc.data;
      if (!bcFileExist_game)
      {
        await writeFileSync(bcFileName_game, entry.isCards ? binData : data);
        utimesSync(bcFileName_game, lastUpdate, lastUpdate);
      }
      if (!bcFileExist_TEX2)
      {
        if (TEX.match(binData)) {
          // upgrade TEX1 to TEX2 for simpler rendering
          const tex = TEX.load(binData);
          if (!tex.info) {
            tex.info = {
              cardWidth: entry.width,
              cardHeight: entry.height,
              numFrames: entry.numFrames,
              frameRate: entry.frameRate,
            };
          }
          binData = TEX.save(tex);
        }
      
        await writeFileSync(bcFileName_TEX2, binData);
        utimesSync(bcFileName_TEX2, lastUpdate, lastUpdate);
      }
    }
  } else {
    console.log(`Start Download ${key}.bc`);
    const resp = await Axios.get(`${key}.bc`, {
      baseURL: extlist,
      responseType: 'arraybuffer',
    });
    data = resp.data;
    await writeFileSync(bcFileName_compressed, data);
    utimesSync(bcFileName_compressed, lastUpdate, lastUpdate);

    //保存解包的bin
    const bc = BC.load(data);
    let binData = bc.data;

    await writeFileSync(bcFileName_game, entry.isCards ? binData : data);
    utimesSync(bcFileName_game, lastUpdate, lastUpdate);

    if (TEX.match(binData)) {
      // upgrade TEX1 to TEX2 for simpler rendering
      const tex = TEX.load(binData);
      if (!tex.info) {
        tex.info = {
          cardWidth: entry.width,
          cardHeight: entry.height,
          numFrames: entry.numFrames,
          frameRate: entry.frameRate,
        };
      }
      binData = TEX.save(tex);
    }
  
    await writeFileSync(bcFileName_TEX2, binData);
    utimesSync(bcFileName_TEX2, lastUpdate, lastUpdate);
  }

}
