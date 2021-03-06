
import { chunk } from 'lodash';
import { RegionID } from '../config';
import { downloadBaseJson } from '../downloader/base';
import { downloadBc } from '../downloader/bc';
import { downloadExtlist } from '../downloader/extlist';
import { Extlist } from '../models/extlist';
import { mkdir, formatJson } from '../utils';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function main(args: string[]) {
  console.log(`region: ${RegionID}`);
  const outPath = mkdir('data', RegionID);

  const baseJson = await downloadBaseJson(outPath);
  const extlist = Extlist.load(await downloadExtlist(outPath, baseJson.extlist));
  writeFileSync(join(outPath, 'extlist.json'), formatJson(extlist));

  const bcPath_compressed = mkdir(outPath, 'bc_compressed');
  const bcPath_game = mkdir(outPath, 'bc_game');
  const bcPath_TEX2 = mkdir(outPath, 'bc_TEX2');

  const downloadFns = extlist.entries.map((entry) => async () => {
    await downloadBc(bcPath_compressed, bcPath_game, bcPath_TEX2, baseJson.extlist, entry);
  });

  let progress = 0;
  for (const tasks of chunk(downloadFns, 50)) {
    console.log(`${progress}/${downloadFns.length}`);
    await Promise.all(tasks.map((task) => task()));
    progress += tasks.length;
  }

  console.log('up to date.');

  return true;
}
