import Axios from 'axios';
import { existsSync, readFileSync, writeFileSync, statSync, utimesSync} from 'fs';
import { padStart } from 'lodash';
import { join } from 'path';
import { BC } from '../models/bc';
import { ExtlistEntry } from '../models/extlist';
import { TEX } from '../models/tex';

export async function downloadBc(
  bcPath: string, binPath: string, cachePath: string,
  extlist: string, entry: ExtlistEntry,
): Promise<void> {
  const key = `${entry.isCards ? 'cards' : 'mons'}_${padStart(entry.id.toString(), 3, '0')}`;
  //这个文件的最终修改时间
  const lastUpdate = new Date((entry.lastUpdate + 16305120) * 60 * 1000);
  const bcFileName = join(bcPath, `${key}.bc`);
  
  let data: Buffer, fileExist: Boolean = false;
  if (existsSync(bcFileName)) {
    const fileStat = statSync(bcFileName);
    fileExist = fileStat.mtime >= lastUpdate && fileStat.size == entry.compressedSize;
  }
  if (fileExist) {
    //已经存在的旧的
    data = await readFileSync(bcFileName);
  } else {
    console.log(`Start Download ${key}.bc`);
    const resp = await Axios.get(`${key}.bc`, {
      baseURL: extlist,
      responseType: 'arraybuffer',
    });
    data = resp.data;
    await writeFileSync(bcFileName, data);
    utimesSync(bcFileName, lastUpdate, lastUpdate);

    //保存解包的bin
    const bc = BC.load(data);
    let binData = bc.data;
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
  
    await writeFileSync(join(binPath, `${key}.bc`), binData);
    utimesSync(join(binPath, `${key}.bc`), lastUpdate, lastUpdate);
  }

}
