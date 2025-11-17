/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
import {useEffect} from 'react';
import {Content} from './Content';
import {ExampleImages} from './ExampleImages';
import {ExtraModeControls} from './ExtraModeControls';
import {GalleryModal} from './GalleryModal';
import {PromptModal} from './PromptModal';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import {DetectTypes} from './Types';
import {
  DetectTypeAtom,
  GalleryModalOpenAtom,
  GalleryVisibleAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  PromptModalOpenAtom,
  imageOptionsAtom,
} from './atoms';
import {fetchImageOptions} from './consts';
import {hash} from './utils';

function App() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setImageOptions] = useAtom(imageOptionsAtom);
  const [initFinished] = useAtom(InitFinishedAtom);
  const [, setDetectType] = useAtom(DetectTypeAtom);
  const [galleryVisible] = useAtom(GalleryVisibleAtom);
  const [galleryModalOpen] = useAtom(GalleryModalOpenAtom);
  const [promptModalOpen] = useAtom(PromptModalOpenAtom);

  useEffect(() => {
    if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.remove('dark');
    }
    const params = hash();
    const taskParam = params.task;

    if (taskParam) {
      let newDetectType: DetectTypes | null = null;
      switch (taskParam) {
        case '2d-bounding-boxes':
          newDetectType = '2D bounding boxes';
          break;
        case 'segmentation-masks':
          newDetectType = 'Segmentation masks';
          break;
        case 'points':
          newDetectType = 'Points';
          break;
        default:
          console.warn(`Unknown task parameter in URL hash: ${taskParam}`);
      }
      if (newDetectType) {
        setDetectType(newDetectType);
      }
    }
  }, [setDetectType]);

  // FIX: Load image options asynchronously to avoid top-level await.
  useEffect(() => {
    async function load() {
      const options = await fetchImageOptions();
      setImageOptions(options);
      setImageSrc(options[0]);
    }
    load();
  }, [setImageOptions, setImageSrc]);

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex grow flex-col border-b overflow-hidden">
        <TopBar />
        {initFinished ? <Content /> : null}
        <ExtraModeControls />
      </div>

      {galleryVisible && <ExampleImages />}

      <div className="flex shrink-0 w-full overflow-auto p-4 gap-4 items-center border-t">
        <SideControls />
      </div>
      {galleryModalOpen && <GalleryModal />}
      {promptModalOpen && <PromptModal />}
    </div>
  );
}

export default App;
