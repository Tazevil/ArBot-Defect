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
// FIX: Consume image options from the new atom.
import {
  GalleryModalOpenAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  imageOptionsAtom,
} from './atoms';
import {useResetState} from './hooks';

export function ExampleImages() {
  const [imageOptions] = useAtom(imageOptionsAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setGalleryModalOpen] = useAtom(GalleryModalOpenAtom);
  const resetState = useResetState();
  return (
    <div className="w-full bg-[var(--input-color)] border-t p-4 flex gap-4 items-center">
      <div className="flex gap-3 overflow-x-auto">
        {imageOptions.slice(0, 6).map((image) => (
          <button
            key={image}
            className="p-0 w-[56px] h-[56px] relative overflow-hidden shrink-0"
            onClick={() => {
              setIsUploadedImage(false);
              setImageSrc(image);
              resetState();
            }}>
            <img
              src={image}
              className="absolute left-0 top-0 w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      <button
        className="secondary whitespace-nowrap"
        onClick={() => setGalleryModalOpen(true)}>
        Tout voir
      </button>
    </div>
  );
}
