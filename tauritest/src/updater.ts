import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from "@tauri-apps/api/app"
import { platform } from '@tauri-apps/plugin-os'; // Or check current platform
import { download } from '@tauri-apps/plugin-upload';
import { appCacheDir, join } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import {
  install,
  canInstall,
  requestInstallPermission,
} from "tauri-plugin-android-installer-api";

export async function handleUpdate(progressSetter: (a: number) => void) {
  const currentPlatform = platform();
  if (['macos', 'windows', 'linux'].includes(currentPlatform)) {
    const update = await check();
    if (update) {
      console.log(
        `found update ${update.version} from ${update.date} with notes ${update.body}`
      );
      let downloaded = 0;
      let contentLength = 0;
      // alternatively we could also call update.download() and update.install() separately
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || -1;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            progressSetter(downloaded / contentLength);
            break;
          case 'Finished':
            console.log('download finished');
            break;
        }
      });

      console.log('update installed');
      await relaunch();
    }
  } else if (['android'].includes(currentPlatform)) {
    const currentVersion = (await getVersion()).split('.').map(Number);
    await download(
      'https://github.com/CouncilProjects/testing/releases/latest/download/latest.json',
      await join(await appCacheDir(), "latest.json"),
      ({ progressTotal, total }) =>
        console.log(`Downloaded ${progressTotal} of ${total} bytes`), // a callback that will be called with the download progress
    );

    const latest = await JSON.parse(await readTextFile(await join(await appCacheDir(), 'latest.json')));
    let newestVersion = (latest.version as string).split('.').map(Number);
    let getNew = false;
    for (let i = 0; i < Math.max(currentVersion.length, newestVersion.length); i++) {
      const curr = currentVersion[i] || 0;
      const newest = newestVersion[i] || 0;
      if (curr < newest) {
        getNew = true;
        break;
      } else if (curr > newest) {
        break;
      }
    }

    if (getNew == false) return;

    const path = await join(await appCacheDir(), "update.apk");


    await download(
      `https://github.com/CouncilProjects/testing/releases/latest/download/tauritest_${latest.version}_universal.apk`,
      path,
      ({ progressTotal, total }) => {
        console.log(`Downloaded ${progressTotal} of ${total} bytes for new apk`), // a callback that will be called with the download progress
          progressSetter(progressTotal / total);
      }
    );

    if (!(await canInstall())) {
      await requestInstallPermission();
      if (!(await canInstall())) return; // user declined
    }

    await install(path);
  }
}

